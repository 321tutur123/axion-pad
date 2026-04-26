package com.axionpad;

import com.axionpad.service.ConfigService;
import com.axionpad.service.DebugLogger;
import com.axionpad.service.I18n;
import com.axionpad.service.KeyHookService;
import com.axionpad.service.OledService;
import com.axionpad.service.OpenRgbServer;
import com.axionpad.service.RgbService;
import com.axionpad.service.SerialService;
import com.axionpad.service.SettingsService;
import com.axionpad.service.WindowsVolumeService;
import com.axionpad.view.MainWindow;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.stage.Stage;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.InputStream;

/**
 * Application JavaFX principale — AxionPad Configurator
 * Lance dans le system tray, démarre invisible.
 */
public class AxionPadApp extends Application {

    private TrayIcon trayIcon;
    private volatile boolean shuttingDown = false;

    @Override
    public void start(Stage primaryStage) throws Exception {
        // Force DebugLogger to initialize before any other service so that
        // failures in those services are captured in the log file.
        DebugLogger.log("[AxionPadApp] start() — logger online");

        try {
            // Empêche JavaFX de quitter quand la fenêtre est cachée
            Platform.setImplicitExit(false);

            // Ensures cleanup runs even on SIGTERM / Task-Manager kill
            Runtime.getRuntime().addShutdownHook(new Thread(this::performCleanup, "ShutdownHook"));

            // Services core
            SettingsService.getInstance().load();
            I18n.setLanguage(SettingsService.getInstance().getSettings().getLanguage());
            ConfigService.getInstance().load();
            KeyHookService.getInstance().start();

            // Injecter la config RGB dans RgbService (avant la connexion)
            RgbService.getInstance().init(ConfigService.getInstance().getConfig().getRgb());

            // Démarrer le serveur HTTP RGB (SignalRGB / OpenRGB)
            OpenRgbServer.getInstance().start();

            // Câblage des services RGB et OLED sur chaque connexion
            SerialService.getInstance().addConnectionListener(connected -> {
                if (connected) {
                    RgbService.getInstance().onConnected();
                    OledService.getInstance().onConnected();
                } else {
                    OledService.getInstance().stop();
                }
            });

            boolean minimized = getParameters().getRaw().contains("--minimized");
            DebugLogger.log("[AxionPadApp] start()  args=" + getParameters().getRaw()
                    + "  minimized=" + minimized);

            // Fenêtre principale — initialisée sans flash en mode minimized
            MainWindow mainWindow = new MainWindow(primaryStage, ConfigService.getInstance());
            if (minimized) {
                mainWindow.initScene();
            } else {
                mainWindow.show();
                primaryStage.hide();
            }

            // Mode minimisé → 0% CPU idle : suspend les callbacks UI FX + POLL:LOW firmware
            primaryStage.showingProperty().addListener((obs, wasShowing, isShowing) ->
                SerialService.getInstance().setUiMinimized(!isShowing));

            // System tray
            if (SystemTray.isSupported()) {
                setupSystemTray(primaryStage);
            } else {
                primaryStage.show();
            }

            // Auto-connexion en arrière-plan
            SerialService.getInstance().startAutoConnect(minimized);

        } catch (Throwable t) {
            // Catch-all so the crash is written to the debug log AND stderr before
            // JavaFX swallows the exception. SerialService is started here too so
            // the scheduler isn't skipped due to an earlier failure.
            DebugLogger.log("[AxionPadApp] FATAL startup exception", t);
            System.err.println("[AxionPadApp] FATAL: " + t);
            throw t;  // Re-throw so JavaFX / the launcher still sees the failure.
        }
    }

    // ── System tray ───────────────────────────────────────────────────

