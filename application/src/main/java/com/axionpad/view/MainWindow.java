package com.axionpad.view;

import com.axionpad.controller.*;
import com.axionpad.model.AppSettings;
import com.axionpad.model.PadConfig;
import com.axionpad.service.ConfigService;
import com.axionpad.service.I18n;
import com.axionpad.service.SerialService;
import com.axionpad.service.SettingsService;
import com.axionpad.service.WindowsVolumeService;
import javafx.animation.*;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.shape.Circle;
import javafx.stage.Stage;
import javafx.util.Duration;

import java.io.File;
import java.io.IOException;
import java.util.List;

import javafx.stage.FileChooser;

/**
 * Fenêtre principale — glassmorphism.
 * Titlebar | Sidebar | Content (page routing).
 */
public class MainWindow {

    private final Stage stage;
    private final ConfigService configService;
    private final SettingsService settingsService;
    private final SerialService serialService;
    private final WindowsVolumeService volumeService = WindowsVolumeService.getInstance();

    // Controllers
    private KeysController     keysController;
    private SlidersController  slidersController;
    private SoundbarController soundbarController;
    private ExportController   exportController;
    private SettingsController settingsController;

    // UI
    private StackPane sceneRoot;
    private Pane      bgLayer;
    private BorderPane root;
    private StackPane  contentArea;
    private Circle    connDot;
    private Label     connLabel;
    private Button    connButton;
    private VBox      sidebar;

    // Cache pages
    private Pane keysPage, slidersPage, soundbarPage, exportPage, settingsPage;

    // Toast
    private StackPane toastContainer;
    private Label     toastLabel;

    private Scene scene;
    private String currentPage = "keys";

    public MainWindow(Stage stage, ConfigService configService) {
        this.stage           = stage;
        this.configService   = configService;
        this.settingsService = SettingsService.getInstance();
        this.serialService   = SerialService.getInstance();
    }

    public void initScene() {
        // Calque de fond (gradient animé)
        bgLayer = new Pane();
        bgLayer.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);
        applyBgStyle();

        // Structure principale
        root = new BorderPane();
        root.getStyleClass().add("root-pane");

        root.setTop(buildTitlebar());
        root.setBottom(buildBottomNav());

        contentArea = new StackPane();
        contentArea.getStyleClass().add("content-area");
        root.setCenter(contentArea);

        // Toast (superposé au contenu)
        toastLabel = new Label();
        toastLabel.getStyleClass().add("toast-label");
        HBox toastBox = new HBox(toastLabel);
        toastBox.getStyleClass().add("toast");
        toastBox.setAlignment(Pos.CENTER);
        toastBox.setVisible(false);
        toastBox.setMouseTransparent(true);
        toastContainer = new StackPane(toastBox);
        toastContainer.setMouseTransparent(true);
        StackPane.setAlignment(toastBox, Pos.BOTTOM_CENTER);
        StackPane.setMargin(toastBox, new Insets(0, 0, 24, 0));

        // Scène root = calque bg + contenu + toast
        sceneRoot = new StackPane(bgLayer, root, toastContainer);
        StackPane.setAlignment(root, Pos.TOP_LEFT);

        // Init controllers
        initControllers();

        // Pré-init soundbar pour que serialLogArea soit prête
        soundbarPage = soundbarController.buildView();

        showPage("keys");
        setupSerialCallbacks();

        scene = new Scene(sceneRoot, 1100, 720);
        scene.getStylesheets().add(
            getClass().getResource("/com/axionpad/css/dark.css").toExternalForm());
        applyFontSize();

