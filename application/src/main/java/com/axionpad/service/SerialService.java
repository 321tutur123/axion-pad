package com.axionpad.service;

import com.fazecast.jSerialComm.SerialPort;
import javafx.application.Platform;

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
 * Utilise jSerialComm pour la compatibilité Windows / macOS / Linux.
 * Lit le format DEEJ : "val1|val2|val3|val4\n"
 */
public class SerialService {

    private static SerialService instance;

    // On a startup launch, wait for USB drivers to finish enumerating before
    // the first connection attempt. Without this delay the scheduler latches
    // onto the wrong COM port, marks itself "connected", and never retries.
    private static final int STARTUP_DELAY_SECONDS = 12;
    private static final int POLL_INTERVAL_SECONDS  = 3;

    private SerialPort port;
    private volatile boolean running = false;
    private ExecutorService executor;
    private ScheduledExecutorService autoConnectScheduler;
    private volatile boolean connecting = false;
    private final List<Consumer<Boolean>> connectionListeners = new CopyOnWriteArrayList<>();

    // Watchdog: fires recovery if no data arrives within this window
    private static final int WATCHDOG_TIMEOUT_MS  = 5000;
    private static final int WATCHDOG_TICK_SECONDS = 2;   // check every 2s — ultra-low CPU
    private volatile long lastDataTime = 0;
    private ScheduledExecutorService watchdogScheduler;

    // Slider UI throttle — cap at 20 fps to keep CPU near zero
    private static final long SLIDER_UI_INTERVAL_MS = 50;
    private volatile long lastSliderUiTime = 0;

    // Callbacks
    private Consumer<int[]>  onSliderValues;
    private Consumer<String> onLogMessage;
    private Consumer<Boolean> onConnectionChanged;
    private Consumer<String> onStatusMessage;   // tray tooltip / status bar
    private Consumer<Boolean> onSearching;       // true = recovering/searching, false = done

    private SerialService() {}

    public static SerialService getInstance() {
        if (instance == null) instance = new SerialService();
        return instance;
    }

    /** Liste tous les ports série disponibles sur l'OS. */
    public List<String> listPorts() {
        List<String> ports = new ArrayList<>();
        for (SerialPort p : SerialPort.getCommPorts()) {
            ports.add(p.getSystemPortName() + " — " + p.getDescriptivePortName());
        }
        return ports;
    }

    /** Retourne les ports bruts (pour connexion). */
    public SerialPort[] getRawPorts() {
        return SerialPort.getCommPorts();
    }

    /** Tente de détecter automatiquement le port de l'Axion Pad. */
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

