package com.axionpad.service;

import com.axionpad.model.DeviceModel;
import com.axionpad.model.KeyConfig;
import com.axionpad.model.PadConfig;
import com.axionpad.model.SliderConfig;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service de persistance de la configuration (JSON).
 * Sauvegarde dans le dossier utilisateur : ~/.axionpad/config.json
 */
public class ConfigService {

    private static ConfigService instance;
    private PadConfig config;
    private final Gson gson;
    private final Path configDir;
    private final Path configFile;

    private ConfigService() {
        gson = new GsonBuilder().setPrettyPrinting().create();
        String home = System.getProperty("user.home");
        configDir  = Paths.get(home, ".axionpad");
        configFile = configDir.resolve("config.json");
    }

    public static ConfigService getInstance() {
        if (instance == null) instance = new ConfigService();
        return instance;
    }

    /** Charge la config depuis le disque, ou crée une config par défaut. */
    public void load() {
        try {
            if (Files.exists(configFile)) {
                String json = Files.readString(configFile);
                config = gson.fromJson(json, PadConfig.class);
                // Re-lier les index et garantir des listes mutables
                for (int i = 0; i < config.getKeys().size(); i++) {
                    KeyConfig k = config.getKey(i);
                    k.setIndex(i);
                    // Gson peut désérialiser en liste interne immuable → forcer ArrayList
                    if (!(k.getModifiers() instanceof ArrayList))
                        k.setModifiers(new ArrayList<>(k.getModifiers()));
                }
            } else {
                config = new PadConfig();
            }
        } catch (Exception e) {
            System.err.println("[ConfigService] Erreur chargement: " + e.getMessage());
            config = new PadConfig();
        }
    }

    /** Sauvegarde la config sur le disque. */
    public void save() {
        try {
            Files.createDirectories(configDir);
            Files.writeString(configFile, gson.toJson(config));
        } catch (IOException e) {
            System.err.println("[ConfigService] Erreur sauvegarde: " + e.getMessage());
        }
    }

    /**
     * Retourne le contenu du firmware statique embarqué dans le JAR.
     * Ce firmware envoie toujours F13–F24 ; la logique des touches est côté hôte.
     */
    public String getStaticFirmware() {
        try (InputStream is = ConfigService.class
                .getResourceAsStream("/com/axionpad/firmware/code.py")) {
            if (is == null) throw new IOException("Ressource firmware/code.py introuvable");
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[ConfigService] " + e.getMessage());
            return "# ERREUR : firmware introuvable\n";
        }
    }

    /** Exporte code.py (firmware statique) vers un fichier donné. */
    public void exportCodePy(File dest) throws IOException {
        Files.writeString(dest.toPath(), getStaticFirmware());
    }

    /** Exporte deej-config.yaml vers un fichier donné. */
    public void exportDeejYaml(File dest) throws IOException {
        Files.writeString(dest.toPath(), config.generateDeejYaml());
    }

    /**
     * Cherche le lecteur CIRCUITPY parmi A:-Z:.
     * Un lecteur CIRCUITPY contient toujours boot_out.txt à la racine.
     * @return le File du lecteur, ou null si non trouvé.
     */
    public File findCircuitPyDrive() {
        for (char c = 'A'; c <= 'Z'; c++) {
            File drive = new File(c + ":\\");
            if (new File(drive, "boot_out.txt").exists()) {
                return drive;
            }
        }
        return null;
    }

    /**
     * Génère code.py et l'écrit directement sur le lecteur CIRCUITPY.
     * CircuitPython détecte le changement et redémarre automatiquement.
     * @return null si succès, message d'erreur sinon.
     */
    public String flashCodePy() {
        File drive = findCircuitPyDrive();
        if (drive == null) {
            return "Lecteur CIRCUITPY introuvable.\n"
                 + "Vérifiez que le pad est branché en USB et visible dans l'Explorateur.";
        }
        try {
            Files.writeString(new File(drive, "code.py").toPath(), getStaticFirmware());
            return null; // succès
        } catch (IOException e) {
            return "Erreur d'écriture sur " + drive.getPath() + " :\n" + e.getMessage();
        }
    }

    public PadConfig getConfig() { return config; }

    // ── Model-aware initialisation ────────────────────────────────────

