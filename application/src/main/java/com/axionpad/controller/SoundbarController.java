package com.axionpad.controller;

import com.axionpad.model.SliderConfig;
import com.axionpad.service.ConfigService;
import com.axionpad.service.I18n;
import com.axionpad.service.WindowsVolumeService;
import javafx.animation.*;
import java.util.function.Consumer;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.shape.Rectangle;
import javafx.util.Duration;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller de la page "Sound Bar" :
 * - Barres de niveau animées (mises à jour depuis les données série)
 * - Bouton mute master
 * - Mute individuel par canal
 * - Console série
 */
public class SoundbarController {

    private final ConfigService cfg;

    // UI refs pour mise à jour live
    private final List<ProgressBar> levelBars = new ArrayList<>();
    private final List<Label> levelPcts = new ArrayList<>();
    private final List<Button> muteBtns = new ArrayList<>();
    private final List<Boolean> chMuted = new ArrayList<>(List.of(false, false, false, false));

    private boolean masterMuted = false;
    private Label masterStatusLabel;
    private Button masterMuteBtn;
    private Label masterPctLabel;

    private TextArea serialLogArea;

    // DEEJ live labels
    private final List<Label> deejVals = new ArrayList<>();

    // Demo animation
    private Timeline demoAnim;
    private final int[] currentVals = {512, 512, 512, 512};

    private Consumer<String> onNavigate;

    public SoundbarController(ConfigService cfg) { this.cfg = cfg; }

    /** Callback pour naviguer vers une autre page (ex: "sliders"). */
    public void setOnNavigate(Consumer<String> cb) { this.onNavigate = cb; }

    public Pane buildView() {
        levelBars.clear(); levelPcts.clear(); muteBtns.clear(); deejVals.clear();

        VBox root = new VBox(16);
        root.getStyleClass().add("page-root");
        root.setPadding(new Insets(24));

        Label title = new Label(I18n.t("soundbar.title"));
        title.getStyleClass().add("page-title");
        Label desc = new Label("Niveaux audio en temps réel depuis le Micro Pad. Connecte le pad via le bouton en haut à droite.");
        desc.getStyleClass().add("page-desc");
        desc.setWrapText(true);

        // Bandeau "Modifier les canaux"
        Button editChannelsBtn = new Button(I18n.t("soundbar.edit.hint"));
        editChannelsBtn.getStyleClass().addAll("btn", "btn-link-hint");
        editChannelsBtn.setMaxWidth(Double.MAX_VALUE);
        editChannelsBtn.setOnAction(e -> { if (onNavigate != null) onNavigate.accept("sliders"); });

        // Master mute row
        HBox masterRow = buildMasterRow();

        // Main layout
        HBox mainLayout = new HBox(16);
        VBox channels = buildChannels();
        HBox.setHgrow(channels, Priority.ALWAYS);
        VBox rightPanel = buildRightPanel();
        rightPanel.setPrefWidth(270);
        mainLayout.getChildren().addAll(channels, rightPanel);

        root.getChildren().addAll(title, desc, editChannelsBtn, masterRow, mainLayout);

        startDemoAnimation();
        return root;
    }

    private HBox buildMasterRow() {
        HBox row = new HBox(16);
        row.getStyleClass().add("master-mute-row");
        row.setAlignment(Pos.CENTER_LEFT);
        row.setPadding(new Insets(16));

        masterMuteBtn = new Button("🔊");
        masterMuteBtn.getStyleClass().addAll("big-mute-btn");
        masterMuteBtn.setOnAction(e -> toggleMasterMute());

        VBox info = new VBox(4);
        masterStatusLabel = new Label("Volume master : actif");
        masterStatusLabel.getStyleClass().add("master-status");
        Label sub = new Label("Clic pour muter / démuter. La touche mute du pad peut aussi déclencher ceci.");
        sub.getStyleClass().add("master-sub");
        sub.setWrapText(true);
        info.getChildren().addAll(masterStatusLabel, sub);
        HBox.setHgrow(info, Priority.ALWAYS);

        masterPctLabel = new Label("100%");
        masterPctLabel.getStyleClass().add("master-pct");

        row.getChildren().addAll(masterMuteBtn, info, masterPctLabel);
        return row;
    }

