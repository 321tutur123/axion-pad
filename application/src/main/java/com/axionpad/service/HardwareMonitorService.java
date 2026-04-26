package com.axionpad.service;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;

/**
 * Lit les métriques hardware du PC hôte pour l'affichage OLED XL.
 *
 * Sources disponibles :
 *   CPU load  — com.sun.management.OperatingSystemMXBean (toutes plateformes)
 *   RAM usage — com.sun.management.OperatingSystemMXBean (toutes plateformes)
 *   CPU temp  — retourne -1 (nécessite OSHI ou WMI — non inclus dans cette build)
 *   GPU       — retourne -1 (nécessite NVML/ADL — non inclus dans cette build)
 *
 * Pour activer les températures : ajouter la dépendance com.github.oshi:oshi-core
 * et remplacer getCpuTempCelsius() / getGpuTempCelsius().
 */
public class HardwareMonitorService {

    private static HardwareMonitorService instance;

    private final com.sun.management.OperatingSystemMXBean osMxBean;

    @SuppressWarnings("unchecked")
    private HardwareMonitorService() {
        com.sun.management.OperatingSystemMXBean bean = null;
        try {
            OperatingSystemMXBean raw = ManagementFactory.getOperatingSystemMXBean();
            if (raw instanceof com.sun.management.OperatingSystemMXBean castBean) {
                bean = castBean;
            }
        } catch (Exception ignored) {}
        this.osMxBean = bean;
    }

    public static HardwareMonitorService getInstance() {
        if (instance == null) instance = new HardwareMonitorService();
        return instance;
    }

    // ── CPU ───────────────────────────────────────────────────

    /** Charge CPU système en % (0–100), ou -1 si indisponible. */
    public int getCpuLoadPercent() {
        if (osMxBean == null) return -1;
        try {
            double v = osMxBean.getCpuLoad();
            return (v >= 0) ? (int) Math.round(v * 100.0) : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    /** Température CPU en °C. Retourne -1 (pas de dépendance OSHI/WMI). */
    public int getCpuTempCelsius() {
        return -1;
    }

    // ── RAM ───────────────────────────────────────────────────

    /** RAM système utilisée en % (0–100), ou -1 si indisponible. */
    public int getRamUsedPercent() {
        if (osMxBean == null) return -1;
        try {
            long total = osMxBean.getTotalMemorySize();
            long free  = osMxBean.getFreeMemorySize();
            return (total > 0) ? (int) Math.round(100.0 * (total - free) / total) : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    // ── GPU ───────────────────────────────────────────────────

    /** Charge GPU en %. Retourne -1 (pas de dépendance NVML/ADL). */
    public int getGpuLoadPercent() {
        return -1;
    }

    /** Température GPU en °C. Retourne -1 (pas de dépendance NVML/ADL). */
    public int getGpuTempCelsius() {
        return -1;
    }
}
