package com.axionpad;

import com.axionpad.service.ConfigService;
import com.axionpad.service.I18n;
import com.axionpad.service.KeyHookService;
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
 * Application JavaFX principale — Axion Pad Configurator
 * Lance dans le system tray, démarre invisible.
 */
public class AxionPadApp extends Application {

    private TrayIcon trayIcon;

    @Override
    public void start(Stage primaryStage) throws Exception {
        // Empêche JavaFX de quitter quand la fenêtre est cachée
        Platform.setImplicitExit(false);

        // Services
        SettingsService.getInstance().load();
        I18n.setLanguage(SettingsService.getInstance().getSettings().getLanguage());
        ConfigService.getInstance().load();
        KeyHookService.getInstance().start();

        boolean minimized = getParameters().getRaw().contains("--minimized");

        // Fenêtre principale — initialisée sans flash en mode minimized
        MainWindow mainWindow = new MainWindow(primaryStage, ConfigService.getInstance());
        if (minimized) {
            mainWindow.initScene();   // construit la scène sans appeler stage.show()
        } else {
            mainWindow.show();
            primaryStage.hide();
        }

        // System tray
        if (SystemTray.isSupported()) {
            setupSystemTray(primaryStage);
        } else {
            primaryStage.show();
        }

        // Auto-connexion en arrière-plan
        SerialService.getInstance().startAutoConnect(minimized);
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

        trayIcon = new TrayIcon(img, "Axion Pad Configurator", popup);
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
                "Axion Pad Configurator",
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

    private void fullExit() {
        KeyHookService.getInstance().stop();
        WindowsVolumeService.getInstance().close();
        SerialService.getInstance().stopAutoConnect();
        SerialService.getInstance().disconnect();
        ConfigService.getInstance().save();
        if (trayIcon != null) SystemTray.getSystemTray().remove(trayIcon);
        Platform.exit();
        System.exit(0);
    }

    @Override
    public void stop() {
        KeyHookService.getInstance().stop();
        WindowsVolumeService.getInstance().close();
        SerialService.getInstance().stopAutoConnect();
        SerialService.getInstance().disconnect();
        ConfigService.getInstance().save();
    }
}