    private VBox buildChannels() {
        VBox box = new VBox(10);
        String[] icons = {"🎵", "💬", "🌐", "🎙"};

        for (int i = 0; i < 4; i++) {
            final int idx = i;
            SliderConfig s = cfg.getConfig().getSlider(i);

            HBox row = new HBox(14);
            row.getStyleClass().add("channel-row");
            row.setAlignment(Pos.CENTER_LEFT);
            row.setPadding(new Insets(13, 16, 13, 16));
            row.setId("ch-row-" + i);

            // Icon
            Label icon = new Label(icons[i]);
            icon.getStyleClass().add("channel-icon");

            // Info + bar
            VBox info = new VBox(4);
            HBox.setHgrow(info, Priority.ALWAYS);
            Label nameLabel = new Label(s.getLabel() + "  ");
            nameLabel.getStyleClass().add("channel-name");
            Label tagLabel = new Label("→ " + s.getChannel());
            tagLabel.getStyleClass().add("channel-tag");
            HBox nameLine = new HBox(nameLabel, tagLabel);
            nameLine.setAlignment(Pos.CENTER_LEFT);

            ProgressBar bar = new ProgressBar(0.5);
            bar.getStyleClass().add("level-bar");
            bar.setMaxWidth(Double.MAX_VALUE);
            levelBars.add(bar);

            HBox pctRow = new HBox();
            Label pct = new Label("50%");
            pct.getStyleClass().add("channel-pct");
            levelPcts.add(pct);
            Region sp1 = new Region(); HBox.setHgrow(sp1, Priority.ALWAYS);
            Region sp2 = new Region(); HBox.setHgrow(sp2, Priority.ALWAYS);
            pctRow.getChildren().addAll(new Label("0"), sp1, pct, sp2, new Label("100%"));
            for (Label l : List.of((Label) pctRow.getChildren().get(0), (Label) pctRow.getChildren().get(4)))
                l.getStyleClass().add("bar-range-lbl");

            info.getChildren().addAll(nameLine, bar, pctRow);

            // Slider manuel
            Slider manSlider = new Slider(0, 100, 50);
            manSlider.setPrefWidth(120);
            manSlider.getStyleClass().add("manual-slider");
            manSlider.valueProperty().addListener((obs, o, nv) -> {
                double p = nv.doubleValue() / 100.0;
                levelBars.get(idx).setProgress(p);
                levelPcts.get(idx).setText((int) nv.doubleValue() + "%");
                currentVals[idx] = (int)(nv.doubleValue() * 10.23);
                masterPctLabel.setText((int) nv.doubleValue() + "%");
            });

            // Mute button
            Button muteBtn = new Button("🔊");
            muteBtn.getStyleClass().add("channel-mute-btn");
            muteBtns.add(muteBtn);
            muteBtn.setOnAction(e -> toggleChannelMute(idx));

            row.getChildren().addAll(icon, info, manSlider, muteBtn);
            box.getChildren().add(row);
        }
        return box;
    }

    private VBox buildRightPanel() {
        VBox panel = new VBox(12);

        // DEEJ live values
        VBox deejBox = new VBox(10);
        deejBox.getStyleClass().add("card");
        Label deejTitle = new Label("AXIONPAD NATIVE — VALEURS EN DIRECT");
        deejTitle.getStyleClass().add("card-title");
        HBox deejRow = new HBox(8);
        for (int i = 0; i < 4; i++) {
            VBox cell = new VBox(4);
            cell.getStyleClass().add("deej-val-cell");
            cell.setAlignment(Pos.CENTER);
            cell.setPadding(new Insets(8));
            Label lbl = new Label("POT" + (i + 1));
            lbl.getStyleClass().add("deej-cell-label");
            Label val = new Label("—");
            val.getStyleClass().add("deej-cell-val");
            deejVals.add(val);
            cell.getChildren().addAll(lbl, val);
            HBox.setHgrow(cell, Priority.ALWAYS);
            deejRow.getChildren().add(cell);
        }
        deejBox.getChildren().addAll(deejTitle, deejRow);

        // Serial log
        VBox logBox = new VBox(8);
        logBox.getStyleClass().add("card");
        Label logTitle = new Label("CONSOLE SÉRIE");
        logTitle.getStyleClass().add("card-title");
        serialLogArea = new TextArea();
        serialLogArea.setEditable(false);
        serialLogArea.setPrefRowCount(8);
        serialLogArea.getStyleClass().add("serial-log");
        serialLogArea.setWrapText(false);
        Button clearBtn = new Button("Vider");
        clearBtn.getStyleClass().add("btn");
        clearBtn.setOnAction(e -> serialLogArea.clear());
        logBox.getChildren().addAll(logTitle, serialLogArea, clearBtn);

        panel.getChildren().addAll(deejBox, logBox);
        return panel;
    }

