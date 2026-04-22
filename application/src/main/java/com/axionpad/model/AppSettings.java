package com.axionpad.model;

public class AppSettings {
    private String language     = "fr";     // "fr" or "en"
    private String fontSize     = "medium"; // "small", "medium", "large"
    private String bgStyle      = "space";  // "space", "purple", "ocean", "dark", "crimson", "emerald", "sunset"
    private String wallpaperPath = "";      // absolute path to custom background image (empty = none)

    public String getLanguage()              { return language; }
    public void   setLanguage(String v)      { this.language = v; }
    public String getFontSize()              { return fontSize; }
    public void   setFontSize(String v)      { this.fontSize = v; }
    public String getBgStyle()               { return bgStyle; }
    public void   setBgStyle(String v)       { this.bgStyle = v; }
    public String getWallpaperPath()         { return wallpaperPath != null ? wallpaperPath : ""; }
    public void   setWallpaperPath(String v) { this.wallpaperPath = v != null ? v : ""; }
}
