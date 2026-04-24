package com.axionpad.controller;

import com.axionpad.model.SliderConfig;
import com.axionpad.service.ConfigService;
import com.axionpad.service.WindowsVolumeService;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller de la page "Potentiomètres" — vertical fader (DEEJ-inspired) design.
 */
public class SlidersController {

    // ── Fader geometry ──────────────────────────────────────────────────────
    private static final double FADER_W = 28;
    private static final double FADER_H = 130;
    private static final double KNOB_R  = 9;

    // ── Channel metadata ────────────────────────────────────────────────────
    private static final String[] COLORS  = { "#7c3aed", "#059669", "#0891b2", "#d97706" };
    private static final String[] EMOJIS  = { "🔊", "🎵", "🎧", "🌐" };
    private static final String[] NAMES   = { "Channel 1", "Channel 2", "Channel 3", "Channel 4" };

    // ── State ────────────────────────────────────────────────────────────────
    private final ConfigService cfg;
    private VBox  root;
    private HBox  fadersRow;
    private VBox  detailPanel;
    private int   selectedSlider = -1;

    // Form fields in detail panel
    private TextField       labelField;
    private ComboBox<String> channelCombo;
    private Button          detectBtn;

    // Live UI refs rebuilt by refreshFadersRow()
    private final List<Region> fillBars   = new ArrayList<>();
    private final List<Region> knobNodes  = new ArrayList<>();
    private final List<Label>  pctLabels  = new ArrayList<>();
    private final List<Button> muteBtns   = new ArrayList<>();
    private final List<Label>  activityDots = new ArrayList<>();

    public SlidersController(ConfigService cfg) { this.cfg = cfg; }

    // ═══════════════════════════════════════════════════════════════════════
    //  Public API
    // ═══════════════════════════════════════════════════════════════════════

    public Pane buildView() {
        root = new VBox(16);
        root.getStyleClass().add("page-root");
        root.setPadding(new Insets(24));

        Label title = new Label("Potentiomètres linéaires");
        title.getStyleClass().add("page-title");

        Label desc = new Label("Chaque potentiomètre envoie sa valeur (0-1023) via port série au format AxionPad Native. "
                + "Assigne une application à chaque canal.");
        desc.getStyleClass().add("page-desc");
        desc.setWrapText(true);

        detailPanel = buildDetailPanel();
        detailPanel.setVisible(false);
        detailPanel.setManaged(false);

        // Outer card wrapping the faders row
        VBox card = new VBox(12);
        card.getStyleClass().add("card");

        Label ct = new Label("4 CANAUX AXIONPAD NATIVE");
        ct.getStyleClass().add("card-title");

        fadersRow = new HBox(16);
        fadersRow.setAlignment(Pos.CENTER);
        fadersRow.setPadding(new Insets(12, 0, 4, 0));
        refreshFadersRow();

        card.getChildren().addAll(ct, fadersRow);

        root.getChildren().addAll(title, desc, detailPanel, card);

        // Async initial session detection
        WindowsVolumeService.getInstance().getActiveAudioSessions()
                .thenAccept(sessions -> Platform.runLater(() -> updateActivityDots(sessions)));

        return root;
    }

    /**
     * Called by the serial read loop (background thread → Platform.runLater already applied
     * by the caller in SerialService).
     */
    public void updateSliderValues(int[] vals) {
        if (vals == null || vals.length < 4) return;
        if (fillBars.size() < 4 || knobNodes.size() < 4 || pctLabels.size() < 4) return;

        for (int i = 0; i < 4; i++) {
            SliderConfig s = cfg.getConfig().getSlider(i);
            if (s.isMuted()) continue;

            double pct    = Math.min(1.0, Math.max(0.0, vals[i] / 1023.0));
            double fillH  = FADER_H * pct;
            double margin = Math.max(0, fillH - KNOB_R);

            Region fill = fillBars.get(i);
            fill.setPrefHeight(fillH);
            fill.setMaxHeight(fillH);

            Region knob = knobNodes.get(i);
            StackPane.setMargin(knob, new Insets(0, 0, margin, 0));

            pctLabels.get(i).setText((int) Math.round(pct * 100) + "%");
        }
    }