    // ── UPDATES (called from SerialService) ──────────────────────────

    public void updateSliderValues(int[] vals) {
        if (vals == null || vals.length < 4) return;
        stopDemoAnimation();
        for (int i = 0; i < 4; i++) {
            currentVals[i] = vals[i];
            if (!chMuted.get(i)) {
                double pct = vals[i] / 1023.0;
                if (i < levelBars.size()) {
                    levelBars.get(i).setProgress(pct);
                    levelBars.get(i).getStyleClass().removeAll("bar-hi","bar-clip");
                    if (pct > 0.85) levelBars.get(i).getStyleClass().add("bar-clip");
                    else if (pct > 0.6) levelBars.get(i).getStyleClass().add("bar-hi");
                }
                if (i < levelPcts.size()) levelPcts.get(i).setText((int)(pct * 100) + "%");
                if (i < deejVals.size()) deejVals.get(i).setText(String.valueOf(vals[i]));
            }
        }
        int avg = (vals[0] + vals[1] + vals[2] + vals[3]) / 4;
        masterPctLabel.setText((int)(avg / 10.23) + "%");
    }

    public void appendLog(String msg) {
        if (serialLogArea != null) {
            serialLogArea.appendText(msg + "\n");
        }
    }

    // ── MUTE ─────────────────────────────────────────────────────────

    private void toggleMasterMute() {
        masterMuted = !masterMuted;
        masterMuteBtn.setText(masterMuted ? "🔇" : "🔊");
        masterMuteBtn.getStyleClass().removeAll("muted");
        masterStatusLabel.setText(masterMuted ? "Volume master : MUTÉ" : "Volume master : actif");
        if (masterMuted) masterMuteBtn.getStyleClass().add("muted");
        WindowsVolumeService.getInstance().toggleMute("master");
    }

    private void toggleChannelMute(int idx) {
        boolean m = !chMuted.get(idx);
        chMuted.set(idx, m);
        Button btn = muteBtns.get(idx);
        btn.setText(m ? "🔇" : "🔊");
        btn.getStyleClass().removeAll("muted");
        if (m) {
            btn.getStyleClass().add("muted");
            levelBars.get(idx).setProgress(0);
            levelPcts.get(idx).setText("0% (muté)");
        }
        String channel = cfg.getConfig().getSlider(idx).getChannel();
        WindowsVolumeService.getInstance().toggleMute(channel);
    }

    // ── DEMO ANIMATION ───────────────────────────────────────────────

    private void startDemoAnimation() {
        demoAnim = new Timeline(new KeyFrame(Duration.millis(100), e -> {
            for (int i = 0; i < 4; i++) {
                if (chMuted.get(i)) continue;
                int delta = (int)((Math.random() - 0.5) * 80);
                currentVals[i] = Math.max(0, Math.min(1023, currentVals[i] + delta));
                double pct = currentVals[i] / 1023.0;
                if (i < levelBars.size()) levelBars.get(i).setProgress(pct);
                if (i < levelPcts.size()) levelPcts.get(i).setText((int)(pct * 100) + "%");
                if (i < deejVals.size()) deejVals.get(i).setText(String.valueOf(currentVals[i]));
            }
        }));
        demoAnim.setCycleCount(Timeline.INDEFINITE);
        demoAnim.play();
    }

    private void stopDemoAnimation() {
        if (demoAnim != null) { demoAnim.stop(); demoAnim = null; }
    }
}
