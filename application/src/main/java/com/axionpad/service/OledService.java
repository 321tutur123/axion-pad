package com.axionpad.service;

import com.axionpad.model.DeviceModel;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Envoie les données d'affichage à l'écran OLED SSD1306 du modèle XL.
 * Synchro RTC au démarrage + envoi périodique des stats PC toutes les 2s.
 *
 * Format commande : OLED[:CPU:75][:GPU:62][:CTEMP:68][:GTEMP:72][:RAM:67][:HHMM:1430][:DATE:25/04]
 */
public class OledService {

    private static OledService instance;

    private static final int UPDATE_INTERVAL_SEC = 2;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM");

    private final SerialService         serial = SerialService.getInstance();
    private final HardwareMonitorService hw     = HardwareMonitorService.getInstance();

    private ScheduledExecutorService scheduler;
    private String currentMode = "STATS";

    private OledService() {}

    public static OledService getInstance() {
        if (instance == null) instance = new OledService();
        return instance;
    }

    /** Appelé après connexion dès que le modèle est XL. */
    public void onConnected() {
        DeviceModel model = serial.getDetectedModel();
        if (!model.hasOled) return;
        syncRtc();
        setMode(currentMode);
        start();
    }

    public void start() {
        stop();
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "OledUpdater");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleAtFixedRate(this::sendStats, 0, UPDATE_INTERVAL_SEC, TimeUnit.SECONDS);
    }

    public void stop() {
        if (scheduler != null) {
            scheduler.shutdownNow();
            scheduler = null;
        }
    }

    /** Change le mode d'affichage (STATS | CLOCK | LOGO). */
    public void setMode(String mode) {
        currentMode = mode;
        serial.sendCommand("OLED:MODE:" + mode);
    }

    // ── Envois périodiques ────────────────────────────────────

    private void syncRtc() {
        LocalDateTime now = LocalDateTime.now();
        String cmd = String.format("SYNC:%d:%02d:%02d:%02d:%02d:%02d",
            now.getYear(), now.getMonthValue(), now.getDayOfMonth(),
            now.getHour(), now.getMinute(), now.getSecond());
        serial.sendCommand(cmd);
    }

    private void sendStats() {
        if (!serial.isConnected()) return;
        LocalDateTime now = LocalDateTime.now();

        int hhmm  = now.getHour() * 100 + now.getMinute();
        String date = now.format(DATE_FMT);

        int cpu   = hw.getCpuLoadPercent();
        int gpu   = hw.getGpuLoadPercent();
        int ctemp = hw.getCpuTempCelsius();
        int gtemp = hw.getGpuTempCelsius();
        int ram   = hw.getRamUsedPercent();

        StringBuilder cmd = new StringBuilder("OLED");
        if (cpu   >= 0) cmd.append(":CPU:").append(cpu);
        if (gpu   >= 0) cmd.append(":GPU:").append(gpu);
        if (ctemp >= 0) cmd.append(":CTEMP:").append(ctemp);
        if (gtemp >= 0) cmd.append(":GTEMP:").append(gtemp);
        if (ram   >= 0) cmd.append(":RAM:").append(ram);
        cmd.append(":HHMM:").append(hhmm);
        cmd.append(":DATE:").append(date);

        serial.sendCommand(cmd.toString());
    }
}
