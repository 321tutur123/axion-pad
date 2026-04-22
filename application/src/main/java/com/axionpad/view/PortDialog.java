package com.axionpad.view;

import com.axionpad.service.SerialService;
import com.fazecast.jSerialComm.SerialPort;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.util.Optional;

/**
 * Dialogue de sélection du port série.
 */
public class PortDialog {

    private final Stage owner;
    private final SerialService serialService;
    private SerialPort selected;
    private Stage dialog;

    public PortDialog(Stage owner, SerialService serialService) {
        this.owner = owner;
        this.serialService = serialService;
    }

    public Optional<SerialPort> showAndWait() {
        dialog = new Stage();
        dialog.initModality(Modality.APPLICATION_MODAL);
        dialog.initOwner(owner);
        dialog.setTitle("Connecter l'Axion Pad");
        dialog.setResizable(false);

        VBox root = new VBox(16);
        root.getStyleClass().add("dialog-root");
        root.setPadding(new Insets(24));
        root.setPrefWidth(420);

        Label title = new Label("Sélectionner le port série");
        title.getStyleClass().add("dialog-title");

        Label desc = new Label("Sélectionne le port COM correspondant à ton Axion Pad. Le port détecté automatiquement est présélectionné.");
        desc.getStyleClass().add("dialog-desc");
        desc.setWrapText(true);

        // Port list
        ListView<String> portList = new ListView<>();
        portList.getStyleClass().add("port-list");
        portList.setPrefHeight(160);

        SerialPort[] ports = serialService.getRawPorts();
        for (SerialPort p : ports) {
            portList.getItems().add(p.getSystemPortName() + " — " + p.getDescriptivePortName());
        }

        // Auto-detect
        SerialPort autoPort = serialService.autoDetectPort();
        if (autoPort != null) {
            for (int i = 0; i < ports.length; i++) {
                if (ports[i].getSystemPortName().equals(autoPort.getSystemPortName())) {
                    portList.getSelectionModel().select(i);
                    break;
                }
            }
        } else if (!portList.getItems().isEmpty()) {
            portList.getSelectionModel().select(0);
        }

        if (portList.getItems().isEmpty()) {
            portList.getItems().add("Aucun port détecté");
        }

        // Refresh button
        Button refreshBtn = new Button("🔄 Rafraîchir");
        refreshBtn.getStyleClass().add("btn");
        refreshBtn.setOnAction(e -> {
            portList.getItems().clear();
            for (SerialPort p : serialService.getRawPorts())
                portList.getItems().add(p.getSystemPortName() + " — " + p.getDescriptivePortName());
            if (portList.getItems().isEmpty()) portList.getItems().add("Aucun port détecté");
            else portList.getSelectionModel().select(0);
        });

        // Buttons
        Button connectBtn = new Button("Connecter");
        Button cancelBtn  = new Button("Annuler");
        connectBtn.getStyleClass().addAll("btn", "btn-primary");
        cancelBtn.getStyleClass().add("btn");

        connectBtn.setOnAction(e -> {
            int idx = portList.getSelectionModel().getSelectedIndex();
            SerialPort[] current = serialService.getRawPorts();
            if (idx >= 0 && idx < current.length) {
                selected = current[idx];
                dialog.close();
            }
        });
        cancelBtn.setOnAction(e -> dialog.close());

        HBox btnRow = new HBox(10, connectBtn, cancelBtn, new Region(), refreshBtn);
        HBox.setHgrow(btnRow.getChildren().get(2), Priority.ALWAYS);
        btnRow.setAlignment(Pos.CENTER_LEFT);

        root.getChildren().addAll(title, desc, portList, btnRow);

        Scene scene = new Scene(root);
        scene.getStylesheets().add(getClass().getResource("/com/axionpad/css/dark.css").toExternalForm());
        dialog.setScene(scene);
        dialog.showAndWait();

        return Optional.ofNullable(selected);
    }
}

// ══════════════════════════════════════════════════════════════════════

/**
 * Dialogue d'alerte simple.
 */
class AlertDialog {
    private final Stage owner;
    private final String title;
    private final String message;

    AlertDialog(Stage owner, String title, String message) {
        this.owner = owner; this.title = title; this.message = message;
    }

    void show() {
        Stage dialog = new Stage();
        dialog.initModality(Modality.APPLICATION_MODAL);
        dialog.initOwner(owner);
        dialog.setTitle(title);
        dialog.setResizable(false);

        VBox root = new VBox(16);
        root.getStyleClass().add("dialog-root");
        root.setPadding(new Insets(24));
        root.setPrefWidth(360);

        Label lbl = new Label(message);
        lbl.getStyleClass().add("dialog-desc");
        lbl.setWrapText(true);

        Button ok = new Button("OK");
        ok.getStyleClass().addAll("btn","btn-primary");
        ok.setOnAction(e -> dialog.close());
        HBox row = new HBox(ok); row.setAlignment(Pos.CENTER_RIGHT);

        root.getChildren().addAll(new Label(title) {{ getStyleClass().add("dialog-title"); }}, lbl, row);
        Scene scene = new Scene(root);
        scene.getStylesheets().add(getClass().getResource("/com/axionpad/css/dark.css").toExternalForm());
        dialog.setScene(scene);
        dialog.show();
    }
}
