package com.axionpad.controller;

import com.axionpad.model.KeyConfig;
import com.axionpad.model.KeyConfig.ActionType;
import com.axionpad.model.PadConfig;
import java.util.List;

public class PresetService {

    public static void apply(String presetId, PadConfig config) {
        switch (presetId) {
            case "streaming"    -> applyStreaming(config);
            case "gaming"       -> applyGaming(config);
            case "productivity" -> applyProductivity(config);
            case "daw"          -> applyDaw(config);
            case "soundboard"   -> applySoundBoard(config);
        }
    }

    // Signature complète (utilisée pour les touches AHK)
    private static void setKey(PadConfig c, int i, String lbl, ActionType t, List<String> mods, String key,
                                 String appPath, String appLbl, String muteTgt, String mediaKey, String ahkScript) {
        KeyConfig k = c.getKey(i);
        k.setLabel(lbl); k.setActionType(t); k.setModifiers(mods != null ? mods : List.of());
        k.setKey(key != null ? key : "");
        k.setAppPath(appPath != null ? appPath : "");
        k.setAppLabel(appLbl != null ? appLbl : "");
        k.setMuteTarget(muteTgt != null ? muteTgt : "master");
        k.setMediaKey(mediaKey != null ? mediaKey : "MUTE");
        k.setAhkScriptPath(ahkScript != null ? ahkScript : "");
    }

    // Surcharge rétrocompatible (sans ahkScript)
    private static void setKey(PadConfig c, int i, String lbl, ActionType t, List<String> mods, String key,
                                 String appPath, String appLbl, String muteTgt, String mediaKey) {
        setKey(c, i, lbl, t, mods, key, appPath, appLbl, muteTgt, mediaKey, null);
    }

    private static void applyStreaming(PadConfig c) {
        setKey(c,0,"Scène 1",  ActionType.KEYBOARD,null,"F13",null,null,null,null);
        setKey(c,1,"Scène 2",  ActionType.KEYBOARD,null,"F14",null,null,null,null);
        setKey(c,2,"Scène 3",  ActionType.KEYBOARD,null,"F15",null,null,null,null);
        setKey(c,3,"Scène 4",  ActionType.KEYBOARD,null,"F16",null,null,null,null);
        setKey(c,4,"Mute Micro",ActionType.MUTE,null,null,null,null,"mic",null);
        setKey(c,5,"Vol +",   ActionType.MEDIA,null,null,null,null,null,"VOLUME_INCREMENT");
        setKey(c,6,"Vol -",   ActionType.MEDIA,null,null,null,null,null,"VOLUME_DECREMENT");
        setKey(c,7,"OBS",     ActionType.APP,null,null,"C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe","OBS",null,null);
        setKey(c,8,"Rec.",    ActionType.KEYBOARD,null,"F21",null,null,null,null);
        setKey(c,9,"Play/Pause",ActionType.MEDIA,null,null,null,null,null,"PLAY_PAUSE");
        setKey(c,10,"Screenshot",ActionType.KEYBOARD,null,"F23",null,null,null,null);
        setKey(c,11,"Discord",ActionType.APP,null,null,"%LOCALAPPDATA%\\Discord\\Update.exe --processStart Discord.exe","Discord",null,null);
        c.getSlider(0).setLabel("Master");   c.getSlider(0).setChannel("master");
        c.getSlider(1).setLabel("OBS");      c.getSlider(1).setChannel("obs64.exe");
        c.getSlider(2).setLabel("Discord");  c.getSlider(2).setChannel("discord.exe");
        c.getSlider(3).setLabel("Musique");  c.getSlider(3).setChannel("spotify.exe");
    }

    private static void applyGaming(PadConfig c) {
        setKey(c,0,"Push-Talk",ActionType.KEYBOARD,null,"F13",null,null,null,null);
        setKey(c,1,"Mute",    ActionType.MUTE,null,null,null,null,"master",null);
        setKey(c,2,"Discord", ActionType.APP,null,null,"%LOCALAPPDATA%\\Discord\\Update.exe --processStart Discord.exe","Discord",null,null);
        setKey(c,3,"Vol +",   ActionType.MEDIA,null,null,null,null,null,"VOLUME_INCREMENT");
        setKey(c,4,"Vol -",   ActionType.MEDIA,null,null,null,null,null,"VOLUME_DECREMENT");
        setKey(c,5,"Play/Pause",ActionType.MEDIA,null,null,null,null,null,"PLAY_PAUSE");
        setKey(c,6,"Macro 1", ActionType.KEYBOARD,null,"F19",null,null,null,null);
        setKey(c,7,"Macro 2", ActionType.KEYBOARD,null,"F20",null,null,null,null);
        setKey(c,8,"Macro 3", ActionType.KEYBOARD,null,"F21",null,null,null,null);
        setKey(c,9,"Screenshot",ActionType.KEYBOARD,null,"F22",null,null,null,null);
        setKey(c,10,"Gest. tâches",ActionType.APP,null,null,"taskmgr.exe","Task Manager",null,null);
        setKey(c,11,"Spotify",ActionType.APP,null,null,"%APPDATA%\\Spotify\\Spotify.exe","Spotify",null,null);
        c.getSlider(0).setLabel("Master");   c.getSlider(0).setChannel("master");
        c.getSlider(1).setLabel("Jeu");      c.getSlider(1).setChannel("game");
        c.getSlider(2).setLabel("Discord");  c.getSlider(2).setChannel("discord.exe");
        c.getSlider(3).setLabel("Musique");  c.getSlider(3).setChannel("spotify.exe");
    }

