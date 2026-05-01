package com.axionpad;

import com.axionpad.service.DebugLogger;
import javafx.application.Application;
import java.nio.file.Files;
import java.nio.file.Path;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.Arrays;

public class Main {

    private static final File LOG = Path.of(System.getProperty("user.home"), ".axionpad", "debug.log").toFile();

    public static void main(String[] args) {
        System.setProperty("prism.order", "sw"); 

        try {
            Files.createDirectories(LOG.getParentFile().toPath());
        } catch (IOException e) {
            System.err.println("Failed to create log directory: " + e.getMessage());
        }

        DebugLogger.log("JVM Started");
        log("java.version        = " + System.getProperty("java.version"));
        log("java.home           = " + System.getProperty("java.home"));
        log("os.arch             = " + System.getProperty("os.arch"));
        log("java.library.path   = " + System.getProperty("java.library.path"));
        log("prism.order         = " + System.getProperty("prism.order"));
        log("args                = " + Arrays.toString(args));
        log(">>> Calling Application.launch() — if the log stops here, JavaFX native init hung");

        try {
            Application.launch(AxionPadApp.class, args);
            log(">>> Application.launch() returned normally — app exited cleanly.");
        } catch (Throwable t) {
            log("FATAL: " + t);
            try (PrintWriter pw = new PrintWriter(new FileWriter(LOG, true))) {
                t.printStackTrace(pw);
            } catch (IOException ignored) {}
            System.exit(1);
        }
    }

    static void log(String msg) {
        LOG.getParentFile().mkdirs();
        try (PrintWriter pw = new PrintWriter(new FileWriter(LOG, true))) {
            pw.println(msg);
        } catch (IOException ignored) {}
    }
}
