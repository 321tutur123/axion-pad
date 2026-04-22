package com.axionpad.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Modèle de configuration d'une touche du pad.
 */
public class KeyConfig {

    public enum ActionType {
        KEYBOARD,   // Raccourci clavier
        APP,        // Lancer une application
        MUTE,       // Mute audio
        MEDIA,      // Touche multimédia
        AUTOHOTKEY  // Script AutoHotkey
    }

    private int index;           // 0-11
    private String label;        // Nom affiché
    private ActionType actionType;
    private List<String> modifiers;  // ex: ["LEFT_CONTROL", "LEFT_SHIFT"]
    private String key;              // ex: "F13", "A", "SPACE"
    private String appPath;          // Chemin de l'application
    private String appLabel;         // Nom affiché de l'app
    private String muteTarget;       // "master", "mic", "discord", "system"
    private String mediaKey;         // "MUTE", "VOLUME_INCREMENT", etc.
    private String ahkScriptPath;    // Chemin du script AutoHotkey (.ahk)

    public KeyConfig(int index) {
        this.index = index;
        this.label = "";
        this.actionType = ActionType.KEYBOARD;
        this.modifiers = new ArrayList<>();
        this.key = "F" + (13 + index);
        this.appPath = "";
        this.appLabel = "";
        this.muteTarget = "master";
        this.mediaKey = "MUTE";
        this.ahkScriptPath = "";
    }

    /** Retourne la représentation textuelle du raccourci. */
    public String getComboString() {
        StringBuilder sb = new StringBuilder();
        for (String mod : modifiers) {
            sb.append(modDisplayName(mod)).append("+");
        }
        if (key != null && !key.isEmpty()) sb.append(key);
        return sb.toString();
    }

    private String modDisplayName(String mod) {
        return switch (mod) {
            case "LEFT_CONTROL" -> "Ctrl";
            case "LEFT_SHIFT"   -> "Shift";
            case "LEFT_ALT"     -> "Alt";
            case "LEFT_GUI"     -> "Win";
            default -> mod;
        };
    }

    /** Génère la ligne KEY_MAP pour code.py */
    public String toPythonLine() {
        String comment = label.isEmpty() ? "Touche " + (index + 1) : label;
        return switch (actionType) {
            case MEDIA      -> "";  // Géré dans CC_MAP via toCCLine()
            case MUTE       -> String.format("    %d: [Keycode.F%d],  # %s → MUTE %s", index, 13 + index, comment, muteTarget);
            case APP        -> String.format("    %d: [Keycode.F%d],  # %s → LAUNCH: %s", index, 13 + index, comment, appPath);
            case AUTOHOTKEY -> String.format("    %d: [Keycode.F%d],  # %s → AHK: %s", index, 13 + index, comment, getAhkScriptPath());
            case KEYBOARD   -> {
                if (key == null || key.isEmpty()) yield "";
                StringBuilder sb = new StringBuilder("    ").append(index).append(": [");
                for (String mod : modifiers) sb.append("Keycode.").append(mod).append(", ");
                sb.append("Keycode.").append(key).append("],  # ").append(comment);
                yield sb.toString();
            }
        };
    }

    /** Génère la ligne CC_MAP pour code.py (touches média ConsumerControl uniquement) */
    public String toCCLine() {
        if (actionType != ActionType.MEDIA) return "";
        String comment = label.isEmpty() ? "Touche " + (index + 1) : label;
        return String.format("    %d: ConsumerControlCode.%s,  # %s", index, mediaKey, comment);
    }

    // ── Getters / Setters ─────────────────────────────────────────────

    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }

    public List<String> getModifiers() { return modifiers; }
    public void setModifiers(List<String> modifiers) { this.modifiers = modifiers; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getAppPath() { return appPath; }
    public void setAppPath(String appPath) { this.appPath = appPath; }

    public String getAppLabel() { return appLabel; }
    public void setAppLabel(String appLabel) { this.appLabel = appLabel; }

    public String getMuteTarget() { return muteTarget; }
    public void setMuteTarget(String muteTarget) { this.muteTarget = muteTarget; }

    public String getMediaKey() { return mediaKey; }
    public void setMediaKey(String mediaKey) { this.mediaKey = mediaKey; }

    public String getAhkScriptPath() { return ahkScriptPath != null ? ahkScriptPath : ""; }
    public void setAhkScriptPath(String ahkScriptPath) { this.ahkScriptPath = ahkScriptPath; }
}
