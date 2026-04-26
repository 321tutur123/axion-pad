package com.axionpad.service;

import com.axionpad.model.DeviceModel;
import com.axionpad.model.RgbConfig;

/**
 * Pilote l'éclairage RGB NeoPixel via le port série.
 * Ré-applique la config persistée à chaque reconnexion.
 */
public class RgbService {

    private static RgbService instance;
    private final SerialService serial = SerialService.getInstance();
    private RgbConfig config;

    private RgbService() {}

    public static RgbService getInstance() {
        if (instance == null) instance = new RgbService();
        return instance;
    }

    /** Injecte la config persistée (appelé au démarrage depuis ConfigService). */
    public void init(RgbConfig config) {
        this.config = config;
    }

    /** Appelé par SerialService dès qu'une connexion est établie et le modèle détecté. */
    public void onConnected() {
        DeviceModel model = serial.getDetectedModel();
        if (model.hasRgb && config != null) {
            applyConfig();
        }
    }

    /** Envoie brightness + effet courants au firmware. */
    public void applyConfig() {
        if (config == null || !serial.isConnected()) return;
        serial.sendCommand("RGB:BRIGHT:" + config.getBrightness());
        serial.sendCommand(config.toCommand());
    }

    /**
     * Envoie un effet immédiatement et met à jour la config en mémoire.
     * L'appelant est responsable de persister via ConfigService.save().
     */
    public void sendEffect(RgbConfig.Effect effect,
                           int[] color1, int[] color2,
                           int speed, int brightness) {
        if (config == null) config = new RgbConfig();
        config.setEffect(effect);
        config.setColor1(color1);
        config.setColor2(color2);
        config.setSpeed(speed);
        config.setBrightness(brightness);
        applyConfig();
    }

    public RgbConfig getConfig() { return config; }
}
