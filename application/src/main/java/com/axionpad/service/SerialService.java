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

    private SerialPort port;
    private volatile boolean running = false;
    private ExecutorService executor;
    private ScheduledExecutorService autoConnectScheduler;
    private volatile boolean connecting = false;
    private final List<Consumer<Boolean>> connectionListeners = new CopyOnWriteArrayList<>();

    // Callbacks
    private Consumer<int[]>  onSliderValues;  // [512, 300, 1000, 0]
    private Consumer<String> onLogMessage;
    private Consumer<Boolean> onConnectionChanged;

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
        // Fallback : premier port disponible
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
        try {
            disconnect();
            this.port = port;
            port.setBaudRate(9600);
            port.setNumDataBits(8);
            port.setNumStopBits(SerialPort.ONE_STOP_BIT);
            port.setParity(SerialPort.NO_PARITY);
            port.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 1000, 0);

            if (!port.openPort()) {
                log("Impossible d'ouvrir le port " + port.getSystemPortName(), true);
                return false;
            }

            running = true;
            notifyConnection(true);
            log("Connecté sur " + port.getSystemPortName() + " @ 9600 baud", false);

            executor = Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "SerialReader");
                t.setDaemon(true);
                return t;
            });
            executor.submit(() -> {
                try {
                    Thread.sleep(300);
                    port.writeBytes(new byte[]{0x02}, 1);  // Ctrl+B : quitte le raw REPL → REPL interactif
                    Thread.sleep(200);
                    port.writeBytes(new byte[]{0x04}, 1);  // Ctrl+D : soft reset → relance code.py
                    Thread.sleep(2000);                     // Attendre le redémarrage complet
                } catch (InterruptedException e) { return; }
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

                // Normaliser les fins de ligne (\r\n et \r → \n)
                String chunk = new String(tmp, 0, n, java.nio.charset.StandardCharsets.UTF_8);
                buf.append(chunk.replace("\r\n", "\n").replace("\r", "\n"));

                int idx;
                while ((idx = buf.indexOf("\n")) >= 0) {
                    String line = buf.substring(0, idx).trim();
                    buf.delete(0, idx + 1);
                    if (line.isEmpty()) continue;

                    // Format DEEJ : "512|300|1000|0"
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
            log("Connexion perdue.", true);
        }
    }

    /** Ferme la connexion proprement. */
    public void disconnect() {
        running = false;
        if (executor != null) { executor.shutdownNow(); executor = null; }
        if (port != null && port.isOpen()) { port.closePort(); }
        port = null;
        notifyConnection(false);
    }

    public boolean isConnected() {
        return running && port != null && port.isOpen();
    }

    // ── Notifications thread-safe (Platform.runLater) ─────────────────

    private void notifySliders(int[] vals) {
        if (onSliderValues != null)
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

    // ── Setters callbacks ─────────────────────────────────────────────

    public void setOnSliderValues(Consumer<int[]> cb)       { this.onSliderValues = cb; }
    public void setOnLogMessage(Consumer<String> cb)         { this.onLogMessage = cb; }
    public void setOnConnectionChanged(Consumer<Boolean> cb) { this.onConnectionChanged = cb; }
    public void addConnectionListener(Consumer<Boolean> cb)  { connectionListeners.add(cb); }

    // ── Auto-connect ──────────────────────────────────────────────────

    public void startAutoConnect() {
        if (autoConnectScheduler != null && !autoConnectScheduler.isShutdown()) return;
        autoConnectScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "AutoConnect");
            t.setDaemon(true);
            return t;
        });
        autoConnectScheduler.scheduleAtFixedRate(() -> {
            if (isConnected()) return;
            SerialPort primary  = null;   // CircuitPython / RP2040 / VID 0x2E8A
            SerialPort fallback = null;   // any USB Serial device
            for (SerialPort p : SerialPort.getCommPorts()) {
                String desc = p.getDescriptivePortName();
                String vid  = p.getVendorID() >= 0
                    ? String.format("0x%04X", p.getVendorID()) : "n/a";
                System.out.println("[AutoConnect] " + p.getSystemPortName()
                    + " — \"" + desc + "\"  VID=" + vid);
                if (primary == null && (desc.contains("CircuitPython")
                        || desc.contains("RP2040")
                        || p.getVendorID() == 0x2E8A)) {
                    primary = p;
                } else if (fallback == null && desc.contains("USB Serial")) {
                    fallback = p;
                }
            }
            SerialPort target = (primary != null) ? primary : fallback;
            if (target != null) connect(target);
        }, 2, 2, TimeUnit.SECONDS);
    }

    public void stopAutoConnect() {
        if (autoConnectScheduler != null) {
            autoConnectScheduler.shutdownNow();
            autoConnectScheduler = null;
        }
    }
}
