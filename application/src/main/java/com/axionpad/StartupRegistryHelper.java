package com.axionpad;

import com.axionpad.service.DebugLogger;
import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

/**
 * Manages auto-start via a .bat file in the Windows per-user Startup folder:
 *   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AxionPad.bat
 *
 * No admin rights required. The bat uses "timeout /t 10 /nobreak" to let
 * the session stabilise before javaw.exe is launched detached via START.
 */
public class StartupRegistryHelper {

    private static final String RUN_KEY =
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    private static final String VALUE_NAME = "AxionPad";
    private static final String BAT_NAME   = "AxionPad.bat";

    public enum RepairResult { OK, NO_PATH, REGISTRY_ERROR }

    // ── Path helpers ──────────────────────────────────────────────────

    public static String getRunningExePath() {
        Optional<String> cmd = ProcessHandle.current().info().command();
        if (cmd.isPresent()) {
            String path = cmd.get();
            DebugLogger.log("[StartupRegistry] ProcessHandle.command=" + path);
            if (path.toLowerCase().endsWith(".exe")) return path;
        }
        try {
            java.net.URL loc = StartupRegistryHelper.class
                .getProtectionDomain().getCodeSource().getLocation();
            String path = new File(loc.toURI()).getAbsolutePath();
            DebugLogger.log("[StartupRegistry] CodeSource fallback=" + path);
            return path;
        } catch (Exception e) {
            DebugLogger.log("[StartupRegistry] getRunningExePath failed", e);
            return null;
        }
    }

    private static Path getStartupBatPath() {
        String appData = System.getenv("APPDATA");
        if (appData == null || appData.isBlank())
            appData = System.getProperty("user.home") + "\\AppData\\Roaming";
        return Paths.get(appData,
            "Microsoft", "Windows", "Start Menu", "Programs", "Startup", BAT_NAME);
    }

    // ── Bat content builder ───────────────────────────────────────────

    static String buildBatContent(String exePath) {
        StringBuilder sb = new StringBuilder();
        sb.append("@echo off\r\n");
        sb.append("timeout /t 10 /nobreak\r\n");
        if (exePath.toLowerCase().endsWith(".exe")) {
            sb.append("start \"\" \"").append(exePath).append("\" --minimized\r\n");
        } else {
            String javaw = System.getProperty("java.home") + "\\bin\\javaw.exe";
            sb.append("start \"\" \"").append(javaw).append("\"")
              .append(" -Xms32m -Xmx256m -Dprism.order=sw")
              .append(" -jar \"").append(exePath).append("\"")
              .append(" --minimized\r\n");
        }
        return sb.toString();
    }

    // ── Registry cleanup (legacy) ─────────────────────────────────────

    private static void removeRegistryEntry() {
        try {
            if (Advapi32Util.registryValueExists(
                    WinReg.HKEY_CURRENT_USER, RUN_KEY, VALUE_NAME)) {
                Advapi32Util.registryDeleteValue(
                    WinReg.HKEY_CURRENT_USER, RUN_KEY, VALUE_NAME);
                DebugLogger.log("[StartupRegistry] Removed stale Registry Run entry");
            }
        } catch (Exception e) {
            DebugLogger.log("[StartupRegistry] removeRegistryEntry failed (non-fatal)", e);
        }
    }

    // ── Public API ────────────────────────────────────────────────────

    public static boolean isRegistered() {
        return Files.exists(getStartupBatPath());
    }

    public static void register() {
        String exePath = getRunningExePath();
        if (exePath == null) {
            DebugLogger.log("[StartupRegistry] register() — could not resolve path");
            return;
        }
        writeBat(exePath);
    }

    public static void unregister() {
        Path bat = getStartupBatPath();
        try {
            if (Files.exists(bat)) {
                Files.delete(bat);
                DebugLogger.log("[StartupRegistry] Deleted startup bat → " + bat);
            }
        } catch (IOException e) {
            DebugLogger.log("[StartupRegistry] unregister() failed", e);
        }
    }

    // ── Repair ───────────────────────────────────────────────────────

    public static RepairResult repair() {
        String exePath = getRunningExePath();
        if (exePath == null) {
            DebugLogger.log("[StartupRegistry] repair() — no path found");
            return RepairResult.NO_PATH;
        }

        // Remove any leftover Registry Run entry from the old approach
        removeRegistryEntry();

        // Write (or overwrite) the Startup bat file
        boolean written = writeBat(exePath);
        if (!written) return RepairResult.REGISTRY_ERROR;

        // Kill stale instances of the same EXE/JAR
        long myPid = ProcessHandle.current().pid();
        String myExeName = new File(exePath).getName().toLowerCase();
        ProcessHandle.allProcesses()
            .filter(p -> p.pid() != myPid)
            .filter(p -> p.info().command()
                .map(c -> new File(c).getName().toLowerCase().equals(myExeName))
                .orElse(false))
            .forEach(p -> {
                DebugLogger.log("[StartupRegistry] repair() killing stale instance pid=" + p.pid());
                p.destroyForcibly();
            });

        DebugLogger.log("[StartupRegistry] repair() complete — bat=" + getStartupBatPath());
        return RepairResult.OK;
    }

    // ── Internal ──────────────────────────────────────────────────────

    private static boolean writeBat(String exePath) {
        Path bat = getStartupBatPath();
        String content = buildBatContent(exePath);
        try {
            Files.writeString(bat, content, StandardCharsets.US_ASCII);
            DebugLogger.log("[StartupRegistry] Wrote startup bat → " + bat);
            return true;
        } catch (IOException e) {
            DebugLogger.log("[StartupRegistry] writeBat failed → " + bat, e);
            return false;
        }
    }
}