    /**
     * Ajuste le nombre de sliders dans la config en fonction du modèle détecté.
     * Étend la liste si nécessaire ; ne la rétrécit pas pour préserver les données.
     */
    public void initSlidersForModel(DeviceModel model) {
        if (model == DeviceModel.UNKNOWN) return;
        config.ensureSliderCount(model.potCount);
        RgbService.getInstance().init(config.getRgb());
    }

    // ── User Presets ─────────────────────────────────────────────────

    /** Crée un snapshot de la config actuelle et l'ajoute aux presets utilisateur. */
    public void addUserPreset(String name) {
        List<KeyConfig> keysCopy = new ArrayList<>();
        for (KeyConfig orig : config.getKeys()) {
            KeyConfig copy = new KeyConfig(orig.getIndex());
            copy.setLabel(orig.getLabel());
            copy.setActionType(orig.getActionType());
            copy.setModifiers(new ArrayList<>(orig.getModifiers()));
            copy.setKey(orig.getKey());
            copy.setAppPath(orig.getAppPath());
            copy.setAppLabel(orig.getAppLabel());
            copy.setMuteTarget(orig.getMuteTarget());
            copy.setMediaKey(orig.getMediaKey());
            keysCopy.add(copy);
        }
        List<SliderConfig> slidersCopy = new ArrayList<>();
        for (SliderConfig s : config.getSliders()) {
            SliderConfig sc = new SliderConfig(s.getIndex());
            sc.setLabel(s.getLabel());
            sc.setChannel(s.getChannel());
            sc.setMuted(s.isMuted());
            slidersCopy.add(sc);
        }
        String id = UUID.randomUUID().toString().substring(0, 8);
        config.getUserPresets().add(new PadConfig.UserPreset(id, name, keysCopy, slidersCopy));
        save();
    }

    /** Applique un preset utilisateur à la config courante. */
    public void applyUserPreset(PadConfig.UserPreset preset) {
        List<KeyConfig> keys = config.getKeys();
        List<KeyConfig> src  = preset.getKeys();
        for (int i = 0; i < Math.min(keys.size(), src.size()); i++) {
            KeyConfig o = src.get(i), t = keys.get(i);
            t.setLabel(o.getLabel());
            t.setActionType(o.getActionType());
            t.setModifiers(new ArrayList<>(o.getModifiers()));
            t.setKey(o.getKey());
            t.setAppPath(o.getAppPath());
            t.setAppLabel(o.getAppLabel());
            t.setMuteTarget(o.getMuteTarget());
            t.setMediaKey(o.getMediaKey());
        }
        List<SliderConfig> sliders = config.getSliders();
        List<SliderConfig> ss      = preset.getSliders();
        if (ss != null) {
            for (int i = 0; i < Math.min(sliders.size(), ss.size()); i++) {
                SliderConfig o = ss.get(i), t = sliders.get(i);
                t.setLabel(o.getLabel());
                t.setChannel(o.getChannel());
                t.setMuted(o.isMuted());
            }
        }
        save();
    }

    /** Supprime un preset utilisateur par id. */
    public void deleteUserPreset(String id) {
        config.getUserPresets().removeIf(p -> id.equals(p.getId()));
        save();
    }

    /** Renomme un preset utilisateur. */
    public void renameUserPreset(String id, String newName) {
        config.getUserPresets().stream()
            .filter(p -> id.equals(p.getId()))
            .findFirst()
            .ifPresent(p -> p.setName(newName));
        save();
    }

    /** Exporte un preset utilisateur vers un fichier JSON. */
    public void exportUserPreset(PadConfig.UserPreset preset, File dest) throws IOException {
        Files.writeString(dest.toPath(), gson.toJson(preset));
    }

    /**
     * Importe un preset depuis un fichier JSON et l'ajoute aux presets utilisateur.
     * Un nouvel identifiant est généré pour éviter toute collision.
     */
    public PadConfig.UserPreset importUserPreset(File src) throws IOException {
        String json = Files.readString(src.toPath());
        PadConfig.UserPreset preset = gson.fromJson(json, PadConfig.UserPreset.class);
        preset.setId(UUID.randomUUID().toString().substring(0, 8));
        // S'assurer que les listes de modificateurs sont mutables
        if (preset.getKeys() != null) {
            for (KeyConfig k : preset.getKeys()) {
                if (k.getModifiers() != null && !(k.getModifiers() instanceof ArrayList))
                    k.setModifiers(new ArrayList<>(k.getModifiers()));
            }
        }
        config.getUserPresets().add(preset);
        save();
        return preset;
    }
}
