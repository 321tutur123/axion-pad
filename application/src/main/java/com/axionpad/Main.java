package com.axionpad;
import com.axionpad.controller.ExportController;
import com.axionpad.controller.SimulatorController;
import com.axionpad.controller.PresetService;
import javafx.application.Application;

/**
 * Point d'entrée séparé pour compatibilité avec les fat JARs.
 * JavaFX nécessite que la classe principale ne soit PAS une sous-classe
 * directe d'Application dans un JAR sans module-info.
 */
public class Main {
    public static void main(String[] args) {
        Application.launch(AxionPadApp.class, args);
    }
}
