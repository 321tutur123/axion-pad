package com.axionpad.service;

import java.awt.Desktop;
import java.io.File;

/**
 * Lance des applications de manière cross-platform.
 */
public class AppLauncherService {

    private static AppLauncherService instance;

    private AppLauncherService() {}

    public static AppLauncherService getInstance() {
        if (instance == null) instance = new AppLauncherService();
        return instance;
    }

    /**
     * Lance une application à partir de son chemin.
     * Gère Windows (.exe), macOS (.app), Linux (binaire).
     */
    public boolean launch(String path) {
        if (path == null || path.isBlank()) return false;
        try {
            String os = System.getProperty("os.name").toLowerCase();
            ProcessBuilder pb;

            if (os.contains("win")) {
                // Windows : cmd /c start pour gérer les espaces et %VARS%
                pb = new ProcessBuilder("cmd", "/c", "start", "", path);
            } else if (os.contains("mac")) {
                // macOS : open pour les .app, sinon exec direct
                if (path.endsWith(".app")) {
                    pb = new ProcessBuilder("open", path);
                } else {
                    pb = new ProcessBuilder(path);
                }
            } else {
                // Linux : exec direct, ou xdg-open si pas de permission directe
                File f = new File(path);
                if (f.canExecute()) {
                    pb = new ProcessBuilder(path);
                } else {
                    pb = new ProcessBuilder("xdg-open", path);
                }
            }

            pb.start();
            return true;
        } catch (Exception e) {
            System.err.println("[AppLauncher] Erreur lancement " + path + ": " + e.getMessage());
            return false;
        }
    }

    /** Ouvre l'explorateur de fichiers sur un dossier. */
    public void openFolder(File folder) {
        try {
            Desktop.getDesktop().open(folder);
        } catch (Exception e) {
            System.err.println("[AppLauncher] Impossible d'ouvrir: " + folder);
        }
    }
}