    /**
     * Ouvre la connexion série et démarre la lecture en arrière-plan.
     * @param port Port à ouvrir
     */
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
                DebugLogger.log("[connect] openPort() returned false for " + port.getSystemPortName());
                log("Impossible d'ouvrir le port " + port.getSystemPortName(), true);
                return false;
            }

            DebugLogger.log("[connect] Port opened — starting reader thread");
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
                    port.writeBytes(new byte[]{0x02}, 1);  // Ctrl+B : quitte le raw REPL
                    Thread.sleep(200);
                    port.writeBytes(new byte[]{0x04}, 1);  // Ctrl+D : soft reset → relance code.py
                    Thread.sleep(2000);                     // Attendre le redémarrage complet
                } catch (InterruptedException e) { return; }
                lastDataTime = System.currentTimeMillis();
                startWatchdog();
                readLoop();
            });
            return true;
        } finally {
            connecting = false;
        }
    }

    /** Boucle de lecture série (thread dédié). */
    private void readLoop() {
        StringBuilder buf = new StringBuilder();
        byte[] tmp = new byte[256];

        while (running && port != null && port.isOpen()) {
            try {
                int n = port.readBytes(tmp, tmp.length);
                if (n <= 0) continue;
                lastDataTime = System.currentTimeMillis();

                String chunk = new String(tmp, 0, n, java.nio.charset.StandardCharsets.UTF_8);
                buf.append(chunk.replace("\r\n", "\n").replace("\r", "\n"));

                int idx;
                while ((idx = buf.indexOf("\n")) >= 0) {
                    String line = buf.substring(0, idx).trim();
                    buf.delete(0, idx + 1);
                    if (line.isEmpty()) continue;

                    if (line.matches("\\d+\\|\\d+\\|\\d+\\|\\d+")) {
                        String[] parts = line.split("\\|");
                        int[] vals = new int[4];
                        for (int i = 0; i < 4; i++)
                            vals[i] = Math.max(0, Math.min(1023, Integer.parseInt(parts[i])));
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

    /** Ferme la connexion proprement. */
    public void disconnect() {
        boolean wasConnected = running;
        running = false;
        stopWatchdog();
        if (executor != null) { executor.shutdownNow(); executor = null; }
        if (port != null && port.isOpen()) { port.closePort(); }
        port = null;
        // Only fire the notification if we were actually connected — avoids
        // spurious "disconnected" tray popups during the startup scan.
        if (wasConnected) notifyConnection(false);
    }

    public boolean isConnected() {
        return running && port != null && port.isOpen();
    }

    // ── Watchdog ──────────────────────────────────────────────────────

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
                long elapsed = System.currentTimeMillis() - lastDataTime;
                if (elapsed > WATCHDOG_TIMEOUT_MS) {
                    DebugLogger.log("[Watchdog] Connection lost - Attempting recovery...");
                    triggerRecovery();
                }
            } catch (Throwable t) {
                DebugLogger.log("[Watchdog] Exception: " + t.getMessage());
            }
        }, WATCHDOG_TICK_SECONDS, WATCHDOG_TICK_SECONDS, TimeUnit.SECONDS);
    }

    private void stopWatchdog() {
        if (watchdogScheduler != null) {
            watchdogScheduler.shutdownNow();
            watchdogScheduler = null;
        }
    }

    /** Closes the port and signals the UI to show the recovery state. Auto-connect will reconnect. */
    private void triggerRecovery() {
        running = false;
        stopWatchdog();
        if (executor != null) { executor.shutdownNow(); executor = null; }
        if (port != null && port.isOpen()) { port.closePort(); }
        port = null;
        notifySearching(true);
        notifyConnection(false);
        notifyStatus("Connection lost — Attempting recovery...");
        log("Connection lost - Attempting recovery...", true);
    }

    // ── Notifications thread-safe (Platform.runLater) ─────────────────

    private void notifySliders(int[] vals) {
        if (onSliderValues == null) return;
        long now = System.currentTimeMillis();
        if (now - lastSliderUiTime < SLIDER_UI_INTERVAL_MS) return;
        lastSliderUiTime = now;
        Platform.runLater(() -> onSliderValues.accept(vals));
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

    // ── Setters callbacks ─────────────────────────────────────────────

    public void setOnSliderValues(Consumer<int[]> cb)       { this.onSliderValues = cb; }
    public void setOnLogMessage(Consumer<String> cb)         { this.onLogMessage = cb; }
    public void setOnConnectionChanged(Consumer<Boolean> cb) { this.onConnectionChanged = cb; }
    public void setOnStatusMessage(Consumer<String> cb)      { this.onStatusMessage = cb; }
    public void setOnSearching(Consumer<Boolean> cb)         { this.onSearching = cb; }
    public void addConnectionListener(Consumer<Boolean> cb)  { connectionListeners.add(cb); }

    // ── Auto-connect ──────────────────────────────────────────────────

    /**
     * Démarre la surveillance de connexion en arrière-plan.
     *
     * @param isStartupLaunch true quand l'app est lancée automatiquement au
     *                        démarrage Windows (flag --minimized). Un délai
     *                        initial de {@value STARTUP_DELAY_SECONDS}s laisse
     *                        le temps aux pilotes USB de s'initialiser avant
     *                        le premier scan.
     */
    public void startAutoConnect(boolean isStartupLaunch) {
        if (autoConnectScheduler != null && !autoConnectScheduler.isShutdown()) return;

        autoConnectScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "AutoConnect");
            t.setDaemon(true);
            return t;
        });

        long initialDelay = isStartupLaunch ? STARTUP_DELAY_SECONDS : 1L;

        DebugLogger.log("[startAutoConnect] isStartupLaunch=" + isStartupLaunch
                + "  initialDelay=" + initialDelay + "s  pollInterval=" + POLL_INTERVAL_SECONDS + "s");

        if (isStartupLaunch) {
            notifyStatus("Démarrage — attente des pilotes USB (" + STARTUP_DELAY_SECONDS + "s)...");
        }

        // scheduleWithFixedDelay: the next scan only begins AFTER the current one
        // finishes. This prevents overlapping attempts when connect() blocks for
        // ~2.5 s during the CircuitPython handshake.
        //
        // IMPORTANT: the entire body is wrapped in try/catch(Throwable). If any
        // unchecked exception escapes the Runnable, ScheduledExecutorService
        // silently cancels all future executions — the scheduler dies with no
        // error visible anywhere. The catch logs the exception and keeps polling.
        autoConnectScheduler.scheduleWithFixedDelay(() -> {
            try {
                if (isConnected()) return;

                notifyStatus("Recherche de l'Axion Pad...");

                SerialPort[] ports = SerialPort.getCommPorts();
                DebugLogger.log("[AutoConnect] Scan — " + ports.length + " port(s) visible");

                SerialPort target = null;
                for (SerialPort p : ports) {
                    String desc = p.getDescriptivePortName();
                    int    vid  = p.getVendorID();
                    DebugLogger.log("[AutoConnect]   " + p.getSystemPortName()
                            + " — \"" + desc + "\"  VID=0x" + String.format("%04X", vid));
                    System.out.printf("[AutoConnect] %s — \"%s\"  VID=0x%04X%n",
                        p.getSystemPortName(), desc, vid);

                    // Only connect to a confirmed AxionPad — no generic "USB Serial"
                    // fallback, which was latching onto unrelated devices on boot.
                    if (desc.contains("CircuitPython") || desc.contains("RP2040")
                            || desc.contains("Adafruit") || vid == 0x2E8A) {
                        target = p;
                        break;
                    }
                }

                if (target != null) {
                    DebugLogger.log("[AutoConnect] Match: " + target.getSystemPortName() + " — calling connect()");
                    connect(target);
                } else {
                    DebugLogger.log("[AutoConnect] No match — will retry in " + POLL_INTERVAL_SECONDS + "s");
                }

            } catch (Throwable t) {
                // Log and swallow so the scheduler stays alive for the next cycle.
                DebugLogger.log("[AutoConnect] EXCEPTION (scheduler kept alive): "
                        + t.getClass().getSimpleName() + ": " + t.getMessage());
                t.printStackTrace();
            }

        }, initialDelay, POLL_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    /** Compatibilité — équivalent à startAutoConnect(false). */
    public void startAutoConnect() {
        startAutoConnect(false);
    }

    public void stopAutoConnect() {
        stopWatchdog();
        if (autoConnectScheduler != null) {
            autoConnectScheduler.shutdownNow();
            autoConnectScheduler = null;
        }
    }
}
