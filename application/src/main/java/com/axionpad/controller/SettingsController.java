package com.axionpad.controller;

import com.axionpad.model.AppSettings;
import com.axionpad.service.I18n;
import com.axionpad.service.SettingsService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.RadioButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.*;
import javafx.stage.FileChooser;

import java.io.File;

/**
 * Page Paramètres : langue, taille de police, thème, fond d'écran personnalisé.
 * Appelle onApply quand l'utilisateur clique « Appliquer ».
 */
public class SettingsController {

    private final SettingsService settingsService;
    private Runnable onApply;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    public void setOnApply(Runnable cb) { this.onApply = cb; }

    public Pane buildView() {
        AppSettings s = settingsService.getSettings();

        VBox root = new VBox(20);
        root.getStyleClass().add("page-root");
        root.setPadding(new Insets(24));

        Label title = new Label(I18n.t("settings.title"));
        title.getStyleClass().add("page-title");

        // ── Langue ────────────────────────────────────────────────────
        ToggleGroup langGroup = new ToggleGroup();
        RadioButton rbFr = radio("Français", langGroup);
        RadioButton rbEn = radio("English",  langGroup);
        if ("en".equals(s.getLanguage())) rbEn.setSelected(true);
        else                               rbFr.setSelected(true);
        VBox langCard = card(I18n.t("settings.language"), hbox(rbFr, rbEn));

        // ── Taille de police ──────────────────────────────────────────
        ToggleGroup fontGroup = new ToggleGroup();
        RadioButton rbSmall  = radio(I18n.t("settings.small"),  fontGroup);
        RadioButton rbMedium = radio(I18n.t("settings.medium"), fontGroup);
        RadioButton rbLarge  = radio(I18n.t("settings.large"),  fontGroup);
        switch (s.getFontSize()) {
            case "small" -> rbSmall.setSelected(true);
            case "large" -> rbLarge.setSelected(true);
            default      -> rbMedium.setSelected(true);
        }
        VBox fontCard = card(I18n.t("settings.fontsize"), hbox(rbSmall, rbMedium, rbLarge));

        // ── Fond d'écran (thèmes) ─────────────────────────────────────
        ToggleGroup bgGroup = new ToggleGroup();
        RadioButton rbSpace   = radio(I18n.t("settings.bg.space"),   bgGroup);
        RadioButton rbPurple  = radio(I18n.t("settings.bg.purple"),  bgGroup);
        RadioButton rbOcean   = radio(I18n.t("settings.bg.ocean"),   bgGroup);
        RadioButton rbDark    = radio(I18n.t("settings.bg.dark"),    bgGroup);
        RadioButton rbCrimson = radio(I18n.t("settings.bg.crimson"), bgGroup);
        RadioButton rbEmerald = radio(I18n.t("settings.bg.emerald"), bgGroup);
        RadioButton rbSunset  = radio(I18n.t("settings.bg.sunset"),  bgGroup);
        switch (s.getBgStyle()) {
            case "purple"  -> rbPurple.setSelected(true);
            case "ocean"   -> rbOcean.setSelected(true);
            case "dark"    -> rbDark.setSelected(true);
            case "crimson" -> rbCrimson.setSelected(true);
            case "emerald" -> rbEmerald.setSelected(true);
            case "sunset"  -> rbSunset.setSelected(true);
            default        -> rbSpace.setSelected(true);
        }
        FlowPane bgRow = new FlowPane(12, 10);
        bgRow.setAlignment(Pos.CENTER_LEFT);
        bgRow.getChildren().addAll(
            swatch("#07071a", "#100720", rbSpace),
            swatch("#0f0520", "#2a0a50", rbPurple),
            swatch("#050f20", "#0a2535", rbOcean),
            swatch("#0f0f13", "#1a1a20", rbDark),
            swatch("#120407", "#220810", rbCrimson),
            swatch("#04100a", "#081e0e", rbEmerald),
            swatch("#130a03", "#241308", rbSunset)
        );
        VBox bgCard = card(I18n.t("settings.bg"), bgRow);

        // ── Fond personnalisé (image) ─────────────────────────────────
        String currentWp = s.getWallpaperPath();
        Label wpPathLabel = new Label(currentWp.isBlank()
            ? "Aucun fond personnalisé"
            : new File(currentWp).getName());
        wpPathLabel.getStyleClass().add("form-label");
        wpPathLabel.setWrapText(true);

        Button wpChooseBtn = new Button("Choisir une image...");
        wpChooseBtn.getStyleClass().add("btn");
        Button wpClearBtn = new Button("Supprimer");
        wpClearBtn.getStyleClass().add("btn");

        // Holder pour capturer le chemin dans les lambdas
        final String[] wpHolder = {currentWp};

        wpChooseBtn.setOnAction(e -> {
            FileChooser fc = new FileChooser();
            fc.setTitle("Sélectionner une image de fond");
            fc.getExtensionFilters().addAll(
                new FileChooser.ExtensionFilter(
                    "Images (*.png, *.jpg, *.jpeg, *.bmp, *.gif)",
                    "*.png", "*.jpg", "*.jpeg", "*.bmp", "*.gif"),
                new FileChooser.ExtensionFilter("Tous les fichiers (*.*)", "*.*")
            );
            if (!wpHolder[0].isBlank()) {
                File prev = new File(wpHolder[0]).getParentFile();
                if (prev != null && prev.exists()) fc.setInitialDirectory(prev);
            }
            File chosen = fc.showOpenDialog(wpChooseBtn.getScene().getWindow());
            if (chosen != null) {
                wpHolder[0] = chosen.getAbsolutePath();
                wpPathLabel.setText(chosen.getName());
            }
        });
        wpClearBtn.setOnAction(e -> {
            wpHolder[0] = "";
            wpPathLabel.setText("Aucun fond personnalisé");
        });

        HBox wpBtnRow = new HBox(8, wpChooseBtn, wpClearBtn);
        VBox wpContent = new VBox(8, wpPathLabel, wpBtnRow);
        VBox wpCard = card("Fond personnalisé", wpContent);

        // ── Appliquer ─────────────────────────────────────────────────
        Button applyBtn = new Button(I18n.t("settings.apply"));
        applyBtn.getStyleClass().addAll("btn", "btn-primary");
        applyBtn.setPrefWidth(160);
        applyBtn.setOnAction(e -> {
            s.setLanguage(rbEn.isSelected() ? "en" : "fr");
            s.setFontSize(rbSmall.isSelected() ? "small" : rbLarge.isSelected() ? "large" : "medium");
            s.setBgStyle(
                rbPurple.isSelected()  ? "purple"  :
                rbOcean.isSelected()   ? "ocean"   :
                rbDark.isSelected()    ? "dark"    :
                rbCrimson.isSelected() ? "crimson" :
                rbEmerald.isSelected() ? "emerald" :
                rbSunset.isSelected()  ? "sunset"  : "space"
            );
            s.setWallpaperPath(wpHolder[0]);
            I18n.setLanguage(s.getLanguage());
            settingsService.save();
            if (onApply != null) onApply.run();
        });

        root.getChildren().addAll(title, langCard, fontCard, bgCard, wpCard, applyBtn);
        return root;
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private RadioButton radio(String text, ToggleGroup group) {
        RadioButton rb = new RadioButton(text);
        rb.setToggleGroup(group);
        rb.getStyleClass().add("type-radio");
        return rb;
    }

    private HBox hbox(javafx.scene.Node... nodes) {
        HBox box = new HBox(16);
        box.setAlignment(Pos.CENTER_LEFT);
        box.getChildren().addAll(nodes);
        return box;
    }

    private VBox card(String label, javafx.scene.Node content) {
        VBox card = new VBox(12);
        card.getStyleClass().add("card");
        Label lbl = new Label(label.toUpperCase());
        lbl.getStyleClass().add("card-title");
        card.getChildren().addAll(lbl, content);
        return card;
    }

    private VBox swatch(String c1, String c2, RadioButton rb) {
        VBox box = new VBox(6);
        box.setAlignment(Pos.CENTER);
        Region rect = new Region();
        rect.setPrefSize(60, 40);
        rect.setStyle(String.format(
            "-fx-background-color: linear-gradient(from 0%% 0%% to 100%% 100%%, %s, %s);" +
            "-fx-background-radius: 8;" +
            "-fx-border-color: rgba(255,255,255,0.15);" +
            "-fx-border-radius: 8;" +
            "-fx-border-width: 1;", c1, c2));
        box.getChildren().addAll(rect, rb);
        return box;
    }
}
