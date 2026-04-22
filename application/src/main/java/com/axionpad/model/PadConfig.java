package com.axionpad.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration complète du pad : layers dynamiques + 4 sliders + presets.
 */
public class PadConfig {

    // ─────────────────────────────────────────────────────────────────────
    //  Inner classes
    // ─────────────────────────────────────────────────────────────────────

    /** Snapshot de la config pour un preset utilisateur. */
    public static class UserPreset {
        private String id;
        private String name;
        private List<KeyConfig> keys;
        private List<SliderConfig> sliders;

        public UserPreset() {}

        public UserPreset(String id, String name,
                          List<KeyConfig> keys, List<SliderConfig> sliders) {
            this.id = id; this.name = name;
            this.keys = keys; this.sliders = sliders;
        }

        public String getId()                  { return id; }
        public String getName()                { return name; }
        public List<KeyConfig> getKeys()       { return keys; }
        public List<SliderConfig> getSliders() { return sliders; }

        public void setId(String id)     { this.id = id; }
        public void setName(String name) { this.name = name; }
    }

    /** Un layer (calque) : nom + 12 touches configurables. */
    public static class Layer {
        private String name;
        private List<KeyConfig> keys;

        public Layer() {}

        public Layer(String name) {
            this.name = name;
            this.keys = new ArrayList<>();
            for (int i = 0; i < 12; i++) this.keys.add(new KeyConfig(i));
        }

        public String getName() { return name != null ? name : "Layer"; }
        public void setName(String n) { this.name = n; }

        public List<KeyConfig> getKeys() {
            if (keys == null || keys.size() < 12) {
                keys = new ArrayList<>();
                for (int i = 0; i < 12; i++) keys.add(new KeyConfig(i));
            }
            return keys;
        }
        public void setKeys(List<KeyConfig> k) { this.keys = k; }

        public KeyConfig getKey(int i) { return getKeys().get(i); }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Fields
    // ─────────────────────────────────────────────────────────────────────

    private String version     = "1.0.0";
    private String profileName = "Défaut";

    /** Primary layer list (v2+). */
    private List<Layer> layers;

    /** Legacy fields — read-only by Gson for migration from old JSON. */
    private List<KeyConfig> keys;
    private List<KeyConfig> layer2;
    private List<KeyConfig> layer3;

    private List<SliderConfig> sliders;
    private List<UserPreset>   userPresets = new ArrayList<>();

