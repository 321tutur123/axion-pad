package com.axionpad.controller;

import com.axionpad.model.DeviceModel;
import com.axionpad.model.KeyConfig;
import com.axionpad.model.KeyConfig.ActionType;
import com.axionpad.model.PadConfig;
import com.axionpad.service.ConfigService;
import com.axionpad.service.DebugLogger;
import com.axionpad.service.SerialService;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.FileChooser;
import javafx.stage.FileChooser.ExtensionFilter;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Controller de la page "Touches" :
 * - Grille 4×3 des 12 touches
 * - Panneau de configuration d'une touche sélectionnée
 */
public class KeysController {

    private final ConfigService cfg;

    // UI
    private VBox root;
    private GridPane keyGrid;
    private VBox detailPanel;
    private int selectedKey  = -1;
    private int currentLayer = 0;

    // Dynamic layer toolbar
    private HBox layerToolbar;
    private final java.util.List<Button> layerTabs = new java.util.ArrayList<>();

    // Detail form fields
    private TextField labelField;
    private ToggleGroup typeGroup;
    private RadioButton rbKeyboard, rbApp, rbMute, rbMedia, rbAhk;
    private VBox subKeyboard, subApp, subMute, subMedia, subAhk;
    private CheckBox cbCtrl, cbShift, cbAlt, cbGui;
    private ComboBox<String> keyCombo;
    private Label previewLabel;
    private TextField appPathField;
    private TextField ahkScriptField;
    private ComboBox<String> muteTargetCombo;
    private ComboBox<String> mediaKeyCombo;

    public KeysController(ConfigService cfg) {
        this.cfg = cfg;
    }

    public Pane buildView() {
        selectedKey = -1;

        root = new VBox(16);
        root.getStyleClass().add("page-root");
        root.setPadding(new Insets(24));

        Label title = new Label("Assignation des touches");
        title.getStyleClass().add("page-title");
        Label desc = new Label("Cliquez sur une touche pour configurer son action : raccourci, application, mute, multimédia ou script AutoHotkey.");
        desc.getStyleClass().add("page-desc");
        desc.setWrapText(true);

        keyGrid = buildKeyGrid();

        detailPanel = buildDetailPanel();
        detailPanel.setVisible(false);
        detailPanel.setManaged(false);

        root.getChildren().addAll(title, desc, detailPanel, buildGridCard());
        return root;
    }

    // ── GRID ─────────────────────────────────────────────────────────

    private VBox buildGridCard() {
        VBox card = new VBox(0);
        card.getStyleClass().add("card");
        card.setStyle("-fx-padding: 0;");
        layerToolbar = buildLayerToolbar();
        VBox gridWrapper = new VBox(0);
        gridWrapper.setPadding(new Insets(14));
        gridWrapper.getChildren().add(keyGrid);
        card.getChildren().addAll(layerToolbar, gridWrapper);
        return card;
    }

    private HBox buildLayerToolbar() {
        HBox toolbar = new HBox(6);
        toolbar.setAlignment(Pos.CENTER_LEFT);
        toolbar.setPadding(new Insets(8, 14, 8, 14));
        toolbar.setStyle("-fx-border-color: rgba(255,255,255,0.06); -fx-border-width: 0 0 1 0;");

        layerTabs.clear();
        java.util.List<PadConfig.Layer> layers = cfg.getConfig().getLayers();
        for (int i = 0; i < layers.size(); i++) {
            Button tab = buildLayerTab(i, layers.get(i).getName());
            layerTabs.add(tab);
            toolbar.getChildren().add(tab);
        }

        Button addBtn = new Button("+ Layer");
        addBtn.getStyleClass().add("layer-add-btn");
        addBtn.setTooltip(new Tooltip("Ajouter un layer"));
        addBtn.setOnAction(e -> promptAddLayer());

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        Button prevBtn = new Button("◀");
        prevBtn.getStyleClass().add("layer-nav-btn");
        prevBtn.setTooltip(new Tooltip("Layer précédent  (Alt + ←)"));
        prevBtn.setOnAction(e -> switchLayerLeft());

        Button nextBtn = new Button("▶");
        nextBtn.getStyleClass().add("layer-nav-btn");
        nextBtn.setTooltip(new Tooltip("Layer suivant  (Alt + →)"));
        nextBtn.setOnAction(e -> switchLayerRight());

        toolbar.getChildren().addAll(addBtn, spacer, prevBtn, nextBtn);
        return toolbar;
    }

    private Button buildLayerTab(int idx, String name) {
        Button tab = new Button(name);
        tab.getStyleClass().add(currentLayer == idx ? "layer-tab-active" : "layer-tab");
        tab.setOnAction(e -> switchLayer(idx));

        ContextMenu cm = new ContextMenu();
        MenuItem renameItem = new MenuItem("✎  Renommer");
        renameItem.setOnAction(e -> promptRenameLayer(idx));
        MenuItem deleteItem = new MenuItem("✕  Supprimer");
        deleteItem.setDisable(cfg.getConfig().getLayers().size() <= 1);
        deleteItem.setOnAction(e -> confirmDeleteLayer(idx));
        cm.getItems().addAll(renameItem, new SeparatorMenuItem(), deleteItem);
        tab.setContextMenu(cm);
        return tab;
    }

    // ── Layer CRUD ───────────────────────────────────────────────────────

