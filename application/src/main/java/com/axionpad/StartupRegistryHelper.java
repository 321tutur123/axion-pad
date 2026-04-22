package com.axionpad;

import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;

/**
 * Gestion du démarrage automatique de l'appli via le registre Windows.
 * Écrit dans HKCU\Software\Microsoft\Windows\CurrentVersion\Run.
 * Ne nécessite pas de droits administrateur.
 */
class StartupRegistryHelper {

    private static final String RUN_KEY =
        "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    private static final String VALUE_NAME = "AxionPad";

    static boolean isRegistered() {
        try {
            return Advapi32Util.registryValueExists(
                WinReg.HKEY_CURRENT_USER, RUN_KEY, VALUE_NAME);
        } catch (Exception e) {
            return false;
        }
    }

    static void register() {
        String exePath = System.getProperty("user.dir") + "\\AxionPadConfigurator.exe";
        try {
            Advapi32Util.registrySetStringValue(
                WinReg.HKEY_CURRENT_USER, RUN_KEY, VALUE_NAME,
                "\"" + exePath + "\" --minimized");
        } catch (Exception e) {
            System.err.println("[Startup] Erreur écriture registre : " + e.getMessage());
        }
    }

    static void unregister() {
        try {
            if (isRegistered())
                Advapi32Util.registryDeleteValue(
                    WinReg.HKEY_CURRENT_USER, RUN_KEY, VALUE_NAME);
        } catch (Exception e) {
            System.err.println("[Startup] Erreur suppression registre : " + e.getMessage());
        }
    }
}
