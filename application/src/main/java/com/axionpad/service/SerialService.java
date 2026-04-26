package com.axionpad.service;

import com.axionpad.model.DeviceModel;
import com.fazecast.jSerialComm.SerialPort;
import javafx.application.Platform;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Service de communication série avec l'Axion Pad.
 *
 * Nouveautés v2.0 :
 *  - Détection automatique du modèle depuis la ligne "AXIONPAD:MODEL"
 *  - Callback brut (onRawSliderValues) pour le contrôle du volume sans FX thread
 *  - Mode minimisé : les mises à jour UI sont suspendues → 0% CPU idle
 *  - POLL:LOW/HIGH envoyé au firmware quand la fenêtre est cachée
 *  - Détection de changement : la callback UI n'est déclenchée que si les valeurs ont changé
 *  - sendCommand() pour RGB / OLED / SYNC
 */
public class SerialService {

    private static SerialService instance;

    private static final int STARTUP_DELAY_SECONDS = 12;
    private static final int POLL_INTERVAL_SECONDS  = 3;

    private SerialPort port;
    private volatile boolean running    = false;
    private ExecutorService  executor;
    private ScheduledExecutorService autoConnectScheduler;
    private ScheduledExecutorService identificationScheduler;
    private volatile boolean connecting = false;
    private final List<Consumer<Boolean>> connectionListeners = new CopyOnWriteArrayList<>();

    // Watchdog
    private static final int WATCHDOG_TIMEOUT_MS  = 5000;
    private static final int WATCHDOG_TICK_SECONDS = 2;
    private volatile long lastDataTime = 0;
    private ScheduledExecutorService watchdogScheduler;

    // UI throttle — 20 fps max
    private static final long SLIDER_UI_INTERVAL_MS = 50;
    private volatile long lastSliderUiTime = 0;

    // ── Nouveaux champs v2.0 ──────────────────────────────────

    /** Suspend toutes les mises à jour UI (FX thread). Le volume reste fonctionnel. */
    private volatile boolean uiMinimized = false;

    /** Modèle détecté depuis la ligne d'identification firmware. */
    private volatile DeviceModel detectedModel = DeviceModel.UNKNOWN;

    /** Dernières valeurs connues : déclenche la callback UI seulement en cas de changement. */
    private volatile int[] lastSliderVals = null;

    // ── Callbacks ─────────────────────────────────────────────

    private Consumer<int[]>       onSliderValues;      // UI (FX thread, throttlé)
    private Consumer<int[]>       onRawSliderValues;   // volume/fonctionnel (thread série)
    private Consumer<String>      onLogMessage;
    private Consumer<Boolean>     onConnectionChanged;
    private Consumer<String>      onStatusMessage;
    private Consumer<Boolean>     onSearching;
    private Consumer<DeviceModel> onModelDetected;     // appelé quand le firmware annonce son modèle

    private SerialService() {}

    public static SerialService getInstance() {
        if (instance == null) instance = new SerialService();
        return instance;
    }

    // ── Port listing ──────────────────────────────────────────

    public List<String> listPorts() {
        List<String> ports = new ArrayList<>();
        for (SerialPort p : SerialPort.getCommPorts())
            ports.add(p.getSystemPortName() + " — " + p.getDescriptivePortName());
        return ports;
    }

    public SerialPort[] getRawPorts() { return SerialPort.getCommPorts(); }

    public SerialPort autoDetectPort() {
        for (SerialPort p : SerialPort.getCommPorts()) {
            String desc = p.getDescriptivePortName().toLowerCase();
            String name = p.getSystemPortName().toLowerCase();
            if (desc.contains("circuitpython") || desc.contains("rp2040")
                    || desc.contains("circuit") || desc.contains("adafruit")
                    || name.contains("usbmodem") || name.contains("cu.usbmodem")) {
                return p;
            }
        }
        SerialPort[] all = SerialPort.getCommPorts();
        return all.length > 0 ? all[0] : null;
    }

    // ── Connexion ─────────────────────────────────────────────