    private void promptAddLayer() {
        int n = cfg.getConfig().getLayers().size() + 1;
        TextInputDialog dlg = new TextInputDialog("Layer " + n);
        dlg.setTitle("Nouveau layer"); dlg.setHeaderText(null);
        dlg.setContentText("Nom du layer :");
        dlg.getDialogPane().setStyle("-fx-background-color: #18181b;");
        dlg.showAndWait().ifPresent(name -> {
            String t = name.trim();
            if (!t.isEmpty()) {
                cfg.getConfig().addLayer(t);
                cfg.save();
                int newIdx = cfg.getConfig().getLayers().size() - 1;
                rebuildLayerToolbar();
                switchLayer(newIdx);
            }
        });
    }

    private void promptRenameLayer(int idx) {
        TextInputDialog dlg = new TextInputDialog(cfg.getConfig().getLayer(idx).getName());
        dlg.setTitle("Renommer le layer"); dlg.setHeaderText(null);
        dlg.setContentText("Nouveau nom :");
        dlg.getDialogPane().setStyle("-fx-background-color: #18181b;");
        dlg.showAndWait().ifPresent(name -> {
            String t = name.trim();
            if (!t.isEmpty()) { cfg.getConfig().renameLayer(idx, t); cfg.save(); rebuildLayerToolbar(); }
        });
    }

