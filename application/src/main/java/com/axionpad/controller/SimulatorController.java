package com.axionpad.controller;

import com.axionpad.model.KeyConfig;
import com.axionpad.service.ConfigService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;

import java.util.ArrayList;
import java.util.List;

public class SimulatorController {

    private final ConfigService cfg;
    private TextArea logArea;

    public SimulatorController(ConfigService cfg) {
        this.cfg = cfg;
    }

    public Pane buildView() {
        VBox root = new VBox(16);
        root.getStyleClass().add("page-root");
        root.setPadding(new Insets(24));

        Label title = new Label("Simulateur");
        title.getStyleClass().add("page-title");
        Label desc = new Label("Testez vos assignations sans le pad physique.");
        desc.getStyleClass().add("page-desc");

        // Pad buttons
        VBox padBox = new VBox(10);
        padBox.getStyleClass().add("card");
        Label cardTitle = new Label("TOUCHES SIMULÉES");
        cardTitle.getStyleClass().add("card-title");

        GridPane grid = new GridPane();
        grid.setHgap(10); grid.setVgap(10);
        for (int i = 0; i < 4; i++) {
            ColumnConstraints cc = new ColumnConstraints();
            cc.setPercentWidth(25);
            grid.getColumnConstraints().add(cc);
        }
        for (int i = 0; i < 12; i++) {
            final int idx = i;
            KeyConfig k = cfg.getConfig().getKey(i);
            Button btn = new Button("T" + (i + 1) + "\n" + getActionDesc(k));
            btn.setMaxWidth(Double.MAX_VALUE);
            btn.setMinHeight(60);
            btn.getStyleClass().add("quick-btn");
            btn.setOnAction(e -> addLog("Touche " + (idx + 1) + " → " + getActionDesc(cfg.getConfig().getKey(idx))));
            grid.add(btn, i % 4, i / 4);
        }
        padBox.getChildren().addAll(cardTitle, grid);

        // Log area
        VBox logBox = new VBox(8);
        logBox.getStyleClass().add("card");
        Label logTitle = new Label("LOG");
        logTitle.getStyleClass().add("card-title");
        logArea = new TextArea();
        logArea.setEditable(false);
        logArea.setPrefHeight(160);
        logArea.getStyleClass().add("serial-log");
        logArea.setPromptText("Les actions simulées apparaissent ici…");
        logBox.getChildren().addAll(logTitle, logArea);

        HBox mainLayout = new HBox(16, padBox, logBox);
        HBox.setHgrow(padBox, Priority.ALWAYS);
        HBox.setHgrow(logBox, Priority.ALWAYS);
        mainLayout.setAlignment(Pos.TOP_LEFT);

        root.getChildren().addAll(title, desc, mainLayout);
        return root;
    }

    private String getActionDesc(KeyConfig k) {
        return switch (k.getActionType()) {
            case KEYBOARD   -> k.getComboString().isEmpty() ? "—" : k.getComboString();
            case APP        -> "LAUNCH: " + (k.getAppLabel().isEmpty() ? k.getAppPath() : k.getAppLabel());
            case MUTE       -> "MUTE " + k.getMuteTarget();
            case MEDIA      -> "MEDIA: " + k.getMediaKey();
            case AUTOHOTKEY -> {
                String path = k.getAhkScriptPath();
                if (path.isEmpty()) yield "AHK: —";
                int sep = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
                yield "AHK: " + (sep >= 0 ? path.substring(sep + 1) : path);
            }
        };
    }

    private void addLog(String msg) {
        if (logArea == null) return;
        java.time.LocalTime now = java.time.LocalTime.now();
        logArea.appendText(String.format("[%02d:%02d:%02d] %s%n", now.getHour(), now.getMinute(), now.getSecond(), msg));
    }
}