    private void setupSystemTray(Stage stage) {
        Image img = loadTrayImage();

        PopupMenu popup = new PopupMenu();

        MenuItem openItem = new MenuItem("Ouvrir la configuration");
        openItem.addActionListener(e -> Platform.runLater(() -> {
            stage.show();
            stage.toFront();
        }));

        CheckboxMenuItem startupItem = new CheckboxMenuItem("Démarrer avec Windows");
        startupItem.setState(StartupRegistryHelper.isRegistered());
        startupItem.addItemListener(e -> {
            if (startupItem.getState()) StartupRegistryHelper.register();
            else                        StartupRegistryHelper.unregister();
        });

        MenuItem quitItem = new MenuItem("Quitter");
        quitItem.addActionListener(e -> fullExit());

        popup.add(openItem);
        popup.addSeparator();
        popup.add(startupItem);
        popup.addSeparator();
        popup.add(quitItem);

        trayIcon = new TrayIcon(img, "AxionPad Configurator", popup);
        trayIcon.setImageAutoSize(true);
        // Double-clic → ouvrir la fenêtre
        trayIcon.addActionListener(e -> Platform.runLater(() -> {
            stage.show();
            stage.toFront();
        }));

        try {
            SystemTray.getSystemTray().add(trayIcon);
        } catch (AWTException e) {
            System.err.println("[Tray] Impossible d'ajouter l'icône : " + e.getMessage());
        }

        // Notifications de connexion/déconnexion série
        SerialService.getInstance().addConnectionListener(connected -> {
            if (trayIcon == null) return;
            trayIcon.setToolTip("Axion Pad — " + (connected ? "Connecté" : "Déconnecté"));
            trayIcon.displayMessage(
                "AxionPad Configurator",
                connected ? "Axion Pad connecté" : "Axion Pad déconnecté",
                connected ? TrayIcon.MessageType.INFO : TrayIcon.MessageType.WARNING
            );
        });

        // Status de recherche → tooltip tray (pas de popup)
        SerialService.getInstance().setOnStatusMessage(status -> {
            if (trayIcon != null) trayIcon.setToolTip("Axion Pad — " + status);
        });

        // Démarrer caché dans le tray
        Platform.runLater(stage::hide);
    }

    private Image loadTrayImage() {
        // Try primary logo first
        try (InputStream is = getClass()
                .getResourceAsStream("/com/axionpad/icons/logo1.png")) {
            if (is != null) return ImageIO.read(is);
        } catch (Exception ignored) {}
        // Fallback to legacy tray icon
        try (InputStream is = getClass()
                .getResourceAsStream("/com/axionpad/icons/axionpad_tray.png")) {
            if (is != null) return ImageIO.read(is);
        } catch (Exception ignored) {}
        // Last resort: generated purple square
        BufferedImage fb = new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = fb.createGraphics();
        g.setColor(new Color(99, 102, 241));
        g.fillRect(0, 0, 32, 32);
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 10));
        g.drawString("AP", 5, 21);
        g.dispose();
        return fb;
    }

    // ── Cleanup complet ───────────────────────────────────────────────

    /**
     * Idempotent — safe to call from fullExit(), stop(), and the shutdown hook.
     * Removes the tray icon so the non-daemon AWT EventQueue thread can exit.
     */
    private void performCleanup() {
        if (shuttingDown) return;
        shuttingDown = true;
        OledService.getInstance().stop();
        OpenRgbServer.getInstance().stop();
        KeyHookService.getInstance().stop();
        WindowsVolumeService.getInstance().close();
        SerialService.getInstance().stopAutoConnect();
        SerialService.getInstance().disconnect();
        ConfigService.getInstance().save();
        if (trayIcon != null) {
            SystemTray.getSystemTray().remove(trayIcon);
            trayIcon = null;
        }
    }

    private void fullExit() {
        performCleanup();
        Platform.exit();
        System.exit(0);
    }

    @Override
    public void stop() {
        performCleanup();
        // System.exit is required: the non-daemon AWT SystemTray thread keeps the
        // JVM alive indefinitely after Platform.exit() unless we force a JVM halt.
        System.exit(0);
    }
}