    private void confirmDeleteLayer(int idx) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Supprimer le layer");
        alert.setHeaderText("Supprimer « " + cfg.getConfig().getLayer(idx).getName() + " » ?");
        alert.setContentText("Toutes les touches de ce layer seront perdues.");
        alert.getDialogPane().setStyle("-fx-background-color: #18181b;");
        alert.showAndWait().ifPresent(result -> {
            if (result == ButtonType.OK) {
                boolean removed = cfg.getConfig().removeLayer(idx);
                if (removed) {
                    cfg.save();
                    int maxIdx = cfg.getConfig().getLayers().size() - 1;
                    if (currentLayer > maxIdx) currentLayer = maxIdx;
                    rebuildLayerToolbar();
                    refreshGrid(keyGrid);
                }
            }
        });
    }

    private void rebuildLayerToolbar() {
        if (layerToolbar == null) return;
        HBox newToolbar = buildLayerToolbar();
        if (layerToolbar.getParent() instanceof VBox card) {
            int cardIdx = card.getChildren().indexOf(layerToolbar);
            if (cardIdx >= 0) { card.getChildren().set(cardIdx, newToolbar); layerToolbar = newToolbar; }
        }
    }

    // ── Layer navigation (also called from MainWindow keyboard shortcuts) ─

    public void switchLayerLeft()  { if (currentLayer > 0) switchLayer(currentLayer - 1); }
    public void switchLayerRight() {
        int max = cfg.getConfig().getLayers().size() - 1;
        if (currentLayer < max) switchLayer(currentLayer + 1);
    }

    private void switchLayer(int layer) {
        currentLayer = Math.max(0, Math.min(layer, cfg.getConfig().getLayers().size() - 1));
        updateLayerTabs();
        selectedKey = -1;
        if (detailPanel != null) { detailPanel.setVisible(false); detailPanel.setManaged(false); }
        if (keyGrid != null) refreshGrid(keyGrid);
    }

    private void updateLayerTabs() {
        for (int i = 0; i < layerTabs.size(); i++) {
            Button t = layerTabs.get(i);
            t.getStyleClass().removeAll("layer-tab", "layer-tab-active");
            t.getStyleClass().add(currentLayer == i ? "layer-tab-active" : "layer-tab");
        }
    }

    private GridPane buildKeyGrid() {
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        int cols = getModelCols();
        for (int i = 0; i < cols; i++) {
            ColumnConstraints cc = new ColumnConstraints();
            cc.setPercentWidth(100.0 / cols);
            grid.getColumnConstraints().add(cc);
        }
        refreshGrid(grid);
        return grid;
    }

    private void refreshGrid(GridPane grid) {
        grid.getChildren().clear();
        DeviceModel model = SerialService.getInstance().getDetectedModel();
        int keyCount = (model.keyCount > 0) ? model.keyCount : 12;
        int cols     = getModelCols();
        for (int i = 0; i < keyCount; i++) {
            final int idx = i;
            KeyConfig k = cfg.getConfig().getLayerKey(currentLayer, i);
            VBox cell = buildKeyCell(k, idx);
            grid.add(cell, i % cols, i / cols);
        }
    }

    private int getModelCols() {
        int[] shape = SerialService.getInstance().getDetectedModel().gridShape();
        return (shape[1] > 0) ? shape[1] : 4;
    }

    private VBox buildKeyCell(KeyConfig k, int idx) {
        VBox cell = new VBox(3);
        cell.getStyleClass().addAll("key-cell", getTypeClass(k.getActionType()));
        if (idx == selectedKey) cell.getStyleClass().add("selected");
        cell.setAlignment(Pos.CENTER);
        cell.setPadding(new Insets(8));
        cell.setMinHeight(95);

        String nameText = k.getLabel().isEmpty() ? "—" : k.getLabel();
        Label nameLbl = new Label(nameText);
        nameLbl.getStyleClass().add(k.getLabel().isEmpty() ? "key-name-empty" : "key-name");
        nameLbl.setAlignment(Pos.CENTER);
        nameLbl.setWrapText(true);
        nameLbl.setMaxWidth(Double.MAX_VALUE);
        nameLbl.setStyle("-fx-text-alignment: center;");

        String sub = getSubText(k);
        Label comboLbl = new Label(sub);
        comboLbl.getStyleClass().add("key-combo");
        comboLbl.setAlignment(Pos.CENTER);
        comboLbl.setMaxWidth(Double.MAX_VALUE);
        comboLbl.setStyle("-fx-text-alignment: center;");

        cell.getChildren().addAll(nameLbl, comboLbl);
        cell.setOnMouseClicked(e -> selectKey(idx));
        cell.setCursor(javafx.scene.Cursor.HAND);
        return cell;
    }

    private String getTypeClass(ActionType t) {
        return switch (t) {
            case KEYBOARD   -> "type-kb";
            case APP        -> "type-app";
            case MUTE       -> "type-mute";
            case MEDIA      -> "type-media";
            case AUTOHOTKEY -> "type-ahk";
        };
    }
    private String getBadgeText(ActionType t) {
        return switch (t) {
            case KEYBOARD   -> "KBD";
            case APP        -> "APP";
            case MUTE       -> "MUTE";
            case MEDIA      -> "MÉDIA";
            case AUTOHOTKEY -> "AHK";
        };
    }
    private String getBadgeClass(ActionType t) {
        return switch (t) {
            case KEYBOARD   -> "badge-kb";
            case APP        -> "badge-app";
            case MUTE       -> "badge-mute";
            case MEDIA      -> "badge-media";
            case AUTOHOTKEY -> "badge-ahk";
        };
    }
    private String getSubText(KeyConfig k) {
        return switch (k.getActionType()) {
            case KEYBOARD   -> k.getComboString().isEmpty() ? "non assignée" : k.getComboString();
            case APP        -> k.getAppLabel().isEmpty() ? k.getAppPath() : k.getAppLabel();
            case MUTE       -> "Mute " + k.getMuteTarget();
            case MEDIA      -> k.getMediaKey();
            case AUTOHOTKEY -> {
                String path = k.getAhkScriptPath();
                if (path.isEmpty()) yield "Non configuré";
                int sep = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
                yield sep >= 0 ? path.substring(sep + 1) : path;
            }
        };
    }

    // ── DETAIL PANEL ─────────────────────────────────────────────────

    private VBox buildDetailPanel() {
        VBox panel = new VBox(14);
        panel.getStyleClass().addAll("card", "detail-panel");

        HBox hdr = new HBox();
        Label t2 = new Label("Configuration de la touche");
        t2.getStyleClass().add("detail-title");
        t2.setId("detail-title");
        Region spr = new Region(); HBox.setHgrow(spr, Priority.ALWAYS);
        Button cb2 = new Button("×");
        cb2.getStyleClass().add("close-btn");
        cb2.setOnAction(e -> closeDetail());
        hdr.getChildren().addAll(t2, spr, cb2);
        hdr.setAlignment(Pos.CENTER_LEFT);

        Label lblLbl = new Label("Étiquette (nom affiché)");
        lblLbl.getStyleClass().add("form-label");
        labelField = new TextField();
        labelField.setPromptText("ex: Mute, OBS Scène 1, Chrome...");
        labelField.getStyleClass().add("form-field");

        Label typeLbl = new Label("Type d'action");
        typeLbl.getStyleClass().add("form-label");
        typeGroup = new ToggleGroup();
        rbKeyboard = new RadioButton("⌨ Raccourci");
        rbApp      = new RadioButton("🚀 App");
        rbMute     = new RadioButton("🔇 Mute");
        rbMedia    = new RadioButton("▶ Média");
        rbAhk      = new RadioButton("📜 AHK");
        for (RadioButton rb : List.of(rbKeyboard, rbApp, rbMute, rbMedia, rbAhk)) {
            rb.setToggleGroup(typeGroup);
            rb.getStyleClass().add("type-radio");
        }
        rbKeyboard.setSelected(true);
        HBox typeRow = new HBox(10, rbKeyboard, rbApp, rbMute, rbMedia, rbAhk);
        typeRow.setAlignment(Pos.CENTER_LEFT);

        // Sous-panneaux — construits avant l'ajout du listener
        subKeyboard = buildSubKeyboard();
        subApp      = buildSubApp();
        subMute     = buildSubMute();
        subMedia    = buildSubMedia();
        subAhk      = buildSubAhk();

        StackPane subStack = new StackPane(subKeyboard, subApp, subMute, subMedia, subAhk);
        subApp.setVisible(false);  subApp.setManaged(false);
        subMute.setVisible(false); subMute.setManaged(false);
        subMedia.setVisible(false);subMedia.setManaged(false);
        subAhk.setVisible(false);  subAhk.setManaged(false);

        // Listener : change de sous-panneau quand l'utilisateur clique un radio
        typeGroup.selectedToggleProperty().addListener((obs, old, nw) -> {
            if (nw == null) return;  // Ignorer les transitions vers null
            subKeyboard.setVisible(false); subKeyboard.setManaged(false);
            subApp.setVisible(false);      subApp.setManaged(false);
            subMute.setVisible(false);     subMute.setManaged(false);
            subMedia.setVisible(false);    subMedia.setManaged(false);
            subAhk.setVisible(false);      subAhk.setManaged(false);
            VBox active = nw == rbKeyboard ? subKeyboard
                        : nw == rbApp      ? subApp
                        : nw == rbMute     ? subMute
                        : nw == rbMedia    ? subMedia
                        : subAhk;
            active.setVisible(true); active.setManaged(true);
            refreshPreview();
        });

        Button saveBtn   = new Button("Enregistrer");
        Button clearBtn  = new Button("Effacer");
        Button cancelBtn = new Button("Annuler");
        saveBtn.getStyleClass().addAll("btn", "btn-primary");
        clearBtn.getStyleClass().addAll("btn", "btn-danger");
        cancelBtn.getStyleClass().add("btn");
        saveBtn.setOnAction(e -> saveKey());
        clearBtn.setOnAction(e -> clearKey());
        cancelBtn.setOnAction(e -> closeDetail());
        HBox btnRow = new HBox(10, saveBtn, clearBtn, cancelBtn);
        btnRow.setAlignment(Pos.CENTER_LEFT);

        panel.getChildren().addAll(hdr, sep(), field(lblLbl, labelField), sep(),
                typeLbl, typeRow, subStack, sep(), btnRow);
        return panel;
    }

    private VBox buildSubKeyboard() {
        VBox sub = new VBox(10);

        Label modLbl = new Label("Modificateurs");
        modLbl.getStyleClass().add("form-label");
        cbCtrl  = new CheckBox("Ctrl");
        cbShift = new CheckBox("Shift");
        cbAlt   = new CheckBox("Alt");
        cbGui   = new CheckBox("Win/Cmd");
        for (CheckBox cb : List.of(cbCtrl, cbShift, cbAlt, cbGui)) {
            cb.getStyleClass().add("mod-check");
            cb.setOnAction(e -> refreshPreview());
        }
        HBox modRow = new HBox(12, cbCtrl, cbShift, cbAlt, cbGui);

        Label keyLbl = new Label("Touche principale");
        keyLbl.getStyleClass().add("form-label");
        keyCombo = new ComboBox<>();
        keyCombo.setMaxWidth(Double.MAX_VALUE);
        keyCombo.getItems().addAll(buildKeyList());
        keyCombo.setOnAction(e -> refreshPreview());

        Label prevLbl = new Label("Aperçu du raccourci");
        prevLbl.getStyleClass().add("form-label");
        previewLabel = new Label("Aucun raccourci");
        previewLabel.getStyleClass().add("combo-preview");

        sub.getChildren().addAll(field(modLbl, modRow), field(keyLbl, keyCombo), field(prevLbl, previewLabel));
        return sub;
    }

    // ── Cache de recherche (partagé entre instances) ──────────────────
    private static volatile List<String[]> scannedApps = null;
    private static volatile boolean        scanInProgress = false;

    private static final String[][] KNOWN_APPS = {
        {"Chrome",       "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"},
        {"Firefox",      "C:\\Program Files\\Mozilla Firefox\\firefox.exe"},
        {"Notepad",      "notepad.exe"},
        {"OBS",          "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe"},
        {"Discord",      "%LOCALAPPDATA%\\Discord\\Update.exe --processStart Discord.exe"},
        {"Spotify",      "%APPDATA%\\Spotify\\Spotify.exe"},
        {"VS Code",      "%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe"},
        {"Explorateur",  "explorer.exe"},
        {"Calculette",   "calc.exe"},
        {"Terminal",     "cmd.exe"},
        {"Task Manager", "taskmgr.exe"},
        {"Paint",        "mspaint.exe"},
        {"Edge",         "msedge.exe"},
        {"PowerShell",   "powershell.exe"},
        {"Word",         "%LOCALAPPDATA%\\Microsoft\\WindowsApps\\winword.exe"},
        {"Excel",        "%LOCALAPPDATA%\\Microsoft\\WindowsApps\\excel.exe"},
        {"Steam",        "C:\\Program Files (x86)\\Steam\\steam.exe"},
        {"Slack",        "%LOCALAPPDATA%\\slack\\slack.exe"},
        {"Teams",        "%LOCALAPPDATA%\\Microsoft\\Teams\\current\\Teams.exe"},
        {"VLC",          "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe"},
        {"Reaper",       "C:\\Program Files\\REAPER (x64)\\reaper.exe"},
        {"Audacity",     "C:\\Program Files\\Audacity\\Audacity.exe"},
        {"7-Zip",        "C:\\Program Files\\7-Zip\\7zFM.exe"},
        {"Winrar",       "C:\\Program Files\\WinRAR\\WinRAR.exe"},
        {"Paramètres",   "ms-settings:"},
        {"Bloc-notes",   "explorer.exe shell:AppsFolder\\Microsoft.WindowsNotepad_8wekyb3d8bbwe!App"},
        {"Store",        "explorer.exe shell:AppsFolder\\Microsoft.WindowsStore_8wekyb3d8bbwe!App"},
        {"Photos",       "explorer.exe shell:AppsFolder\\Microsoft.Windows.Photos_8wekyb3d8bbwe!App"},
        {"Capture",      "explorer.exe shell:AppsFolder\\Microsoft.ScreenSketch_8wekyb3d8bbwe!App"},
        {"Sticky Notes", "explorer.exe shell:AppsFolder\\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe!App"},
        {"Xbox",         "explorer.exe shell:AppsFolder\\Microsoft.GamingApp_8wekyb3d8bbwe!Microsoft.Xbox.App"},
    };

    private VBox buildSubApp() {
        VBox sub = new VBox(10);

        // ── Chemin manuel ─────────────────────────────────────────────
        Label pathLbl = new Label("Chemin de l'application");
        pathLbl.getStyleClass().add("form-label");
        appPathField = new TextField();
        appPathField.setPromptText("C:\\Program Files\\...\\app.exe  ou  calc.exe");

        Button browseBtn = new Button("Parcourir...");
        browseBtn.getStyleClass().add("btn");
        browseBtn.setOnAction(e -> {
            FileChooser fc = new FileChooser();
            fc.setTitle("Sélectionner une application");
            fc.getExtensionFilters().addAll(
                new ExtensionFilter("Exécutables (*.exe)", "*.exe"),
                new ExtensionFilter("Tous les fichiers (*.*)", "*.*")
            );
            File file = fc.showOpenDialog(appPathField.getScene().getWindow());
            if (file != null) {
                appPathField.setText(file.getAbsolutePath());
                if (labelField.getText().isBlank())
                    labelField.setText(file.getName().replaceFirst("\\.exe$", ""));
            }
        });

        HBox pathRow = new HBox(8, appPathField, browseBtn);
        HBox.setHgrow(appPathField, Priority.ALWAYS);
        pathRow.setAlignment(Pos.CENTER_LEFT);

        // ── Recherche d'applications ──────────────────────────────────
        Label searchLbl = new Label("Rechercher une application");
        searchLbl.getStyleClass().add("form-label");

        TextField searchField = new TextField();
        searchField.setPromptText("Spotify, Chrome, Reaper...");

        Button scanBtn = new Button("↺ Scanner les apps installées");
        scanBtn.getStyleClass().add("btn");
        if (scannedApps != null)
            scanBtn.setText("✓ " + scannedApps.size() + " apps indexées");

        VBox resultsBox = new VBox(3);
        ScrollPane resultsScroll = new ScrollPane(resultsBox);
        resultsScroll.setMaxHeight(150);
        resultsScroll.setFitToWidth(true);
        resultsScroll.getStyleClass().add("edge-to-edge");
        resultsScroll.setVisible(false);
        resultsScroll.setManaged(false);

        Runnable filterApps = () -> {
            String q = searchField.getText().trim().toLowerCase();
            resultsBox.getChildren().clear();
            if (q.length() < 2) {
                resultsScroll.setVisible(false);
                resultsScroll.setManaged(false);
                return;
            }
            resultsScroll.setVisible(true);
            resultsScroll.setManaged(true);

            List<String[]> combined = new ArrayList<>(List.of(KNOWN_APPS));
            if (scannedApps != null) combined.addAll(scannedApps);

            combined.stream()
                .filter(a -> a[0].toLowerCase().contains(q))
                .distinct()
                .limit(16)
                .forEach(a -> {
                    Button b = new Button(a[0]);
                    b.getStyleClass().add("quick-btn");
                    b.setMaxWidth(Double.MAX_VALUE);
                    final String p = a[1], n = a[0];
                    b.setOnAction(ev -> {
                        appPathField.setText(p);
                        if (labelField.getText().isBlank()) labelField.setText(n);
                        searchField.clear();
                    });
                    resultsBox.getChildren().add(b);
                });

            if (resultsBox.getChildren().isEmpty()) {
                Label noResult = new Label("Aucune application trouvée — essayez le scan");
                noResult.setStyle("-fx-text-fill: rgba(255,255,255,0.35); -fx-padding: 4 8 4 8;");
                resultsBox.getChildren().add(noResult);
            }
        };

        searchField.textProperty().addListener((obs, o, n) -> filterApps.run());

        scanBtn.setOnAction(e -> {
            if (scanInProgress) return;
            scanInProgress = true;
            scanBtn.setText("Scan en cours...");
            scanBtn.setDisable(true);
            Thread t = new Thread(() -> {
                List<String[]> found = scanStartMenuApps();
                Platform.runLater(() -> {
                    scannedApps = found;
                    scanInProgress = false;
                    scanBtn.setText("✓ " + found.size() + " apps indexées");
                    scanBtn.setDisable(false);
                    filterApps.run();
                });
            }, "AppScan");
            t.setDaemon(true);
            t.start();
        });

        HBox searchRow = new HBox(8, searchField, scanBtn);
        HBox.setHgrow(searchField, Priority.ALWAYS);
        searchRow.setAlignment(Pos.CENTER_LEFT);

        // ── Raccourcis rapides ────────────────────────────────────────
        Label quickLbl = new Label("Applications de bureau");
        quickLbl.getStyleClass().add("form-label");
        GridPane quickGrid = buildQuickGrid(new String[][]{
            {"Chrome",     "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"},
            {"Firefox",    "C:\\Program Files\\Mozilla Firefox\\firefox.exe"},
            {"Notepad",    "notepad.exe"},
            {"OBS",        "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe"},
            {"Discord",    "%LOCALAPPDATA%\\Discord\\Update.exe --processStart Discord.exe"},
            {"Spotify",    "%APPDATA%\\Spotify\\Spotify.exe"},
            {"VS Code",    "%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe"},
            {"Explorateur","explorer.exe"},
            {"Calculette", "calc.exe"},
            {"Terminal",   "cmd.exe"},
            {"Task Mgr",   "taskmgr.exe"},
            {"Paint",      "mspaint.exe"},
        });

        Label shellLbl = new Label("Windows Apps (shell:AppsFolder)");
        shellLbl.getStyleClass().add("form-label");
        GridPane shellGrid = buildQuickGrid(new String[][]{
            {"Edge",         "msedge.exe"},
            {"Terminal",     "wt.exe"},
            {"PowerShell",   "powershell.exe"},
            {"Paramètres",   "ms-settings:"},
            {"Photos",       "explorer.exe shell:AppsFolder\\Microsoft.Windows.Photos_8wekyb3d8bbwe!App"},
            {"Musique",      "explorer.exe shell:AppsFolder\\Microsoft.ZuneMusic_8wekyb3d8bbwe!Microsoft.ZuneMusic"},
            {"Xbox",         "explorer.exe shell:AppsFolder\\Microsoft.GamingApp_8wekyb3d8bbwe!Microsoft.Xbox.App"},
            {"Store",        "explorer.exe shell:AppsFolder\\Microsoft.WindowsStore_8wekyb3d8bbwe!App"},
            {"Capture",      "explorer.exe shell:AppsFolder\\Microsoft.ScreenSketch_8wekyb3d8bbwe!App"},
            {"Sticky Notes", "explorer.exe shell:AppsFolder\\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe!App"},
            {"Copilot",      "explorer.exe shell:AppsFolder\\Microsoft.Copilot_8wekyb3d8bbwe!App"},
            {"Bloc-notes",   "explorer.exe shell:AppsFolder\\Microsoft.WindowsNotepad_8wekyb3d8bbwe!App"},
        });

        Label infoLbl = new Label("💡 La touche envoie son F-key. Lier dans PowerToys Keyboard Manager ou AutoHotkey.");
        infoLbl.getStyleClass().add("info-box-amber");
        infoLbl.setWrapText(true);

        sub.getChildren().addAll(
            field(pathLbl, pathRow),
            field(searchLbl, new VBox(6, searchRow, resultsScroll)),
            field(quickLbl, quickGrid),
            field(shellLbl, shellGrid),
            infoLbl
        );
        return sub;
    }

    /** Scanne les raccourcis du Menu Démarrer et résout leurs cibles .exe via PowerShell. */
    private static List<String[]> scanStartMenuApps() {
        List<String[]> result = new ArrayList<>();
        try {
            String userApps   = System.getenv("APPDATA")      + "\\Microsoft\\Windows\\Start Menu\\Programs";
            String commonApps = System.getenv("ProgramData")  + "\\Microsoft\\Windows\\Start Menu\\Programs";
            String cmd =
                "$shell=New-Object -ComObject WScript.Shell;" +
                "Get-ChildItem -Path '" + userApps.replace("'","''") +
                "','" + commonApps.replace("'","''") +
                "' -Recurse -Filter '*.lnk' -ErrorAction SilentlyContinue |" +
                "ForEach-Object {" +
                "  try {" +
                "    $t=($shell.CreateShortcut($_.FullName)).TargetPath;" +
                "    if($t -and $t -like '*.exe'){$_.BaseName+'|'+$t}" +
                "  } catch {}" +
                "}";
            Process p = new ProcessBuilder(
                "powershell", "-NoProfile", "-NonInteractive", "-Command", cmd)
                .redirectErrorStream(true).start();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    String[] parts = line.split("\\|", 2);
                    if (parts.length == 2 && !parts[1].isBlank())
                        result.add(new String[]{parts[0].trim(), parts[1].trim()});
                }
            }
            p.waitFor(15, TimeUnit.SECONDS);
        } catch (Exception e) {
            DebugLogger.log("[AppSearch] Scan error: " + e.getMessage());
        }
        return result;
    }

    private VBox buildSubMute() {
        VBox sub = new VBox(10);

        Label tgtLbl = new Label("Cible du mute");
        tgtLbl.getStyleClass().add("form-label");
        muteTargetCombo = new ComboBox<>();
        muteTargetCombo.getItems().addAll("master", "mic", "discord", "system");
        muteTargetCombo.setValue("master");
        muteTargetCombo.setMaxWidth(Double.MAX_VALUE);

        Label infoLbl = new Label("ℹ Compatible VoiceMeeter, SteelSeries GG, AutoHotkey. La touche envoie son F-key dédié.");
        infoLbl.getStyleClass().add("info-box-blue");
        infoLbl.setWrapText(true);

        sub.getChildren().addAll(field(tgtLbl, muteTargetCombo), infoLbl);
        return sub;
    }

    private VBox buildSubMedia() {
        VBox sub = new VBox(10);

        Label medLbl = new Label("Action multimédia");
        medLbl.getStyleClass().add("form-label");
        mediaKeyCombo = new ComboBox<>();
        mediaKeyCombo.getItems().addAll(
                "MUTE", "PLAY_PAUSE", "NEXT_TRACK", "PREVIOUS_TRACK", "STOP");
        mediaKeyCombo.setValue("MUTE");
        mediaKeyCombo.setMaxWidth(Double.MAX_VALUE);

        Label infoLbl = new Label("✓ Fonctionne nativement sur Windows / macOS / Linux sans configuration.");
        infoLbl.getStyleClass().add("info-box-green");
        infoLbl.setWrapText(true);

        sub.getChildren().addAll(field(medLbl, mediaKeyCombo), infoLbl);
        return sub;
    }

    private VBox buildSubAhk() {
        VBox sub = new VBox(10);

        Label scriptLbl = new Label("Fichier script AutoHotkey (.ahk)");
        scriptLbl.getStyleClass().add("form-label");

        ahkScriptField = new TextField();
        ahkScriptField.setPromptText("C:\\scripts\\mon_script.ahk");

        Button browseBtn = new Button("Parcourir...");
        browseBtn.getStyleClass().add("btn");
        browseBtn.setOnAction(e -> {
            FileChooser fc = new FileChooser();
            fc.setTitle("Sélectionner un script AutoHotkey");
            fc.getExtensionFilters().addAll(
                new ExtensionFilter("Scripts AutoHotkey (*.ahk)", "*.ahk"),
                new ExtensionFilter("Tous les fichiers (*.*)", "*.*")
            );
            File file = fc.showOpenDialog(ahkScriptField.getScene().getWindow());
            if (file != null) {
                ahkScriptField.setText(file.getAbsolutePath());
                if (labelField.getText().isBlank())
                    labelField.setText(file.getName().replaceFirst("\\.ahk$", ""));
            }
        });

        HBox pathRow = new HBox(8, ahkScriptField, browseBtn);
        HBox.setHgrow(ahkScriptField, Priority.ALWAYS);
        pathRow.setAlignment(Pos.CENTER_LEFT);

        Label snippetLbl = new Label("Raccourci AHK (à ajouter dans votre script)");
        snippetLbl.getStyleClass().add("form-label");
        Label snippetCode = new Label(
            "; Dans votre script AutoHotkey :\n" +
            "F13::  Run, \"C:\\scripts\\mon_script.ahk\"\nreturn"
        );
        snippetCode.getStyleClass().add("combo-preview");
        snippetCode.setWrapText(true);

        Label infoLbl = new Label(
            "ℹ La touche envoie son F-key (F13–F24). AutoHotkey intercepte ce F-key et exécute votre script. " +
            "Remplacez F13 par le F-key correspondant à la position de la touche (T1=F13, T2=F14…)."
        );
        infoLbl.getStyleClass().add("info-box-blue");
        infoLbl.setWrapText(true);

        sub.getChildren().addAll(field(scriptLbl, pathRow), field(snippetLbl, snippetCode), infoLbl);
        return sub;
    }

    private GridPane buildQuickGrid(String[][] apps) {
        GridPane grid = new GridPane();
        grid.setHgap(6); grid.setVgap(6);
        for (int col = 0; col < 3; col++) {
            ColumnConstraints cc = new ColumnConstraints();
            cc.setPercentWidth(33.3);
            grid.getColumnConstraints().add(cc);
        }
        for (int i = 0; i < apps.length; i++) {
            final String[] app = apps[i];
            Button b = new Button(app[0]);
            b.getStyleClass().add("quick-btn");
            b.setMaxWidth(Double.MAX_VALUE);
            b.setOnAction(e -> {
                appPathField.setText(app[1]);
                if (labelField.getText().isBlank()) labelField.setText(app[0]);
            });
            grid.add(b, i % 3, i / 3);
        }
        return grid;
    }

    // ── ACTIONS ──────────────────────────────────────────────────────

    private void selectKey(int idx) {
        selectedKey = idx;
        KeyConfig k = cfg.getConfig().getLayerKey(currentLayer, idx);

        ((Label) detailPanel.lookup("#detail-title")).setText("Touche " + (idx + 1));
        labelField.setText(k.getLabel());

        // Déterminer radio button et sous-panneau selon le type
        RadioButton rb;
        VBox activeSub;
        switch (k.getActionType()) {
            case APP        -> { rb = rbApp;      activeSub = subApp; }
            case MUTE       -> { rb = rbMute;     activeSub = subMute; }
            case MEDIA      -> { rb = rbMedia;    activeSub = subMedia; }
            case AUTOHOTKEY -> { rb = rbAhk;      activeSub = subAhk; }
            default         -> { rb = rbKeyboard; activeSub = subKeyboard; }
        }

        // Forcer la visibilité du bon sous-panneau (sans passer par null)
        subKeyboard.setVisible(false); subKeyboard.setManaged(false);
        subApp.setVisible(false);      subApp.setManaged(false);
        subMute.setVisible(false);     subMute.setManaged(false);
        subMedia.setVisible(false);    subMedia.setManaged(false);
        subAhk.setVisible(false);      subAhk.setManaged(false);
        activeSub.setVisible(true);    activeSub.setManaged(true);

        // Sélectionner le radio button (le listener n'a plus qu'à gérer les clics utilisateur)
        typeGroup.selectToggle(rb);

        cbCtrl.setSelected(k.getModifiers().contains("LEFT_CONTROL"));
        cbShift.setSelected(k.getModifiers().contains("LEFT_SHIFT"));
        cbAlt.setSelected(k.getModifiers().contains("LEFT_ALT"));
        cbGui.setSelected(k.getModifiers().contains("LEFT_GUI"));
        keyCombo.setValue(k.getKey());
        appPathField.setText(k.getAppPath());
        ahkScriptField.setText(k.getAhkScriptPath());
        muteTargetCombo.setValue(k.getMuteTarget());
        mediaKeyCombo.setValue(k.getMediaKey());

        refreshPreview();
        detailPanel.setVisible(true);
        detailPanel.setManaged(true);
        refreshGrid(keyGrid);
    }

    // Debug logging removed for production

    private void saveKey() {
        if (selectedKey < 0) {
            dbg("[saveKey] ANNULÉ selectedKey=" + selectedKey);
            return;
        }
        KeyConfig k = cfg.getConfig().getLayerKey(currentLayer, selectedKey);
        k.setLabel(labelField.getText().trim());

        Toggle sel = typeGroup.getSelectedToggle();
        DebugLogger.log("[KeysController] saveKey idx=" + selectedKey
            + " sel=" + (sel == null ? "NULL"
                       : sel == rbKeyboard ? "KEYBOARD"
                       : sel == rbApp      ? "APP"
                       : sel == rbMute     ? "MUTE"
                       : sel == rbMedia    ? "MEDIA"
                       : sel == rbAhk      ? "AHK"
                       : "INCONNU"));

        if (sel == rbKeyboard || sel == null) {
            k.setActionType(ActionType.KEYBOARD);
            List<String> mods = new ArrayList<>();
            if (cbCtrl.isSelected())  mods.add("LEFT_CONTROL");
            if (cbShift.isSelected()) mods.add("LEFT_SHIFT");
            if (cbAlt.isSelected())   mods.add("LEFT_ALT");
            if (cbGui.isSelected())   mods.add("LEFT_GUI");
            k.setModifiers(mods);
            k.setKey(keyCombo.getValue() != null ? keyCombo.getValue() : "");
        } else if (sel == rbApp) {
            k.setActionType(ActionType.APP);
            k.setAppPath(appPathField.getText().trim());
            k.setAppLabel(labelField.getText().trim());
        } else if (sel == rbMute) {
            k.setActionType(ActionType.MUTE);
            k.setMuteTarget(muteTargetCombo.getValue() != null ? muteTargetCombo.getValue() : "master");
        } else if (sel == rbMedia) {
            k.setActionType(ActionType.MEDIA);
            k.setMediaKey(mediaKeyCombo.getValue() != null ? mediaKeyCombo.getValue() : "MUTE");
        } else if (sel == rbAhk) {
            k.setActionType(ActionType.AUTOHOTKEY);
            k.setAhkScriptPath(ahkScriptField.getText().trim());
        }

        dbg("[saveKey] résultat T" + (selectedKey+1) + " label=" + k.getLabel() + " type=" + k.getActionType());
        try {
            cfg.save();
            DebugLogger.log("[KeysController] Configuration saved successfully");
            closeDetail();
            dbg("[saveKey] closeDetail() OK");
            onSaveSuccess();
            dbg("[saveKey] onSaveSuccess() OK");
        } catch (Throwable t) {
            DebugLogger.log("[KeysController] Save exception: " + t.getClass().getName() + " - " + t.getMessage());
            DebugLogger.log("[KeysController] saveKey failure", t);
        }
    }

    protected void onSaveSuccess() {}

    private void clearKey() {
        if (selectedKey < 0) return;
        KeyConfig k = cfg.getConfig().getLayerKey(currentLayer, selectedKey);
        k.setLabel(""); k.setModifiers(new ArrayList<>()); k.setKey("");
        k.setActionType(ActionType.KEYBOARD); k.setAppPath(""); k.setAppLabel("");
        k.setMuteTarget("master"); k.setAhkScriptPath("");
        cfg.save();
        closeDetail();
        onSaveSuccess();
    }

    private void closeDetail() {
        selectedKey = -1;
        detailPanel.setVisible(false);
        detailPanel.setManaged(false);
        refreshGrid(keyGrid);
    }

    private void refreshPreview() {
        if (previewLabel == null) return;
        List<String> parts = new ArrayList<>();
        if (cbCtrl.isSelected())  parts.add("Ctrl");
        if (cbShift.isSelected()) parts.add("Shift");
        if (cbAlt.isSelected())   parts.add("Alt");
        if (cbGui.isSelected())   parts.add("Win");
        String key = keyCombo.getValue();
        if (key != null && !key.isEmpty()) parts.add(key);
        previewLabel.setText(parts.isEmpty() ? "Aucun raccourci" : String.join(" + ", parts));
    }

    private List<String> buildKeyList() {
        List<String> list = new ArrayList<>();
        for (int i = 13; i <= 24; i++) list.add("F" + i);
        for (int i = 1;  i <= 12; i++) list.add("F" + i);
        for (char c = 'A'; c <= 'Z'; c++) list.add(String.valueOf(c));
        list.addAll(List.of("ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE"));
        list.addAll(List.of("SPACE","ENTER","ESCAPE","TAB","DELETE","BACKSPACE",
                "HOME","END","PAGE_UP","PAGE_DOWN","UP_ARROW","DOWN_ARROW","LEFT_ARROW","RIGHT_ARROW",
                "PRINT_SCREEN","PERIOD","COMMA","SEMICOLON","QUOTE","GRAVE_ACCENT",
                "LEFT_BRACKET","RIGHT_BRACKET","BACKSLASH","MINUS","EQUALS"));
        return list;
    }

    private VBox field(Label lbl, javafx.scene.Node input) {
        return new VBox(5, lbl, input);
    }
    private Region sep() {
        Region r = new Region(); r.setPrefHeight(1); r.getStyleClass().add("form-sep");
        return r;
    }
}