    public boolean connect(SerialPort port) {
        if (connecting) return false;
        connecting = true;
        DebugLogger.log("[connect] Opening " + port.getSystemPortName()
                + " \"" + port.getDescriptivePortName() + "\"");
        try {
            disconnect();
            this.port = port;
            port.setBaudRate(9600);
            port.setNumDataBits(8);
            port.setNumStopBits(SerialPort.ONE_STOP_BIT);
            port.setParity(SerialPort.NO_PARITY);
            port.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0);

            if (!port.openPort()) {
                DebugLogger.log("[connect] openPort() returned false");
                log("Impossible d'ouvrir le port " + port.getSystemPortName(), true);
                return false;
            }

            running = true;
            notifySearching(false);
            notifyConnection(true);
            notifyStatus("Connecté — " + port.getSystemPortName());
            log("Connecté sur " + port.getSystemPortName() + " @ 9600 baud", false);

            executor = Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "SerialReader");
                t.setDaemon(true);
                return t;
            });
            executor.submit(() -> {
                try {
                    Thread.sleep(300);
                    port.writeBytes(new byte[]{0x02}, 1);  // Ctrl+B
                    Thread.sleep(200);
                    port.writeBytes(new byte[]{0x04}, 1);  // Ctrl+D (soft reset)
                    Thread.sleep(2000);
                } catch (InterruptedException e) { return; }
                lastDataTime = System.currentTimeMillis();
                startWatchdog();
                startIdentification();
                readLoop();
            });
            return true;
        } finally {
            connecting = false;
        }
    }

    // ── Boucle de lecture ─────────────────────────────────────

    private void readLoop() {
        StringBuilder buf = new StringBuilder();
        byte[] tmp = new byte[256];

        while (running && port != null && port.isOpen()) {
            try {
                int n = port.readBytes(tmp, tmp.length);
                if (n <= 0) continue;
                lastDataTime = System.currentTimeMillis();

                String chunk = new String(tmp, 0, n, StandardCharsets.UTF_8);
                buf.append(chunk.replace("\r\n", "\n").replace("\r", "\n"));

                int idx;
                while ((idx = buf.indexOf("\n")) >= 0) {
                    String line = buf.substring(0, idx).trim();
                    buf.delete(0, idx + 1);
                    if (line.isEmpty()) continue;

                    // ── Identification modèle ────────────────
                    if (line.startsWith("AXIONPAD:") && !line.equals("AXIONPAD:READY")) {
                        String token = line.substring("AXIONPAD:".length());
                        DeviceModel model = DeviceModel.fromString(token);
                        detectedModel = model;
                        stopIdentification();
                        DebugLogger.log("[readLoop] Model detected: " + model);
                        if (onModelDetected != null)
                            Platform.runLater(() -> onModelDetected.accept(model));
                        continue;
                    }

                    // ── Données ADC (N valeurs séparées par |) ─
                    if (line.matches("\\d+(\\|\\d+)*")) {
                        String[] parts = line.split("\\|");
                        int[] vals = new int[parts.length];
                        for (int i = 0; i < parts.length; i++)
                            vals[i] = Math.max(0, Math.min(1023, Integer.parseInt(parts[i])));

                        // Callback brut sur le thread série (volume, pas de FX overhead)
                        if (onRawSliderValues != null)
                            onRawSliderValues.accept(vals);

                        // Callback UI throttlé + détection de changement
                        notifySliders(vals);
                    } else {
                        log(line, false);
                    }
                }
            } catch (Exception e) {
                if (running) {
                    log("Erreur lecture: " + e.getMessage(), true);
                    break;
                }
            }
        }

        if (running) {
            running = false;
            notifyConnection(false);
            notifyStatus("Déconnecté — relance de la recherche...");
            log("Connexion perdue.", true);
        }
    }

    // ── Envoi de commande au firmware ─────────────────────────

    /** Envoie une commande au firmware (RGB, OLED, POLL, SYNC). Sans \n terminal. */
    public void sendCommand(String cmd) {
        if (port == null || !port.isOpen()) return;
        try {
            byte[] data = (cmd + "\n").getBytes(StandardCharsets.UTF_8);
            port.writeBytes(data, data.length);
            DebugLogger.log("[sendCommand] → " + cmd);
        } catch (Exception e) {
            DebugLogger.log("[sendCommand] Error: " + e.getMessage());
        }
    }

    // ── Mode minimisé ─────────────────────────────────────────

    /**
     * Active/désactive le mode minimisé.
     * Quand actif : les callbacks UI ne sont plus émis (0% CPU JavaFX).
     * Le firmware reçoit POLL:LOW (0.5 Hz) pour réduire le trafic USB.
     */
    public void setUiMinimized(boolean minimized) {
        this.uiMinimized = minimized;
        this.lastSliderVals = null; // force refresh lors du retour au premier plan
        if (isConnected()) sendCommand(minimized ? "POLL:LOW" : "POLL:HIGH");
    }

    // ── Déconnexion ───────────────────────────────────────────

    public void disconnect() {
        boolean wasConnected = running;
        running = false;
        detectedModel = DeviceModel.UNKNOWN;
        stopIdentification();
        stopWatchdog();
        if (executor != null) { executor.shutdownNow(); executor = null; }
        if (port != null && port.isOpen()) port.closePort();
        port = null;
        if (wasConnected) notifyConnection(false);
    }

    public boolean isConnected() {
        return running && port != null && port.isOpen();
    }

    // ── Watchdog ──────────────────────────────────────────────

    private void startWatchdog() {
        stopWatchdog();
        watchdogScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "SerialWatchdog");
            t.setDaemon(true);
            return t;
        });
        watchdogScheduler.scheduleAtFixedRate(() -> {
            try {
                if (!running) return;
                if (System.currentTimeMillis() - lastDataTime > WATCHDOG_TIMEOUT_MS)
                    triggerRecovery();
            } catch (Throwable t) {
                DebugLogger.log("[Watchdog] Exception: " + t.getMessage());
            }
        }, WATCHDOG_TICK_SECONDS, WATCHDOG_TICK_SECONDS, TimeUnit.SECONDS);
    }

    private void stopWatchdog() {
        if (watchdogScheduler != null) { watchdogScheduler.shutdownNow(); watchdogScheduler = null; }
    }

    // ── Identification handshake ──────────────────────────────

    private void startIdentification() {
        stopIdentification();
        identificationScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "DeviceIdentification");
            t.setDaemon(true);
            return t;
        });
        identificationScheduler.scheduleAtFixedRate(() -> {
            if (detectedModel != DeviceModel.UNKNOWN) {
                stopIdentification();
                return;
            }
            sendCommand("WHO_ARE_YOU");
            DebugLogger.log("[Identification] Sent WHO_ARE_YOU");
        }, 0, 2, TimeUnit.SECONDS);
    }

    private void stopIdentification() {
        if (identificationScheduler != null) {
            identificationScheduler.shutdownNow();
            identificationScheduler = null;
        }
    }

    private void triggerRecovery() {
        running = false;
        detectedModel = DeviceModel.UNKNOWN;
        stopIdentification();
        stopWatchdog();
        if (executor != null) { executor.shutdownNow(); executor = null; }
        if (port != null && port.isOpen()) port.closePort();
        port = null;
        notifySearching(true);
        notifyConnection(false);
        notifyStatus("Connection lost — Attempting recovery...");
        log("Connection lost - Attempting recovery...", true);
    }

    // ── Notifications ─────────────────────────────────────────

    private void notifySliders(int[] vals) {
        if (onSliderValues == null) return;
        // Suspend UI quand la fenêtre est cachée
        if (uiMinimized) return;
        // Détection de changement — évite les runLater inutiles au repos
        if (lastSliderVals != null && lastSliderVals.length == vals.length) {
            boolean changed = false;
            for (int i = 0; i < vals.length; i++) {
                if (vals[i] != lastSliderVals[i]) { changed = true; break; }
            }
            if (!changed) return;
        }
        lastSliderVals = vals.clone();
        // Throttle 20 fps
        long now = System.currentTimeMillis();
        if (now - lastSliderUiTime < SLIDER_UI_INTERVAL_MS) return;
        lastSliderUiTime = now;
        final int[] snapshot = vals.clone();
        Platform.runLater(() -> onSliderValues.accept(snapshot));
    }

    private void log(String msg, boolean error) {
        if (onLogMessage != null)
            Platform.runLater(() -> onLogMessage.accept((error ? "[ERR] " : "[INFO] ") + msg));
    }

    private void notifyConnection(boolean connected) {
        if (onConnectionChanged != null)
            Platform.runLater(() -> onConnectionChanged.accept(connected));
        for (Consumer<Boolean> l : connectionListeners)
            Platform.runLater(() -> l.accept(connected));
    }

    private void notifyStatus(String status) {
        if (onStatusMessage != null)
            Platform.runLater(() -> onStatusMessage.accept(status));
    }

    private void notifySearching(boolean searching) {
        if (onSearching != null)
            Platform.runLater(() -> onSearching.accept(searching));
    }

    // ── Setters callbacks ─────────────────────────────────────

    public void setOnSliderValues(Consumer<int[]> cb)        { this.onSliderValues     = cb; }
    public void setOnRawSliderValues(Consumer<int[]> cb)     { this.onRawSliderValues  = cb; }
    public void setOnLogMessage(Consumer<String> cb)          { this.onLogMessage       = cb; }
    public void setOnConnectionChanged(Consumer<Boolean> cb)  { this.onConnectionChanged = cb; }
    public void setOnStatusMessage(Consumer<String> cb)       { this.onStatusMessage    = cb; }
    public void setOnSearching(Consumer<Boolean> cb)          { this.onSearching        = cb; }
    public void setOnModelDetected(Consumer<DeviceModel> cb)  { this.onModelDetected    = cb; }
    public void addConnectionListener(Consumer<Boolean> cb)   { connectionListeners.add(cb); }

    // ── Getters ───────────────────────────────────────────────

    public DeviceModel getDetectedModel() { return detectedModel; }
    public boolean     isUiMinimized()    { return uiMinimized; }

    // ── Auto-connect ──────────────────────────────────────────

    public void startAutoConnect(boolean isStartupLaunch) {
        if (autoConnectScheduler != null && !autoConnectScheduler.isShutdown()) return;

        autoConnectScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "AutoConnect");
            t.setDaemon(true);
            return t;
        });

        long initialDelay = isStartupLaunch ? STARTUP_DELAY_SECONDS : 1L;
        DebugLogger.log("[startAutoConnect] isStartupLaunch=" + isStartupLaunch
                + "  initialDelay=" + initialDelay + "s");

        if (isStartupLaunch)
            notifyStatus("Démarrage — attente des pilotes USB (" + STARTUP_DELAY_SECONDS + "s)...");

        autoConnectScheduler.scheduleWithFixedDelay(() -> {
            try {
                if (isConnected()) return;
                notifyStatus("Recherche de l'Axion Pad...");

                SerialPort[] ports = SerialPort.getCommPorts();
                DebugLogger.log("[AutoConnect] Scan — " + ports.length + " port(s)");

                SerialPort target = null;
                for (SerialPort p : ports) {
                    String desc = p.getDescriptivePortName();
                    int    vid  = p.getVendorID();
                    DebugLogger.log("[AutoConnect]   " + p.getSystemPortName()
                            + " — \"" + desc + "\"  VID=0x" + String.format("%04X", vid));

                    if (desc.contains("CircuitPython") || desc.contains("RP2040")
                            || desc.contains("Adafruit") || vid == 0x2E8A) {
                        target = p;
                        break;
                    }
                }

                if (target != null) {
                    DebugLogger.log("[AutoConnect] Match: " + target.getSystemPortName());
                    connect(target);
                } else {
                    DebugLogger.log("[AutoConnect] No match — retry in " + POLL_INTERVAL_SECONDS + "s");
                }

            } catch (Throwable t) {
                DebugLogger.log("[AutoConnect] EXCEPTION (scheduler kept alive): "
                        + t.getClass().getSimpleName() + ": " + t.getMessage());
            }
        }, initialDelay, POLL_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    public void startAutoConnect() { startAutoConnect(false); }

    public void stopAutoConnect() {
        stopWatchdog();
        if (autoConnectScheduler != null) {
            autoConnectScheduler.shutdownNow();
            autoConnectScheduler = null;
        }
    }
}