        stage.setTitle("AxionPad Configurator");
        // Try icon.ico first, fall back to logo1.png — both are packaged in resources
        boolean iconLoaded = false;
        for (String iconPath : new String[]{"/com/axionpad/icons/icon.ico", "/com/axionpad/icons/logo1.png"}) {
            try (java.io.InputStream is = getClass().getResourceAsStream(iconPath)) {
                if (is != null) {
                    Image img = new Image(is);
                    if (!img.isError()) {
                        stage.getIcons().clear();
                        stage.getIcons().add(img);
                        iconLoaded = true;
                        com.axionpad.service.DebugLogger.log("[MainWindow] Stage icon loaded: " + iconPath);
                        break;
                    }
                }
            } catch (Exception ignored) {}
        }
        if (!iconLoaded) {
            com.axionpad.service.DebugLogger.log("[MainWindow] WARNING: no stage icon could be loaded");
        }
        stage.setScene(scene);
        stage.setMinWidth(920);
        stage.setMinHeight(620);
        stage.setOnCloseRequest(e -> {
            e.consume();
            configService.save();
            stage.hide();
        });
    }

    public void show() { initScene(); stage.show(); }

    // ── Controllers ──────────────────────────────────────────────────

    private void initControllers() {
        keysController    = new KeysController(configService) {
            @Override protected void onSaveSuccess() {
                // Recharge la page (toujours reconstruite depuis le config à jour)
                showPage("keys");
                showToast(I18n.t("save.ok"));
            }
        };
        slidersController  = new SlidersController(configService);
        soundbarController = new SoundbarController(configService);
        soundbarController.setOnNavigate(this::showPage);
        exportController   = new ExportController(configService, stage);
        settingsController = new SettingsController(settingsService);
        settingsController.setOnApply(this::onSettingsApplied);
    }

    // ── Settings apply ────────────────────────────────────────────────

    private void onSettingsApplied() {
        applyBgStyle();
        applyFontSize();
        root.setBottom(buildBottomNav());
        keysPage = null; slidersPage = null; soundbarPage = null;
        settingsPage = null;
        initControllers();
        soundbarPage = soundbarController.buildView();
        showPage(currentPage);
        showToast(I18n.t("save.ok"));
    }

    private static final java.util.List<String> ALL_BG_CLASSES =
        java.util.List.of("bg-space","bg-purple","bg-ocean","bg-dark","bg-crimson","bg-emerald","bg-sunset");

    private void applyBgStyle() {
        AppSettings s = settingsService.getSettings();
        String wp = s.getWallpaperPath();

        bgLayer.getStyleClass().removeAll(ALL_BG_CLASSES);

        if (!wp.isBlank()) {
            File f = new File(wp);
            if (f.exists()) {
                try {
                    Image img = new Image(f.toURI().toString());
                    bgLayer.setBackground(new Background(new BackgroundImage(
                        img,
                        BackgroundRepeat.NO_REPEAT, BackgroundRepeat.NO_REPEAT,
                        BackgroundPosition.CENTER,
                        new BackgroundSize(BackgroundSize.AUTO, BackgroundSize.AUTO, true, true, true, false)
                    )));
                    return;
                } catch (Exception ignored) {}
            }
        }
        // Pas de wallpaper valide → gradient CSS
        bgLayer.setBackground(null);
        bgLayer.getStyleClass().add("bg-" + s.getBgStyle());
    }

    private void applyFontSize() {
        String fs = settingsService.getSettings().getFontSize();
        sceneRoot.getStyleClass().removeAll("font-small","font-medium","font-large");
        sceneRoot.getStyleClass().add("font-" + fs);
    }

    // ── Toast ─────────────────────────────────────────────────────────

    public void showToast(String msg) {
        toastLabel.setText(msg);
        HBox toastBox = (HBox) toastContainer.getChildren().get(0);
        toastBox.setVisible(true);
        toastBox.setOpacity(1.0);
        Timeline fade = new Timeline(
            new KeyFrame(Duration.millis(1800), new javafx.animation.KeyValue(toastBox.opacityProperty(), 1.0)),
            new KeyFrame(Duration.millis(2400), new javafx.animation.KeyValue(toastBox.opacityProperty(), 0.0))
        );
        fade.setOnFinished(e -> toastBox.setVisible(false));
        fade.play();
    }

    // ── BOTTOM NAV ────────────────────────────────────────────────────

    private HBox buildBottomNav() {
        HBox nav = new HBox();
        nav.getStyleClass().add("bottom-nav");
        nav.setAlignment(Pos.CENTER);

        String[][] items = {
            {"⌨", I18n.t("nav.keys"),      "keys"},
            {"🎚", I18n.t("nav.sliders"),  "sliders"},
            {"🎛", "Presets",              "presets"},
            {"⚙",  I18n.t("nav.settings"), "settings"},
        };
        for (String[] item : items) {
            nav.getChildren().add(buildNavButton(item[0], item[1], item[2]));
        }
        return nav;
    }

    private Button buildNavButton(String icon, String label, String pageId) {
        Label iconLbl = new Label(icon);
        iconLbl.setStyle("-fx-font-size: 18px;");
        Label textLbl = new Label(label);
        textLbl.setStyle("-fx-font-size: 10px;");
        VBox content = new VBox(2, iconLbl, textLbl);
        content.setAlignment(Pos.CENTER);
        Button btn = new Button();
        btn.setGraphic(content);
        btn.getStyleClass().add("bottom-nav-btn");
        btn.setId("nav-" + pageId);
        btn.setOnAction(e -> {
            clearNavActive();
            btn.getStyleClass().add("active");
            showPage(pageId);
        });
        return btn;
    }

    private Pane getPresetsPage() {
        VBox page = new VBox();
        page.getStyleClass().add("page-root");

        ScrollPane scroll = new ScrollPane();
        scroll.setFitToWidth(true);
        scroll.getStyleClass().add("page-scroll");
        VBox.setVgrow(scroll, Priority.ALWAYS);

        VBox content = new VBox(20);
        content.setPadding(new Insets(24));

        // Title row with action buttons
        HBox titleRow = new HBox(10);
        titleRow.setAlignment(Pos.CENTER_LEFT);
        Label titleLbl = new Label("Presets");
        titleLbl.getStyleClass().add("page-title");
        Region spacer = new Region(); HBox.setHgrow(spacer, Priority.ALWAYS);
        Button importBtn = new Button("↑ Importer");
        importBtn.getStyleClass().add("btn");
        importBtn.setOnAction(e -> importUserPreset());
        Button saveBtn = new Button("+ Sauvegarder");
        saveBtn.getStyleClass().addAll("btn", "btn-primary");
        saveBtn.setOnAction(e -> promptNewPreset());
        titleRow.getChildren().addAll(titleLbl, spacer, importBtn, saveBtn);

        Label desc = new Label("Applique une configuration prédéfinie ou sauvegarde ta configuration actuelle.");
        desc.getStyleClass().add("page-desc");
        desc.setWrapText(true);

        // Built-in presets grid (2 columns)
        Label builtinHdr = new Label("CONFIGURATIONS PRÉDÉFINIES");
        builtinHdr.getStyleClass().add("card-title");
        builtinHdr.setPadding(new Insets(0, 0, 4, 0));

        GridPane builtinGrid = new GridPane();
        builtinGrid.setHgap(12);
        builtinGrid.setVgap(12);
        ColumnConstraints gc1 = new ColumnConstraints(); gc1.setPercentWidth(50);
        ColumnConstraints gc2 = new ColumnConstraints(); gc2.setPercentWidth(50);
        builtinGrid.getColumnConstraints().addAll(gc1, gc2);

        String[][] builtins = {
            {"🎬", "Streaming",    "OBS, scènes et sources",      "streaming"},
            {"🎮", "Gaming",       "Macros de jeu, FPS",          "gaming"},
            {"💼", "Productivité", "Bureau, raccourcis Office",   "productivity"},
            {"🎵", "DAW / Musique","Reaper, Audacity, FL Studio", "daw"},
            {"🔊", "Soundboard",   "Effets sonores SFX",          "soundboard"},
        };
        for (int i = 0; i < builtins.length; i++) {
            builtinGrid.add(buildBuiltinPresetCard(builtins[i][0], builtins[i][1], builtins[i][2], builtins[i][3]), i % 2, i / 2);
        }

        // User presets section
        Label myPresetsHdr = new Label("MES PRESETS");
        myPresetsHdr.getStyleClass().add("card-title");
        myPresetsHdr.setPadding(new Insets(8, 0, 4, 0));

        VBox userCard = new VBox(0);
        userCard.getStyleClass().add("card");
        userCard.setPadding(new Insets(8));

        List<PadConfig.UserPreset> presets = configService.getConfig().getUserPresets();
        if (presets.isEmpty()) {
            Label emptyLbl = new Label("Aucun preset — clique sur + Sauvegarder pour en créer un.");
            emptyLbl.setStyle("-fx-text-fill: rgba(255,255,255,0.28); -fx-font-size: 12px; -fx-padding: 4 0 4 0;");
            userCard.getChildren().add(emptyLbl);
        } else {
            for (int pi = 0; pi < presets.size(); pi++) {
                PadConfig.UserPreset p = presets.get(pi);
                HBox row = new HBox(8);
                row.setAlignment(Pos.CENTER_LEFT);
                row.setPadding(new Insets(8, 4, 8, 4));

                Label nameLbl = new Label(p.getName());
                nameLbl.setStyle("-fx-text-fill: #d4d4d8; -fx-font-size: 13px;");
                HBox.setHgrow(nameLbl, Priority.ALWAYS);

                Button applyRow = new Button("Appliquer");
                applyRow.getStyleClass().addAll("btn", "btn-primary");
                applyRow.setOnAction(e -> applyUserPreset(p));

                Button renameRow = new Button("✎");
                renameRow.getStyleClass().add("btn");
                renameRow.setTooltip(new Tooltip("Renommer"));
                renameRow.setOnAction(e -> promptRenamePreset(p, userCard));

                Button exportRow = new Button("↓");
                exportRow.getStyleClass().add("btn");
                exportRow.setTooltip(new Tooltip("Exporter en .json"));
                exportRow.setOnAction(e -> exportUserPreset(p));

                Button delRow = new Button("×");
                delRow.getStyleClass().add("preset-del-btn");
                delRow.setOnAction(e -> deleteUserPreset(p.getId()));

                row.getChildren().addAll(nameLbl, applyRow, renameRow, exportRow, delRow);
                userCard.getChildren().add(row);

                if (pi < presets.size() - 1) {
                    Region div = new Region();
                    div.setPrefHeight(1);
                    div.setStyle("-fx-background-color: rgba(255,255,255,0.06);");
                    userCard.getChildren().add(div);
                }
            }
        }

        content.getChildren().addAll(titleRow, desc, builtinHdr, builtinGrid, myPresetsHdr, userCard);
        scroll.setContent(content);
        page.getChildren().add(scroll);
        return page;
    }

    private VBox buildBuiltinPresetCard(String icon, String name, String desc, String presetId) {
        VBox card = new VBox(8);
        card.getStyleClass().add("card");
        card.setPadding(new Insets(14));

        HBox topRow = new HBox(10);
        topRow.setAlignment(Pos.CENTER_LEFT);
        Label iconLbl = new Label(icon);
        iconLbl.setStyle("-fx-font-size: 22px;");
        Label nameLbl = new Label(name);
        nameLbl.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-text-fill: #d4d4d8;");
        topRow.getChildren().addAll(iconLbl, nameLbl);

        Label descLbl = new Label(desc);
        descLbl.setStyle("-fx-text-fill: rgba(255,255,255,0.38); -fx-font-size: 11px;");
        descLbl.setWrapText(true);

        Button applyBtn = new Button("Appliquer");
        applyBtn.getStyleClass().addAll("btn", "btn-primary");
        applyBtn.setMaxWidth(Double.MAX_VALUE);
        applyBtn.setOnAction(e -> applyDefaultPreset(presetId));

        card.getChildren().addAll(topRow, descLbl, applyBtn);
        return card;
    }

    // ── TITLEBAR ─────────────────────────────────────────────────────

    private HBox buildTitlebar() {
        HBox bar = new HBox();
        bar.getStyleClass().add("titlebar");
        bar.setAlignment(Pos.CENTER_LEFT);
        bar.setPadding(new Insets(0, 16, 0, 16));

        // Logo
        StackPane logoBadge;
        try {
            ImageView logoView = new ImageView(new Image(
                getClass().getResourceAsStream("/com/axionpad/icons/logo1.png"), 32, 32, true, true));
            logoView.setSmooth(true);
            logoBadge = new StackPane(logoView);
            logoBadge.setStyle(
                "-fx-background-radius: 9; -fx-border-radius: 9;" +
                "-fx-border-color: rgba(255,255,255,0.10); -fx-border-width: 1;" +
                "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.60), 8, 0.3, 0, 1);"
            );
            logoBadge.setPadding(new Insets(1));
        } catch (Exception e) {
            Label fb = new Label("AP");
            fb.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-text-fill: #c4b5fd;" +
                " -fx-background-color: rgba(124,58,237,0.18); -fx-background-radius: 8;" +
                " -fx-padding: 4 10 4 10; -fx-border-radius: 8;" +
                " -fx-border-color: rgba(124,58,237,0.35); -fx-border-width: 1;");
            logoBadge = new StackPane(fb);
        }

        // Centered title
        Label name = new Label("AxionPad Configurator");
        name.getStyleClass().add("title-name");
        Region spacerL = new Region(); HBox.setHgrow(spacerL, Priority.ALWAYS);
        Region spacerR = new Region(); HBox.setHgrow(spacerR, Priority.ALWAYS);

        // Connect button
        connDot   = new Circle(4);
        connDot.getStyleClass().add("conn-dot");
        connLabel = new Label("Connecter");
        connLabel.getStyleClass().add("conn-label");
        connButton = new Button();
        connButton.getStyleClass().add("conn-btn");
        HBox btnContent = new HBox(7, connDot, connLabel);
        btnContent.setAlignment(Pos.CENTER);
        connButton.setGraphic(btnContent);
        connButton.setOnAction(e -> handleConnect());

        bar.getChildren().addAll(logoBadge, spacerL, name, spacerR, connButton);
        return bar;
    }

    // ── SIDEBAR ──────────────────────────────────────────────────────

    private VBox buildSidebar() {
        sidebar = new VBox(2);
        sidebar.getStyleClass().add("sidebar");
        sidebar.setPadding(new Insets(12, 8, 12, 8));
        sidebar.setPrefWidth(220);

        // Configuration
        sidebar.getChildren().addAll(
            sidebarLabel(I18n.t("nav.s.config")),
            navItem("⌨", I18n.t("nav.keys"),     "keys"),
            navItem("🎚", I18n.t("nav.sliders"),  "sliders"),
            navItem("🔊", I18n.t("nav.soundbar"), "soundbar"),
            separator(),
            sidebarLabel(I18n.t("nav.s.tools")),
            navItem("📄", I18n.t("nav.export"),   "export"),
            navItem("⚙", I18n.t("nav.settings"),  "settings"),
            separator(),
            sidebarLabel(I18n.t("nav.s.presets")),
            presetItem(I18n.t("preset.streaming"),    "OBS",   "streaming"),
            presetItem(I18n.t("preset.gaming"),       "FPS",   "gaming"),
            presetItem(I18n.t("preset.productivity"), "Pro",   "productivity"),
            presetItem(I18n.t("preset.daw"),          "Music", "daw"),
            presetItem(I18n.t("preset.soundboard"),   "SFX",   "soundboard"),
            separator()
        );

        // Section mes presets
        sidebar.getChildren().add(buildUserPresetsSection());

        return sidebar;
    }

    private VBox buildUserPresetsSection() {
        VBox section = new VBox(2);

        // Header "MES PRESETS" + boutons import / "+"
        HBox header = new HBox(4);
        header.setAlignment(Pos.CENTER_LEFT);
        Label lbl = sidebarLabel(I18n.t("nav.s.mypresets"));
        Region sp = new Region(); HBox.setHgrow(sp, Priority.ALWAYS);
        Button importBtn = new Button("↑");
        importBtn.getStyleClass().add("new-preset-btn");
        importBtn.setTooltip(new Tooltip("Importer un preset (.json)"));
        importBtn.setOnAction(e -> importUserPreset());
        Button addBtn = new Button("+");
        addBtn.getStyleClass().add("new-preset-btn");
        addBtn.setTooltip(new Tooltip("Sauvegarder la config actuelle comme preset"));
        addBtn.setOnAction(e -> promptNewPreset());
        VBox.setMargin(header, new Insets(10, 4, 2, 4));
        header.getChildren().addAll(lbl, sp, importBtn, addBtn);
        section.getChildren().add(header);

        // Liste des presets utilisateur
        rebuildUserPresetList(section);

        return section;
    }

    /** Reconstruit uniquement les boutons de presets dans la section. */
    private void rebuildUserPresetList(VBox section) {
        // Retirer tous sauf le header (index 0)
        if (section.getChildren().size() > 1)
            section.getChildren().remove(1, section.getChildren().size());

        List<PadConfig.UserPreset> presets = configService.getConfig().getUserPresets();
        if (presets.isEmpty()) {
            Label empty = new Label("Aucun preset");
            empty.setStyle("-fx-text-fill: rgba(255,255,255,0.20); -fx-font-size:11px; -fx-padding: 4 14 4 14;");
            section.getChildren().add(empty);
            return;
        }
        for (PadConfig.UserPreset p : presets) {
            HBox row = new HBox(2);
            row.setAlignment(Pos.CENTER_LEFT);
            Button applyBtn = new Button(p.getName());
            applyBtn.getStyleClass().add("user-preset-btn");
            applyBtn.setMaxWidth(Double.MAX_VALUE);
            HBox.setHgrow(applyBtn, Priority.ALWAYS);
            applyBtn.setOnAction(e -> applyUserPreset(p));

            Button renameBtn = new Button("✎");
            renameBtn.getStyleClass().add("preset-icon-btn");
            renameBtn.setTooltip(new Tooltip("Renommer"));
            renameBtn.setOnAction(e -> promptRenamePreset(p, section));

            Button exportBtn = new Button("↓");
            exportBtn.getStyleClass().add("preset-icon-btn");
            exportBtn.setTooltip(new Tooltip("Exporter en fichier .json"));
            exportBtn.setOnAction(e -> exportUserPreset(p));

            Button delBtn = new Button("×");
            delBtn.getStyleClass().add("preset-del-btn");
            delBtn.setOnAction(e -> deleteUserPreset(p.getId()));

            row.getChildren().addAll(applyBtn, renameBtn, exportBtn, delBtn);
            section.getChildren().add(row);
        }
    }

    private void promptNewPreset() {
        // Mini dialogue inline : TextField + bouton Sauvegarder
        TextInputDialog dlg = new TextInputDialog();
        dlg.setTitle(I18n.t("preset.save.title"));
        dlg.setHeaderText(null);
        dlg.setContentText(I18n.t("preset.name.prompt"));
        // Appliquer le style sombre au dialog
        dlg.getDialogPane().setStyle("-fx-background-color: #18181b;");
        dlg.showAndWait().ifPresent(name -> {
            String trimmed = name.trim();
            if (!trimmed.isEmpty()) {
                configService.addUserPreset(trimmed);
                refreshNav();
                showToast(I18n.t("preset.saved"));
            }
        });
    }

    private void applyUserPreset(PadConfig.UserPreset p) {
        configService.applyUserPreset(p);
        slidersPage = null; soundbarPage = null;
        soundbarPage = soundbarController.buildView();
        showPage("keys");
        showToast(I18n.t("preset.applied") + " : " + p.getName());
    }

    private void deleteUserPreset(String id) {
        configService.deleteUserPreset(id);
        refreshNav();
    }

    private void promptRenamePreset(PadConfig.UserPreset p, VBox section) {
        TextInputDialog dlg = new TextInputDialog(p.getName());
        dlg.setTitle("Renommer le preset");
        dlg.setHeaderText(null);
        dlg.setContentText("Nouveau nom :");
        dlg.getDialogPane().setStyle("-fx-background-color: #18181b;");
        dlg.showAndWait().ifPresent(name -> {
            String trimmed = name.trim();
            if (!trimmed.isEmpty()) {
                configService.renameUserPreset(p.getId(), trimmed);
                refreshNav();
                showToast("Preset renommé : " + trimmed);
            }
        });
    }

    private void exportUserPreset(PadConfig.UserPreset p) {
        FileChooser fc = new FileChooser();
        fc.setTitle("Exporter le preset");
        fc.setInitialFileName(p.getName().replaceAll("[^a-zA-Z0-9_\\-]", "_") + ".json");
        fc.getExtensionFilters().add(new FileChooser.ExtensionFilter("Preset JSON", "*.json"));
        File dest = fc.showSaveDialog(stage);
        if (dest != null) {
            try {
                configService.exportUserPreset(p, dest);
                showToast("Preset exporté : " + dest.getName());
            } catch (IOException ex) {
                new AlertDialog(stage, "Erreur export", ex.getMessage()).show();
            }
        }
    }

    private void importUserPreset() {
        FileChooser fc = new FileChooser();
        fc.setTitle("Importer un preset");
        fc.getExtensionFilters().add(new FileChooser.ExtensionFilter("Preset JSON", "*.json"));
        File src = fc.showOpenDialog(stage);
        if (src != null) {
            try {
                PadConfig.UserPreset imported = configService.importUserPreset(src);
                refreshNav();
                showToast("Preset importé : " + imported.getName());
            } catch (IOException | com.google.gson.JsonSyntaxException ex) {
                new AlertDialog(stage, "Erreur import",
                    "Fichier invalide ou corrompu :\n" + ex.getMessage()).show();
            }
        }
    }

    private void refreshNav() {
        root.setBottom(buildBottomNav());
        Button navBtn = (Button) root.getBottom().lookup("#nav-" + currentPage);
        if (navBtn != null) navBtn.getStyleClass().add("active");
        if ("presets".equals(currentPage))
            contentArea.getChildren().setAll(getPresetsPage());
    }

    // ── Sidebar helpers ───────────────────────────────────────────────

    private Label sidebarLabel(String text) {
        Label l = new Label(text.toUpperCase());
        l.getStyleClass().add("sidebar-section-label");
        VBox.setMargin(l, new Insets(10, 4, 4, 4));
        return l;
    }

    private Region separator() {
        Region r = new Region();
        r.getStyleClass().add("sidebar-divider");
        VBox.setMargin(r, new Insets(6, 0, 6, 0));
        return r;
    }

    private Button navItem(String icon, String text, String pageId) {
        Label ic  = new Label(icon);
        Label lbl = new Label(text);
        ic.getStyleClass().add("nav-icon");
        HBox content = new HBox(10, ic, lbl);
        content.setAlignment(Pos.CENTER_LEFT);
        Button btn = new Button();
        btn.setGraphic(content);
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.getStyleClass().add("nav-btn");
        btn.setId("nav-" + pageId);
        btn.setOnAction(e -> { clearNavActive(); btn.getStyleClass().add("active"); showPage(pageId); });
        return btn;
    }

    private Button presetItem(String name, String tag, String presetId) {
        Label lbl = new Label(name);
        Label tg  = new Label(tag);
        tg.getStyleClass().add("preset-tag");
        Region sp = new Region(); HBox.setHgrow(sp, Priority.ALWAYS);
        HBox inner = new HBox(lbl, sp, tg);
        inner.setAlignment(Pos.CENTER_LEFT);
        Button btn = new Button();
        btn.setGraphic(inner);
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.getStyleClass().add("preset-btn");
        btn.setOnAction(e -> applyDefaultPreset(presetId));
        return btn;
    }

    private void clearNavActive() {
        root.getBottom().lookupAll(".bottom-nav-btn").forEach(n -> n.getStyleClass().remove("active"));
    }

    // ── PAGE ROUTING ─────────────────────────────────────────────────

    public void showPage(String pageId) {
        currentPage = pageId;
        contentArea.getChildren().clear();
        Pane page = switch (pageId) {
            case "keys"     -> getKeysPage();
            case "sliders"  -> getSlidersPage();
            case "soundbar" -> getSoundbarPage();
            case "export"   -> getExportPage();
            case "settings" -> getSettingsPage();
            case "presets"  -> getPresetsPage();
            default         -> getKeysPage();
        };
        contentArea.getChildren().add(page);

        clearNavActive();
        Button navBtn = (Button) root.getBottom().lookup("#nav-" + pageId);
        if (navBtn != null) navBtn.getStyleClass().add("active");
    }

    private VBox wrapInScroll(Pane content) {
        ScrollPane scroll = new ScrollPane(content);
        scroll.setFitToWidth(true);
        scroll.setHbarPolicy(ScrollPane.ScrollBarPolicy.NEVER);
        scroll.getStyleClass().add("page-scroll");
        VBox wrapper = new VBox(scroll);
        VBox.setVgrow(scroll, Priority.ALWAYS);
        wrapper.setFillWidth(true);
        return wrapper;
    }

    // Keys est toujours reconstruite depuis le config courant (garantit la fraîcheur)
    private Pane getKeysPage() {
        VBox wrapper = wrapInScroll(keysController.buildView());
        // Alt+← / Alt+→ switch layer regardless of which child has focus
        wrapper.addEventFilter(KeyEvent.KEY_PRESSED, e -> {
            if (e.isAltDown() && !(e.getTarget() instanceof TextInputControl)) {
                if      (e.getCode() == KeyCode.LEFT)  { keysController.switchLayerLeft();  e.consume(); }
                else if (e.getCode() == KeyCode.RIGHT) { keysController.switchLayerRight(); e.consume(); }
            }
        });
        return wrapper;
    }
    private Pane getSlidersPage()  {
        if (slidersPage == null) slidersPage = wrapInScroll(slidersController.buildView()); return slidersPage;
    }
    private Pane getSoundbarPage() {
        if (soundbarPage == null) soundbarPage = soundbarController.buildView(); return soundbarPage;
    }
    private Pane getExportPage()   { return exportController.buildView(); }
    private Pane getSettingsPage() { return wrapInScroll(settingsController.buildView()); }

    // ── SERIAL ───────────────────────────────────────────────────────

    private void handleConnect() {
        if (serialService.isConnected()) {
            serialService.disconnect();
        } else {
            try {
                PortDialog dialog = new PortDialog(stage, serialService);
                dialog.showAndWait().ifPresent(port -> {
                    boolean ok = serialService.connect(port);
                    if (!ok) {
                        new AlertDialog(stage, "Connexion impossible",
                            "Impossible d'ouvrir le port " + port.getSystemPortName() +
                            ".\nVérifiez que le pad est bien branché.").show();
                    }
                });
            } catch (Exception ex) {
                new AlertDialog(stage, "Erreur",
                    "Impossible d'ouvrir le sélecteur de port :\n" +
                    ex.getClass().getSimpleName() + " — " + ex.getMessage()).show();
            }
        }
    }

    private void setupSerialCallbacks() {
        serialService.setOnConnectionChanged(connected -> {
            connDot.getStyleClass().removeAll("dot-on", "dot-err");
            connButton.getStyleClass().removeAll("conn-on", "conn-err");
            if (connected) {
                connDot.getStyleClass().add("dot-on");
                connButton.getStyleClass().add("conn-on");
                connLabel.setText("Axion Pad connecté — Déconnecter");
            } else {
                connLabel.setText("Connecter le pad");
            }
        });

        // Watchdog recovery: red LED while searching, clears on reconnect
        serialService.setOnSearching(searching -> {
            connDot.getStyleClass().removeAll("dot-on", "dot-err");
            connButton.getStyleClass().removeAll("conn-on", "conn-err");
            if (searching) {
                connDot.getStyleClass().add("dot-err");
                connButton.getStyleClass().add("conn-err");
                connLabel.setText("Searching...");
            }
        });

        serialService.setOnSliderValues(vals -> {
            soundbarController.updateSliderValues(vals);
            slidersController.updateSliderValues(vals);
            configService.getConfig().getSliders().forEach(s -> s.setCurrentValue(vals[s.getIndex()]));
            volumeService.applySliderValues(vals, configService.getConfig().getSliders());
        });

        serialService.setOnLogMessage(msg -> soundbarController.appendLog(msg));
    }

    // ── DEFAULT PRESETS ──────────────────────────────────────────────

    private void applyDefaultPreset(String presetId) {
        PresetService.apply(presetId, configService.getConfig());
        configService.save();
        // Invalider les caches (sliders/soundbar changent selon le preset)
        slidersPage = null; soundbarPage = null;
        soundbarPage = soundbarController.buildView();
        showPage("keys");
        showToast(I18n.t("preset.applied") + " : " + presetId);
    }
}
