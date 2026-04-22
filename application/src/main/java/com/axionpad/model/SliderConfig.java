package com.axionpad.model;

/**
 * Modèle de configuration d'un potentiomètre (canal DEEJ).
 */
public class SliderConfig {

    private int index;      // 0-3
    private String label;   // Nom affiché
    private String channel; // Canal DEEJ (ex: "master", "spotify.exe")
    private boolean muted;
    private int currentValue; // 0-1023 (dernière valeur reçue)

    // Pins ADC associées
    private static final String[] PINS = {"GP26/A0", "GP27/A1", "GP28/A2", "GP29/A3"};
    private static final String[] CP_BOARDS = {"board.GP26", "board.GP27", "board.GP28", "board.GP29"};

    public SliderConfig(int index) {
        this.index = index;
        this.label = defaultLabel(index);
        this.channel = defaultChannel(index);
        this.muted = false;
        this.currentValue = 512;
    }

    private String defaultLabel(int i) {
        return switch (i) {
            case 0 -> "Master";
            case 1 -> "Musique";
            case 2 -> "Discord";
            case 3 -> "Navigateur";
            default -> "Canal " + (i + 1);
        };
    }

    private String defaultChannel(int i) {
        return switch (i) {
            case 0 -> "master";
            case 1 -> "spotify.exe";
            case 2 -> "discord.exe";
            case 3 -> "chrome.exe";
            default -> "system";
        };
    }

    /** Génère la ligne Python pour code.py */
    public String toPythonLine() {
        return String.format("    analogio.AnalogIn(%s),  # POT%d %s → %s",
                CP_BOARDS[index], index + 1, label, channel);
    }

    /** Génère la ligne YAML pour deej-config.yaml */
    public String toYamlLine() {
        return String.format("  %d: %s  # %s", index, channel, label);
    }

    public int getPercentage() {
        return (int) Math.round(currentValue / 10.23);
    }

    public String getPinLabel() { return PINS[index]; }

    // ── Getters / Setters ─────────────────────────────────────────────

    public int getIndex() { return index; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public boolean isMuted() { return muted; }
    public void setMuted(boolean muted) { this.muted = muted; }
    public int getCurrentValue() { return currentValue; }
    public void setCurrentValue(int currentValue) { this.currentValue = Math.max(0, Math.min(1023, currentValue)); }
}