    private static void applyProductivity(PadConfig c) {
        setKey(c,0,"Copier",    ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"C",null,null,null,null);
        setKey(c,1,"Coller",    ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"V",null,null,null,null);
        setKey(c,2,"Annuler",   ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"Z",null,null,null,null);
        setKey(c,3,"Refaire",   ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"Y",null,null,null,null);
        setKey(c,4,"Enregistrer",ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"S",null,null,null,null);
        setKey(c,5,"Notepad",   ActionType.APP,null,null,"notepad.exe","Notepad",null,null);
        setKey(c,6,"Calculette",ActionType.APP,null,null,"calc.exe","Calculette",null,null);
        setKey(c,7,"Bureau",    ActionType.KEYBOARD,List.of("LEFT_GUI"),"D",null,null,null,null);
        setKey(c,8,"Alt+Tab",   ActionType.KEYBOARD,List.of("LEFT_ALT"),"TAB",null,null,null,null);
        setKey(c,9,"Mute Micro",ActionType.MUTE,null,null,null,null,"mic",null);
        setKey(c,10,"Vol +",    ActionType.MEDIA,null,null,null,null,null,"VOLUME_INCREMENT");
        setKey(c,11,"Vol -",    ActionType.MEDIA,null,null,null,null,null,"VOLUME_DECREMENT");
        c.getSlider(0).setLabel("Master");   c.getSlider(0).setChannel("master");
        c.getSlider(1).setLabel("Navigateur");c.getSlider(1).setChannel("chrome.exe");
        c.getSlider(2).setLabel("Teams");    c.getSlider(2).setChannel("teams.exe");
        c.getSlider(3).setLabel("Système");  c.getSlider(3).setChannel("system");
    }

    private static void applyDaw(PadConfig c) {
        setKey(c,0,"Play",    ActionType.KEYBOARD,null,"SPACE",null,null,null,null);
        setKey(c,1,"Stop",    ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"PERIOD",null,null,null,null);
        setKey(c,2,"Rec",     ActionType.KEYBOARD,null,"F9",null,null,null,null);
        setKey(c,3,"Loop",    ActionType.KEYBOARD,null,"F10",null,null,null,null);
        setKey(c,4,"Save",    ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"S",null,null,null,null);
        setKey(c,5,"Undo",    ActionType.KEYBOARD,List.of("LEFT_CONTROL"),"Z",null,null,null,null);
        setKey(c,6,"Mute piste",ActionType.MUTE,null,null,null,null,"master",null);
        setKey(c,7,"Solo",    ActionType.KEYBOARD,null,"F15",null,null,null,null);
        setKey(c,8,"Export",  ActionType.KEYBOARD,List.of("LEFT_CONTROL","LEFT_SHIFT"),"E",null,null,null,null);
        setKey(c,9,"Métronome",ActionType.KEYBOARD,null,"F16",null,null,null,null);
        setKey(c,10,"Vol +",  ActionType.MEDIA,null,null,null,null,null,"VOLUME_INCREMENT");
        setKey(c,11,"Vol -",  ActionType.MEDIA,null,null,null,null,null,"VOLUME_DECREMENT");
        c.getSlider(0).setLabel("Master");   c.getSlider(0).setChannel("master");
        c.getSlider(1).setLabel("DAW");      c.getSlider(1).setChannel("ableton live.exe");
        c.getSlider(2).setLabel("Monitor");  c.getSlider(2).setChannel("system");
        c.getSlider(3).setLabel("Micro");    c.getSlider(3).setChannel("mic");
    }

    private static void applySoundBoard(PadConfig c) {
        // 8 déclencheurs de clips sonores (F13–F20) compatibles Voicemod / ElevenLabs / tout logiciel de doublage IA
        setKey(c,0,"Son 1",     ActionType.KEYBOARD,null,"F13",null,null,null,null);
        setKey(c,1,"Son 2",     ActionType.KEYBOARD,null,"F14",null,null,null,null);
        setKey(c,2,"Son 3",     ActionType.KEYBOARD,null,"F15",null,null,null,null);
        setKey(c,3,"Son 4",     ActionType.KEYBOARD,null,"F16",null,null,null,null);
        setKey(c,4,"Son 5",     ActionType.KEYBOARD,null,"F17",null,null,null,null);
        setKey(c,5,"Son 6",     ActionType.KEYBOARD,null,"F18",null,null,null,null);
        setKey(c,6,"Son 7",     ActionType.KEYBOARD,null,"F19",null,null,null,null);
        setKey(c,7,"Son 8",     ActionType.KEYBOARD,null,"F20",null,null,null,null);
        // Contrôles audio
        setKey(c,8,"Mute Micro",ActionType.MUTE,null,null,null,null,"mic",null);
        setKey(c,9,"Stop sons", ActionType.KEYBOARD,null,"F21",null,null,null,null);
        setKey(c,10,"Vol +",    ActionType.MEDIA,null,null,null,null,null,"VOLUME_INCREMENT");
        setKey(c,11,"Vol -",    ActionType.MEDIA,null,null,null,null,null,"VOLUME_DECREMENT");
        // Sliders : master · soundboard · micro · monitoring IA
        c.getSlider(0).setLabel("Master");     c.getSlider(0).setChannel("master");
        c.getSlider(1).setLabel("Sound Board");c.getSlider(1).setChannel("voicemod.exe");
        c.getSlider(2).setLabel("Micro");      c.getSlider(2).setChannel("mic");
        c.getSlider(3).setLabel("Monitor");    c.getSlider(3).setChannel("system");
    }
}
