package com.axionpad.service;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Lightweight file logger — writes to ~/.axionpad/debug.log (append mode).
 * Falls back to %TEMP%/axionpad-emergency.log if the primary path is unavailable.
 */
public class DebugLogger {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private static final Path LOG_DIR =
            Path.of(System.getProperty("user.home"), ".axionpad");

    private static PrintWriter writer;
    private static PrintWriter emergencyWriter;

    static {
        // Always print the resolved home so registry-launch path issues are visible in stderr.
        System.err.println("[DebugLogger] user.home=" + System.getProperty("user.home")
                + "  log=" + LOG_DIR.resolve("debug.log").toAbsolutePath());

        try {
            Files.createDirectories(LOG_DIR);
            writer = new PrintWriter(new BufferedWriter(
                    new FileWriter(LOG_DIR.resolve("debug.log").toFile(), true)));
            writeLine(writer, "=== AxionPad started " + LocalDateTime.now() + " ===");
            writeLine(writer, "[DebugLogger] log=" + LOG_DIR.resolve("debug.log").toAbsolutePath()
                    + "  user.home=" + System.getProperty("user.home"));
        } catch (IOException e) {
            System.err.println("[DebugLogger] Cannot open debug.log: " + e.getMessage());
            openEmergencyLog(e);
        }

        // Flush on JVM shutdown — prevents losing buffered lines on a crash.
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (writer != null) writer.flush();
            if (emergencyWriter != null) emergencyWriter.flush();
        }, "DebugLogger-shutdown"));
    }

    private static void openEmergencyLog(IOException cause) {
        try {
            Path tmp = Path.of(System.getProperty("java.io.tmpdir"), "axionpad-emergency.log");
            emergencyWriter = new PrintWriter(new BufferedWriter(
                    new FileWriter(tmp.toFile(), true)));
            writeLine(emergencyWriter, "=== AxionPad emergency log — main log failed ===");
            writeLine(emergencyWriter, "[DebugLogger] primary-log error: " + cause.getMessage());
            writeLine(emergencyWriter, "[DebugLogger] user.home=" + System.getProperty("user.home"));
            System.err.println("[DebugLogger] Emergency log open at " + tmp.toAbsolutePath());
        } catch (IOException ex) {
            System.err.println("[DebugLogger] Emergency log also failed: " + ex.getMessage());
        }
    }

    private static void writeLine(PrintWriter pw, String msg) {
        pw.println(LocalDateTime.now().format(FMT) + "  " + msg);
        pw.flush();
    }

    public static synchronized void log(String msg) {
        String line = LocalDateTime.now().format(FMT) + "  " + msg;
        System.out.println("[DBG] " + line);
        if (writer != null) {
            writer.println(line);
            writer.flush();
        } else if (emergencyWriter != null) {
            emergencyWriter.println(line);
            emergencyWriter.flush();
        }
    }

    /** Log a message with its full stack trace. */
    public static synchronized void log(String msg, Throwable t) {
        log(msg + " — " + t.getClass().getSimpleName() + ": " + t.getMessage());
        if (writer != null) {
            t.printStackTrace(writer);
            writer.flush();
        } else if (emergencyWriter != null) {
            t.printStackTrace(emergencyWriter);
            emergencyWriter.flush();
        }
        t.printStackTrace(System.err);
    }
}
