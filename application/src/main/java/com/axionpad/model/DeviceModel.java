package com.axionpad.model;

/**
 * Modèles matériels reconnus par le configurateur.
 * L'identité est diffusée par le firmware au démarrage : "AXIONPAD:MINI", etc.
 */
public enum DeviceModel {

    UNKNOWN ("Inconnu",           0,  0, false, false),
    MINI    ("AxionPad Mini",     6,  0, false, false),
    STANDARD("AxionPad Standard", 12, 4, false, true),
    XL      ("AxionPad XL",       16, 6, true,  true);

    /** Nom affiché dans l'interface. */
    public final String  displayName;
    /** Nombre de touches physiques. */
    public final int     keyCount;
    /** Nombre de potentiomètres ADC. */
    public final int     potCount;
    /** Possède un écran OLED SSD1306. */
    public final boolean hasOled;
    /** Possède des LEDs NeoPixel RGB. */
    public final boolean hasRgb;

    DeviceModel(String displayName, int keyCount, int potCount,
                boolean hasOled, boolean hasRgb) {
        this.displayName = displayName;
        this.keyCount    = keyCount;
        this.potCount    = potCount;
        this.hasOled     = hasOled;
        this.hasRgb      = hasRgb;
    }

    /**
     * Résolution depuis le token diffusé par le firmware.
     * "MINI" → MINI, "STANDARD" → STANDARD, "XL" → XL, autre → UNKNOWN.
     */
    public static DeviceModel fromString(String token) {
        if (token == null) return UNKNOWN;
        return switch (token.trim().toUpperCase()) {
            case "MINI"     -> MINI;
            case "STANDARD" -> STANDARD;
            case "XL"       -> XL;
            default         -> UNKNOWN;
        };
    }

    /**
     * Forme de la grille : [nbRangées, nbColonnes].
     * Utilisée par KeysController pour l'affichage dynamique.
     */
    public int[] gridShape() {
        return switch (this) {
            case MINI     -> new int[]{2, 3};
            case STANDARD -> new int[]{3, 4};
            case XL       -> new int[]{4, 4};
            default       -> new int[]{3, 4};
        };
    }
}
