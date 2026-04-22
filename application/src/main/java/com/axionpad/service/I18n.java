package com.axionpad.service;

import java.util.HashMap;
import java.util.Map;

/**
 * Internationalisation minimaliste FR / EN.
 * Appeler I18n.setLanguage("fr") ou I18n.setLanguage("en") avant de reconstruire l'UI.
 */
public class I18n {

    private static String lang = "fr";

    /** [0] = FR, [1] = EN */
    private static final Map<String, String[]> T = new HashMap<>();

    static {
        // Navigation
        T.put("nav.keys",           new String[]{"Touches (12)",            "Keys (12)"});
        T.put("nav.sliders",        new String[]{"Potentiomètres",          "Potentiometers"});
        T.put("nav.soundbar",       new String[]{"Sound Bar",               "Sound Bar"});
        T.put("nav.export",         new String[]{"Export & Flash",          "Export & Flash"});
        T.put("nav.settings",       new String[]{"Paramètres",              "Settings"});
        T.put("nav.s.config",       new String[]{"Configuration",           "Configuration"});
        T.put("nav.s.tools",        new String[]{"Outils",                  "Tools"});
        T.put("nav.s.presets",      new String[]{"Presets",                 "Presets"});
        T.put("nav.s.mypresets",    new String[]{"Mes Presets",             "My Presets"});

        // Pages
        T.put("keys.title",         new String[]{"Assignation des touches", "Key Assignment"});
        T.put("keys.desc",          new String[]{"Cliquez sur une touche pour configurer son action.",
                                                  "Click a key to configure its action."});
        T.put("sliders.title",      new String[]{"Potentiomètres",          "Potentiometers"});
        T.put("soundbar.title",     new String[]{"Sound Bar Live",          "Sound Bar Live"});
        T.put("export.title",       new String[]{"Export & Flash",          "Export & Flash"});
        T.put("settings.title",     new String[]{"Paramètres",              "Settings"});

        // Settings labels
        T.put("settings.language",  new String[]{"Langue",                  "Language"});
        T.put("settings.fontsize",  new String[]{"Taille de police",        "Font size"});
        T.put("settings.bg",        new String[]{"Fond d'écran",            "Background"});
        T.put("settings.apply",     new String[]{"Appliquer",               "Apply"});
        T.put("settings.small",     new String[]{"Petite",                  "Small"});
        T.put("settings.medium",    new String[]{"Moyenne",                 "Medium"});
        T.put("settings.large",     new String[]{"Grande",                  "Large"});
        T.put("settings.bg.space",  new String[]{"Espace",                  "Space"});
        T.put("settings.bg.purple", new String[]{"Violet",                  "Purple"});
        T.put("settings.bg.ocean",  new String[]{"Océan",                   "Ocean"});
        T.put("settings.bg.dark",    new String[]{"Sombre",                  "Dark"});
        T.put("settings.bg.crimson", new String[]{"Crimson",                 "Crimson"});
        T.put("settings.bg.emerald", new String[]{"Emerald",                 "Emerald"});
        T.put("settings.bg.sunset",  new String[]{"Sunset",                  "Sunset"});

        // Presets
        T.put("preset.streaming",   new String[]{"Streaming",               "Streaming"});
        T.put("preset.gaming",      new String[]{"Gaming",                  "Gaming"});
        T.put("preset.productivity",new String[]{"Productivité",            "Productivity"});
        T.put("preset.daw",         new String[]{"DAW / Audio",             "DAW / Audio"});
        T.put("preset.soundboard",  new String[]{"Sound Board IA",          "AI Sound Board"});
        T.put("preset.new",         new String[]{"+ Nouveau preset",        "+ New preset"});
        T.put("preset.name.prompt", new String[]{"Nom du preset...",        "Preset name..."});
        T.put("preset.save.btn",    new String[]{"Sauvegarder",             "Save"});
        T.put("preset.saved",       new String[]{"Preset créé !",           "Preset created!"});
        T.put("preset.confirm.del", new String[]{"Supprimer ce preset ?",   "Delete this preset?"});

        // Buttons
        T.put("btn.save",           new String[]{"Enregistrer",             "Save"});
        T.put("btn.cancel",         new String[]{"Annuler",                 "Cancel"});
        T.put("btn.clear",          new String[]{"Effacer",                 "Clear"});

        // Soundbar
        T.put("soundbar.edit.hint", new String[]{"✏  Modifier les canaux → aller dans Potentiomètres",
                                                  "✏  Edit channels → go to Potentiometers"});

        // Feedback
        T.put("save.ok",            new String[]{"✓  Configuration sauvegardée", "✓  Configuration saved"});
        T.put("preset.applied",     new String[]{"Preset appliqué",         "Preset applied"});
    }

    public static void setLanguage(String l) { lang = l; }
    public static String getLang()           { return lang; }

    public static String t(String key) {
        String[] arr = T.get(key);
        if (arr == null) return key;
        return "en".equals(lang) ? arr[1] : arr[0];
    }
}
