package com.axionpad.controller;

import com.axionpad.service.ConfigService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import java.io.File;
import java.io.IOException;

public class ExportController {

    private final ConfigService cfg;
    private final Stage owner;

    public ExportController(ConfigService cfg, Stage owner) { this.cfg = cfg; this.owner = owner; }

    public Pane buildView() {
        VBox root = new VBox(16);
        root.getStyleClass().add("page-root");
        root.setPadding(new Insets(24));

        Label title = new Label("Export du code");
        title.getStyleClass().add("page-title");
        Label desc = new Label("Flash initial du firmware statique — opération unique. Le firmware envoie toujours F13–F24, l'appli hôte gère la logique des touches.");
        desc.getStyleClass().add("page-desc");
        desc.setWrapText(true);

        HBox grid = new HBox(14);

        // Bandeau flash
        HBox flashBar = buildFlashBar();

        // code.py statique
        VBox codeBox = buildFileBox("📁  CIRCUITPY / code.py  (firmware statique)",
                cfg.getStaticFirmware(),
                "Enregistrer code.py",
                new FileChooser.ExtensionFilter("Python", "*.py"),
                "code.py");
        HBox.setHgrow(codeBox, Priority.ALWAYS);

        // yaml + json
        VBox rightCol = new VBox(14);
        HBox.setHgrow(rightCol, Priority.ALWAYS);
        VBox yamlBox = buildFileBox("📁  deej / deej-config.yaml",
                cfg.getConfig().generateDeejYaml(),
                "Enregistrer deej-config.yaml",
                new FileChooser.ExtensionFilter("YAML", "*.yaml"),
                "deej-config.yaml");
        rightCol.getChildren().addAll(yamlBox);

        grid.getChildren().addAll(codeBox, rightCol);
        root.getChildren().addAll(title, desc, flashBar, grid);
        return root;
    }

    private HBox buildFlashBar() {
        HBox bar = new HBox(12);
        bar.getStyleClass().add("flash-bar");
        bar.setAlignment(Pos.CENTER_LEFT);
        bar.setPadding(new Insets(10, 16, 10, 16));

        Label info = new Label("Firmware statique — flash unique lors de la première installation. Branche le pad en USB, il apparaît comme lecteur CIRCUITPY.");
        info.getStyleClass().add("flash-bar-text");
        HBox.setHgrow(info, Priority.ALWAYS);
        info.setWrapText(true);

        Button detectBtn = new Button("📂 Détecter");
        Button flashBtn  = new Button("⚡ Flash vers le pad");
        detectBtn.getStyleClass().add("btn");
        flashBtn.getStyleClass().addAll("btn", "btn-primary");

        Label statusLbl = new Label();
        statusLbl.getStyleClass().add("flash-status");

        detectBtn.setOnAction(e -> {
            File drive = cfg.findCircuitPyDrive();
            if (drive != null) {
                statusLbl.setText("✓ Lecteur trouvé : " + drive.getPath());
                statusLbl.setStyle("-fx-text-fill: #4ade80;");
            } else {
                statusLbl.setText("✗ Aucun lecteur CIRCUITPY détecté.");
                statusLbl.setStyle("-fx-text-fill: #f87171;");
            }
        });

        flashBtn.setOnAction(e -> {
            flashBtn.setDisable(true);
            flashBtn.setText("⏳ Flash…");
            new Thread(() -> {
                String err = cfg.flashCodePy();
                javafx.application.Platform.runLater(() -> {
                    flashBtn.setDisable(false);
                    flashBtn.setText("⚡ Flash vers le pad");
                    if (err == null) {
                        statusLbl.setText("✓ code.py flashé — le pad va redémarrer.");
                        statusLbl.setStyle("-fx-text-fill: #4ade80;");
                    } else {
                        statusLbl.setText("✗ " + err.replace('\n', ' '));
                        statusLbl.setStyle("-fx-text-fill: #f87171;");
                        new Alert(Alert.AlertType.ERROR, err).showAndWait();
                    }
                });
            }, "FlashThread").start();
        });

        bar.getChildren().addAll(info, statusLbl, detectBtn, flashBtn);
        return bar;
    }

    private VBox buildFileBox(String fileName, String content,
                               String saveTitle, FileChooser.ExtensionFilter ext, String defName) {
        VBox box = new VBox(10);
        box.getStyleClass().add("card");

        HBox header = new HBox();
        header.setAlignment(Pos.CENTER_LEFT);
        Label fn = new Label(fileName);
        fn.getStyleClass().add("file-name-label");
        Region sp = new Region(); HBox.setHgrow(sp, Priority.ALWAYS);
        Button copyBtn = new Button("Copier");
        Button saveBtn = new Button("💾 Enregistrer");
        copyBtn.getStyleClass().add("btn");
        saveBtn.getStyleClass().addAll("btn", "btn-primary");
        header.getChildren().addAll(fn, sp, copyBtn, saveBtn);

        TextArea ta = new TextArea(content);
        ta.setEditable(false);
        ta.setPrefRowCount(16);
        ta.getStyleClass().add("code-area");
        ta.setWrapText(false);

        copyBtn.setOnAction(e -> {
            javafx.scene.input.Clipboard cb = javafx.scene.input.Clipboard.getSystemClipboard();
            javafx.scene.input.ClipboardContent cc = new javafx.scene.input.ClipboardContent();
            cc.putString(ta.getText());
            cb.setContent(cc);
            copyBtn.setText("✓ Copié");
            new javafx.animation.Timeline(new javafx.animation.KeyFrame(
                    javafx.util.Duration.seconds(2), ev -> copyBtn.setText("Copier"))).play();
        });

        saveBtn.setOnAction(e -> {
            FileChooser fc = new FileChooser();
            fc.setTitle(saveTitle);
            fc.getExtensionFilters().add(ext);
            fc.setInitialFileName(defName);
            File f = fc.showSaveDialog(owner);
            if (f != null) {
                try { java.nio.file.Files.writeString(f.toPath(), ta.getText()); }
                catch (Exception ex) { ex.printStackTrace(); }
            }
        });

        box.getChildren().addAll(header, ta);
        return box;
    }
}