    public void toggleSliderMute(int idx) {
        SliderConfig s = cfg.getConfig().getSlider(idx);
        boolean newMuted = !s.isMuted();
        s.setMuted(newMuted);
        cfg.save();

        if (idx < muteBtns.size()) {
            Button btn = muteBtns.get(idx);
            btn.setText(newMuted ? "🔇" : "🔊");
            btn.getStyleClass().removeAll("muted");
            if (newMuted) btn.getStyleClass().add("muted");
        }

        if (newMuted && idx < fillBars.size()) {
            fillBars.get(idx).setPrefHeight(0);
            fillBars.get(idx).setMaxHeight(0);
            knobNodes.get(idx).setStyle(buildKnobStyle(COLORS[idx]));
            StackPane.setMargin(knobNodes.get(idx), new Insets(0, 0, 0, 0));
            pctLabels.get(idx).setText("0%");
        }

        WindowsVolumeService.getInstance().toggleMute(s.getChannel());
    }

    public void updateActivityDots(List<String> sessions) {
        for (int i = 0; i < 4 && i < activityDots.size(); i++) {
            String ch = cfg.getConfig().getSlider(i).getChannel();
            boolean active = ch != null && !ch.isBlank() && (
                    sessions.stream().anyMatch(ses -> ses.equalsIgnoreCase(ch))
                    || ch.equalsIgnoreCase("master")
                    || ch.equalsIgnoreCase("mic")
                    || ch.equalsIgnoreCase("system")
            );
            activityDots.get(i).setStyle(
                    "-fx-text-fill: " + (active ? "#3dd68c" : "rgba(136,136,160,0.3)") + "; -fx-font-size: 10px;");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Fader row builder
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Rebuilds the HBox children and resets all live refs.
     * Called on first build and whenever selection changes.
     */
    private void refreshFadersRow() {
        fadersRow.getChildren().clear();
        fillBars.clear();
        knobNodes.clear();
        pctLabels.clear();
        muteBtns.clear();
        activityDots.clear();

        for (int i = 0; i < 4; i++) {
            fadersRow.getChildren().add(buildFaderCard(i));
        }
    }

    private VBox buildFaderCard(int idx) {
        final String color  = COLORS[idx];
        SliderConfig s      = cfg.getConfig().getSlider(idx);
        double initPct      = s.isMuted() ? 0.0 : Math.min(1.0, s.getCurrentValue() / 1023.0);

        // ── Card container ──────────────────────────────────────────────
        VBox card = new VBox(8);
        card.getStyleClass().add("pot-card");
        if (idx == selectedSlider) card.getStyleClass().add("selected");
        card.setAlignment(Pos.CENTER);
        card.setPadding(new Insets(14, 12, 14, 12));

        // ── Percentage label ─────────────────────────────────────────────
        Label pctLbl = new Label((int) Math.round(initPct * 100) + "%");
        pctLbl.getStyleClass().add("pot-pct");
        pctLbl.setStyle("-fx-text-fill: " + color + ";");
        pctLabels.add(pctLbl);

        // ── Vertical fader ───────────────────────────────────────────────
        StackPane fader = buildFaderPane(idx, color, initPct);

        // ── Emoji ────────────────────────────────────────────────────────
        Label emoji = new Label(EMOJIS[idx]);
        emoji.getStyleClass().add("pot-emoji");

        // ── Channel name ─────────────────────────────────────────────────
        String labelText = s.getLabel().isEmpty() ? NAMES[idx] : s.getLabel();
        Label nameLbl = new Label(labelText);
        nameLbl.getStyleClass().add("pot-name");
        nameLbl.setWrapText(false);
        nameLbl.setMaxWidth(80);

        // ── Number badge ─────────────────────────────────────────────────
        Label numBadge = new Label(String.valueOf(idx + 1));
        numBadge.getStyleClass().add("pot-num");
        numBadge.setStyle("-fx-border-color: " + color + ";");

        // ── Activity dot ─────────────────────────────────────────────────
        Label actDot = new Label("●");
        actDot.setStyle("-fx-text-fill: rgba(136,136,160,0.3); -fx-font-size: 10px;");
        actDot.setTooltip(new Tooltip("Session audio détectée"));
        activityDots.add(actDot);

        // ── Mute button ──────────────────────────────────────────────────
        boolean isMuted = s.isMuted();
        Button muteBtn = new Button(isMuted ? "🔇" : "🔊");
        muteBtn.getStyleClass().add("slider-mute-btn");
        if (isMuted) muteBtn.getStyleClass().add("muted");
        muteBtn.setTooltip(new Tooltip("Muter / Démuter ce canal"));
        muteBtn.setOnAction(e -> { e.consume(); toggleSliderMute(idx); });
        muteBtns.add(muteBtn);

        // Badge + activity dot row
        HBox badgeRow = new HBox(6, numBadge, actDot);
        badgeRow.setAlignment(Pos.CENTER);

        Button configBtn = new Button("✎ Configurer");
        configBtn.getStyleClass().add("btn");
        configBtn.setMaxWidth(Double.MAX_VALUE);
        configBtn.setOnAction(e -> selectSlider(idx));

        card.getChildren().addAll(pctLbl, fader, emoji, nameLbl, badgeRow, muteBtn, configBtn);
        return card;
    }

    /** Builds the StackPane containing track, fill bar, and knob for one channel. */
    private StackPane buildFaderPane(int idx, String color, double initPct) {
        StackPane pane = new StackPane();
        pane.setPrefSize(FADER_W, FADER_H);
        pane.setMinSize(FADER_W, FADER_H);
        pane.setMaxSize(FADER_W, FADER_H);

        // Track (background rail)
        Region track = new Region();
        track.setPrefSize(FADER_W, FADER_H);
        track.setMinSize(FADER_W, FADER_H);
        track.setMaxSize(FADER_W, FADER_H);
        track.setStyle(
                "-fx-background-radius: 99;" +
                "-fx-background-color: rgba(255,255,255,0.06);" +
                "-fx-border-radius: 99;" +
                "-fx-border-color: rgba(255,255,255,0.08);" +
                "-fx-border-width: 1;"
        );

        // Fill bar (grows from bottom)
        double fillH = FADER_H * initPct;
        Region fill = new Region();
        fill.setPrefWidth(FADER_W);
        fill.setPrefHeight(fillH);
        fill.setMaxHeight(fillH);
        fill.setMinHeight(0);
        fill.setStyle(buildFillStyle(color));
        StackPane.setAlignment(fill, Pos.BOTTOM_CENTER);
        fillBars.add(fill);

        // Knob
        double knobSize = KNOB_R * 2;
        double knobMarginBottom = Math.max(0, fillH - KNOB_R);
        Region knob = new Region();
        knob.setPrefSize(knobSize, knobSize);
        knob.setMinSize(knobSize, knobSize);
        knob.setMaxSize(knobSize, knobSize);
        knob.setStyle(buildKnobStyle(color));
        StackPane.setAlignment(knob, Pos.BOTTOM_CENTER);
        StackPane.setMargin(knob, new Insets(0, 0, knobMarginBottom, 0));
        knobNodes.add(knob);

        pane.getChildren().addAll(track, fill, knob);
        return pane;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Style builders
    // ═══════════════════════════════════════════════════════════════════════

    private static String buildFillStyle(String color) {
        // color with ~50 % opacity (hex 80 = 128/255 ≈ 50 %)
        // Rounded bottom corners only
        return "-fx-background-color: " + hexWithAlpha(color, "80") + ";" +
               "-fx-background-radius: 0 0 99 99;";
    }

    private static String buildKnobStyle(String color) {
        return "-fx-background-radius: 99;" +
               "-fx-background-color: #1e1e2e;" +
               "-fx-border-radius: 99;" +
               "-fx-border-color: " + color + ";" +
               "-fx-border-width: 2;" +
               "-fx-effect: dropshadow(gaussian, " + hexWithAlpha(color, "99") + ", 6, 0.4, 0, 0);";
    }

    /**
     * Appends an 8-bit alpha component (2-char hex string) to a 6-digit hex color.
     * e.g. hexWithAlpha("#7c3aed", "80") → "#7c3aed80"
     */
    private static String hexWithAlpha(String hex, String alpha) {
        if (hex.startsWith("#") && hex.length() == 7) return hex + alpha;
        return hex; // fallback — return as-is if format is unexpected
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Selection / navigation
    // ═══════════════════════════════════════════════════════════════════════

    private void selectSlider(int idx) {
        selectedSlider = idx;
        SliderConfig s = cfg.getConfig().getSlider(idx);
        labelField.setText(s.getLabel());
        String ch = s.getChannel();
        if (ch != null && !ch.isEmpty() && !channelCombo.getItems().contains(ch)) {
            channelCombo.getItems().add(ch);
        }
        channelCombo.setValue(ch);
        detailPanel.setVisible(true);
        detailPanel.setManaged(true);
        refreshFadersRow();
    }

    private void closeDetail() {
        selectedSlider = -1;
        detailPanel.setVisible(false);
        detailPanel.setManaged(false);
        refreshFadersRow();
    }

    private void saveSlider() {
        if (selectedSlider < 0) return;
        SliderConfig s = cfg.getConfig().getSlider(selectedSlider);
        s.setLabel(labelField.getText().trim());
        String ch = channelCombo.getEditor().getText().trim();
        if (ch.isEmpty()) ch = "master";
        s.setChannel(ch);
        cfg.save();
        closeDetail();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Detail panel
    // ═══════════════════════════════════════════════════════════════════════

    private VBox buildDetailPanel() {
        VBox panel = new VBox(14);
        panel.getStyleClass().addAll("card", "detail-panel");

        Label title = new Label("Configuration du potentiomètre");
        title.getStyleClass().add("detail-title");
        Button closeBtn = new Button("×");
        closeBtn.getStyleClass().add("close-btn");
        closeBtn.setOnAction(e -> closeDetail());
        Region sp = new Region();
        HBox.setHgrow(sp, Priority.ALWAYS);
        HBox hdr = new HBox(title, sp, closeBtn);
        hdr.setAlignment(Pos.CENTER_LEFT);

        Label lblLbl = new Label("Étiquette");
        lblLbl.getStyleClass().add("form-label");
        labelField = new TextField();
        labelField.setPromptText("Master, Musique, Discord...");
        labelField.getStyleClass().add("text-field");

        Label chLbl = new Label("Canal audio (appli ou master / mic / system)");
        chLbl.getStyleClass().add("form-label");

        channelCombo = new ComboBox<>();
        channelCombo.setEditable(true);
        channelCombo.getItems().addAll("master", "mic", "system");
        channelCombo.setValue("master");
        channelCombo.setMaxWidth(Double.MAX_VALUE);
        channelCombo.setPromptText("master, discord.exe, spotify.exe…");

        detectBtn = new Button("🔄 Détecter les applis actives");
        detectBtn.getStyleClass().addAll("btn");
        detectBtn.setMaxWidth(Double.MAX_VALUE);
        detectBtn.setOnAction(e -> detectAudioSessions());

        Button saveBtn = new Button("Enregistrer");
        Button cancelBtn = new Button("Annuler");
        saveBtn.getStyleClass().addAll("btn", "btn-primary");
        cancelBtn.getStyleClass().add("btn");
        saveBtn.setOnAction(e -> saveSlider());
        cancelBtn.setOnAction(e -> closeDetail());
        HBox btnRow = new HBox(10, saveBtn, cancelBtn);

        panel.getChildren().addAll(
                hdr,
                vfield(lblLbl, labelField),
                vfield(chLbl, channelCombo),
                detectBtn,
                btnRow
        );
        return panel;
    }

    private void detectAudioSessions() {
        detectBtn.setText("⏳ Détection…");
        detectBtn.setDisable(true);
        WindowsVolumeService.getInstance().getActiveAudioSessions().thenAccept(sessions -> {
            Platform.runLater(() -> {
                String current = channelCombo.getEditor().getText().trim();
                channelCombo.getItems().setAll(sessions);
                if (!current.isEmpty() && !sessions.contains(current)) {
                    channelCombo.getItems().add(current);
                }
                channelCombo.setValue(current.isEmpty() ? "master" : current);
                detectBtn.setText("🔄 Détecter les applis actives");
                detectBtn.setDisable(false);
                updateActivityDots(sessions);
            });
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private VBox vfield(Label l, javafx.scene.Node n) { return new VBox(5, l, n); }
}