    public PadConfig() {
        sliders = new ArrayList<>();
        for (int i = 0; i < 4; i++) sliders.add(new SliderConfig(i));
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Layer management
    // ─────────────────────────────────────────────────────────────────────

    /** Returns the live layer list, migrating from legacy fields if needed. */
    public List<Layer> getLayers() {
        if (layers == null || layers.isEmpty()) {
            layers = new ArrayList<>();
            Layer l1 = new Layer("Layer 1");
            if (keys != null && keys.size() == 12) l1.setKeys(keys);
            layers.add(l1);
            if (layer2 != null && layer2.size() == 12) {
                Layer l2 = new Layer("Layer 2"); l2.setKeys(layer2); layers.add(l2);
            }
            if (layer3 != null && layer3.size() == 12) {
                Layer l3 = new Layer("Layer 3"); l3.setKeys(layer3); layers.add(l3);
            }
        }
        return layers;
    }

    public Layer getLayer(int index) {
        List<Layer> ls = getLayers();
        if (index < 0 || index >= ls.size()) return ls.get(0);
        return ls.get(index);
    }

    public KeyConfig getLayerKey(int layerIndex, int keyIndex) {
        return getLayer(layerIndex).getKey(keyIndex);
    }

    /** Adds a new layer with the given name. */
    public void addLayer(String name) {
        getLayers().add(new Layer(name));
    }

    /**
     * Removes the layer at index.
     * Returns false if only one layer remains or index is out of range.
     */
    public boolean removeLayer(int index) {
        List<Layer> ls = getLayers();
        if (ls.size() <= 1 || index < 0 || index >= ls.size()) return false;
        ls.remove(index);
        return true;
    }

    /** Renames the layer at index. */
    public void renameLayer(int index, String name) {
        if (!name.isBlank()) getLayer(index).setName(name);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Code generation
    // ─────────────────────────────────────────────────────────────────────

    /** Generates code.py for Layer 1 (the layer active on the physical device). */
    public String generateCodePy() {
        List<KeyConfig> activeKeys = getLayer(0).getKeys();

        boolean hasMedia = activeKeys.stream().anyMatch(k -> k.getActionType() == KeyConfig.ActionType.MEDIA);
        boolean hasApps  = activeKeys.stream().anyMatch(k -> k.getActionType() == KeyConfig.ActionType.APP && !k.getAppPath().isEmpty());

        StringBuilder sb = new StringBuilder();
        sb.append("import time\n");
        sb.append("import board\n");
        sb.append("import digitalio\n");
        sb.append("import analogio\n");
        sb.append("import adafruit_matrixkeypad\n");
        sb.append("import usb_hid\n");
        sb.append("from adafruit_hid.keyboard import Keyboard\n");
        sb.append("from adafruit_hid.keycode import Keycode\n");
        if (hasMedia) {
            sb.append("from adafruit_hid.consumer_control import ConsumerControl\n");
            sb.append("from adafruit_hid.consumer_control_code import ConsumerControlCode\n");
        }
        sb.append("\n");
        sb.append("# ============================================\n");
        sb.append("#   AXION PAD — Généré par Axion Pad Configurator\n");
        sb.append("#   Profil : ").append(profileName).append("\n");
        sb.append("# ============================================\n\n");

        if (hasApps) {
            sb.append("# Lanceurs d'application (lier via PowerToys / AutoHotkey)\n");
            for (KeyConfig k : activeKeys) {
                if (k.getActionType() == KeyConfig.ActionType.APP && !k.getAppPath().isEmpty())
                    sb.append("# T").append(k.getIndex() + 1).append(" → ").append(k.getAppPath()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("# Matrice 3x4\n");
        sb.append("cols = [digitalio.DigitalInOut(x) for x in (board.GP8, board.GP9, board.GP10, board.GP11)]\n");
        sb.append("rows = [digitalio.DigitalInOut(x) for x in (board.GP7, board.GP6, board.GP5)]\n");
        sb.append("keys = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]\n");
        sb.append("keypad = adafruit_matrixkeypad.Matrix_Keypad(rows, cols, keys)\n\n");

        sb.append("# Potentiomètres ADC\n");
        sb.append("sliders = [\n");
        for (SliderConfig s : sliders) sb.append(s.toPythonLine()).append("\n");
        sb.append("]\n\n");

        sb.append("kbd = Keyboard(usb_hid.devices)\n");
        if (hasMedia) sb.append("cc = ConsumerControl(usb_hid.devices)\n");
        sb.append("\n");

        sb.append("# Touches clavier (index 0–11)\n");
        sb.append("KEY_MAP = {\n");
        for (KeyConfig k : activeKeys) {
            String line = k.toPythonLine();
            if (!line.isEmpty()) sb.append(line).append("\n");
        }
        sb.append("}\n\n");

        if (hasMedia) {
            sb.append("# Touches média (ConsumerControl)\n");
            sb.append("CC_MAP = {\n");
            for (KeyConfig k : activeKeys) {
                String line = k.toCCLine();
                if (!line.isEmpty()) sb.append(line).append("\n");
            }
            sb.append("}\n\n");
        }

        sb.append("print(\"Axion Pad pret.\")\n");
        sb.append("last_pressed = set()\n\n");
        sb.append("while True:\n");
        sb.append("    cur = set(keypad.pressed_keys)\n");
        sb.append("    for k in cur - last_pressed:\n");
        sb.append("        idx = k - 1\n");
        sb.append("        if idx in KEY_MAP:\n");
        sb.append("            kbd.press(*KEY_MAP[idx])\n");
        if (hasMedia) {
            sb.append("        elif idx in CC_MAP:\n");
            sb.append("            cc.send(CC_MAP[idx])\n");
        }
        sb.append("    for k in last_pressed - cur:\n");
        sb.append("        idx = k - 1\n");
        sb.append("        if idx in KEY_MAP:\n");
        sb.append("            kbd.release(*KEY_MAP[idx])\n");
        sb.append("    last_pressed = cur\n\n");
        sb.append("    vals = [str(int(s.value / 64)) for s in sliders]\n");
        sb.append("    print(\"|\".join(vals))\n");
        sb.append("    time.sleep(0.01)\n");

        return sb.toString();
    }

    /** Génère le deej-config.yaml */
    public String generateDeejYaml() {
        StringBuilder sb = new StringBuilder();
        sb.append("# deej-config.yaml — Axion Pad Configurator\n");
        sb.append("# Profil : ").append(profileName).append("\n\n");
        sb.append("slider_mapping:\n");
        for (SliderConfig s : sliders) sb.append(s.toYamlLine()).append("\n");
        sb.append("\nnoise_reduction_level: 5\n");
        sb.append("polling_rate_hz: 100\n");
        sb.append("com_port: auto\n");
        sb.append("invert_sliders: false\n");
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Getters / Setters
    // ─────────────────────────────────────────────────────────────────────

    public String getVersion()     { return version; }
    public String getProfileName() { return profileName; }
    public void setProfileName(String p) { this.profileName = p; }

    /** Delegates to Layer 1 for backward compatibility. */
    public List<KeyConfig> getKeys() { return getLayer(0).getKeys(); }
    public KeyConfig getKey(int i)   { return getLayer(0).getKey(i); }

    public List<SliderConfig> getSliders() { return sliders; }
    public SliderConfig getSlider(int i)   { return sliders.get(i); }

    public List<UserPreset> getUserPresets() {
        if (userPresets == null) userPresets = new ArrayList<>();
        return userPresets;
    }
}
