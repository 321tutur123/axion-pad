package com.axionpad.model;

/**
 * Configuration de l'éclairage RGB NeoPixel.
 * Sérialisée dans config.json ; transmise au firmware via commandes série.
 */
public class RgbConfig {

    public enum Effect {
        OFF       ("Off"),
        STATIC    ("Statique"),
        BREATHING ("Respiration"),
        WAVE      ("Vague");

        public final String label;
        Effect(String label) { this.label = label; }
    }

    private Effect effect     = Effect.OFF;
    private int[]  color1     = {124, 58, 237};   // violet AxionPad
    private int[]  color2     = {0, 120, 255};    // bleu secondaire
    private int    brightness = 200;               // 0–255
    private int    speed      = 80;                // 0–255

    // ── Getters ──────────────────────────────────────────────

    public Effect getEffect()     { return effect     != null ? effect : Effect.OFF; }
    public int[]  getColor1()     { return color1     != null ? color1 : new int[]{124, 58, 237}; }
    public int[]  getColor2()     { return color2     != null ? color2 : new int[]{0, 120, 255}; }
    public int    getBrightness() { return brightness; }
    public int    getSpeed()      { return speed; }

    // ── Setters ──────────────────────────────────────────────

    public void setEffect(Effect e)    { this.effect     = e; }
    public void setColor1(int[] c)     { this.color1     = c; }
    public void setColor2(int[] c)     { this.color2     = c; }
    public void setBrightness(int b)   { this.brightness = Math.max(0, Math.min(255, b)); }
    public void setSpeed(int s)        { this.speed      = Math.max(0, Math.min(255, s)); }

    // ── Génération commande firmware ─────────────────────────

    /** Génère la commande série à envoyer au firmware (sans \n). */
    public String toCommand() {
        return switch (getEffect()) {
            case OFF       -> "RGB:OFF";
            case STATIC    -> "RGB:STATIC:"    + rgb(color1);
            case BREATHING -> "RGB:BREATHING:" + rgb(color1) + ":" + speed;
            case WAVE      -> "RGB:WAVE:"      + rgb(color1) + ":" + rgb(color2) + ":" + speed;
        };
    }

    private String rgb(int[] c) {
        int[] safe = (c != null && c.length >= 3) ? c : new int[]{0, 0, 0};
        return safe[0] + "," + safe[1] + "," + safe[2];
    }
}
