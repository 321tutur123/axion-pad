package com.axionpad.controller;

import com.axionpad.model.DeviceModel;
import com.axionpad.model.RgbConfig;
import com.axionpad.service.ConfigService;
import com.axionpad.service.OpenRgbServer;
import com.axionpad.service.RgbService;
import com.axionpad.service.SerialService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;

/**
 * Page de configuration du moteur RGB.
 * Affiche les contrôles uniquement pour les modèles possédant des LEDs NeoPixel.
 */
public class RgbController {

    private final ConfigService cfg;
    private final RgbService    rgbService = RgbService.getInstance();

    public RgbController(ConfigService cfg) {
        this.cfg = cfg;
    }

    public Pane buildView() {
        VBox page = new VBox(20);
        page.getStyleClass().add("page-root");
        page.setPadding(new Insets(24));

        Label title = new Label("RGB Engine");
        title.getStyleClass().add("page-title");

        Label desc = new Label("Contrôle l'éclairage NeoPixel par canal LED. "
            + "Accessible aussi via API REST locale (SignalRGB / OpenRGB).");
        desc.getStyleClass().add("page-desc");
        desc.setWrapText(true);

        page.getChildren().addAll(title, desc);

        DeviceModel model = SerialService.getInstance().getDetectedModel();

        if (!model.hasRgb) {
            Label info = new Label(
                "RGB non disponible pour le modèle actuellement connecté ("
                + model.displayName + ").\n"
                + "Connectez un AxionPad Standard ou XL pour accéder aux contrôles LED.");
            info.setWrapText(true);
            info.setStyle("-fx-text-fill: rgba(255,255,255,0.45); -fx-font-size: 12px;");
            page.getChildren().add(info);
            page.getChildren().add(buildApiCard());
            return page;
        }

        RgbConfig config = cfg.getConfig().getRgb();
        page.getChildren().addAll(
            buildEffectCard(config),
            buildColorCard(config),
            buildSpeedCard(config),
            buildBrightnessCard(config),
            buildApplyButton(config),
            buildApiCard()
        );
        return page;
    }

    // ── Effect picker ─────────────────────────────────────────

    private VBox buildEffectCard(RgbConfig config) {
        VBox card = new VBox(10);
        card.getStyleClass().add("card");
        card.setPadding(new Insets(14));

        Label lbl = new Label("EFFET");
        lbl.getStyleClass().add("card-title");

        ToggleGroup tg = new ToggleGroup();
        HBox row = new HBox(8);
        row.setAlignment(Pos.CENTER_LEFT);

        for (RgbConfig.Effect e : RgbConfig.Effect.values()) {
            RadioButton rb = new RadioButton(e.label);
            rb.setToggleGroup(tg);
            rb.setUserData(e);
            rb.getStyleClass().add("btn");
            if (config.getEffect() == e) rb.setSelected(true);
            row.getChildren().add(rb);
        }
        tg.selectedToggleProperty().addListener((obs, ov, nv) -> {
            if (nv != null) config.setEffect((RgbConfig.Effect) nv.getUserData());
        });

        card.getChildren().addAll(lbl, row);
        return card;
    }

    // ── Color pickers ─────────────────────────────────────────

    private VBox buildColorCard(RgbConfig config) {
        VBox card = new VBox(10);
        card.getStyleClass().add("card");
        card.setPadding(new Insets(14));

        Label lbl1 = new Label("COULEUR PRIMAIRE");
        lbl1.getStyleClass().add("card-title");
        ColorPicker cp1 = new ColorPicker(toFx(config.getColor1()));
        cp1.getStyleClass().add("btn");
        cp1.valueProperty().addListener((o, ov, nv) -> config.setColor1(fromFx(nv)));

        Label lbl2 = new Label("COULEUR SECONDAIRE  (vague uniquement)");
        lbl2.getStyleClass().add("card-title");
        lbl2.setPadding(new Insets(6, 0, 0, 0));
        ColorPicker cp2 = new ColorPicker(toFx(config.getColor2()));
        cp2.getStyleClass().add("btn");
        cp2.valueProperty().addListener((o, ov, nv) -> config.setColor2(fromFx(nv)));

        card.getChildren().addAll(lbl1, cp1, lbl2, cp2);
        return card;
    }

    // ── Speed slider ──────────────────────────────────────────

    private VBox buildSpeedCard(RgbConfig config) {
        VBox card = new VBox(8);
        card.getStyleClass().add("card");
        card.setPadding(new Insets(14));

        Label lbl = new Label("VITESSE : " + config.getSpeed());
        lbl.getStyleClass().add("card-title");
        Slider slider = new Slider(0, 255, config.getSpeed());
        slider.setMajorTickUnit(64);
        slider.setBlockIncrement(8);
        slider.valueProperty().addListener((o, ov, nv) -> {
            int v = nv.intValue();
            config.setSpeed(v);
            lbl.setText("VITESSE : " + v);
        });

        card.getChildren().addAll(lbl, slider);
        return card;
    }

    // ── Brightness slider ─────────────────────────────────────

    private VBox buildBrightnessCard(RgbConfig config) {
        VBox card = new VBox(8);
        card.getStyleClass().add("card");
        card.setPadding(new Insets(14));

        Label lbl = new Label("LUMINOSITÉ : " + config.getBrightness());
        lbl.getStyleClass().add("card-title");
        Slider slider = new Slider(0, 255, config.getBrightness());
        slider.setMajorTickUnit(64);
        slider.setBlockIncrement(8);
        slider.valueProperty().addListener((o, ov, nv) -> {
            int v = nv.intValue();
            config.setBrightness(v);
            lbl.setText("LUMINOSITÉ : " + v);
        });

        card.getChildren().addAll(lbl, slider);
        return card;
    }

    // ── Apply button ──────────────────────────────────────────

    private HBox buildApplyButton(RgbConfig config) {
        Button btn = new Button("Appliquer les effets RGB");
        btn.getStyleClass().addAll("btn", "btn-primary");
        btn.setOnAction(e -> {
            cfg.save();
            rgbService.applyConfig();
        });
        HBox row = new HBox(btn);
        row.setAlignment(Pos.CENTER_LEFT);
        return row;
    }

    // ── API info card ─────────────────────────────────────────

    private VBox buildApiCard() {
        VBox card = new VBox(6);
        card.getStyleClass().add("card");
        card.setPadding(new Insets(12));
        card.setOpacity(0.75);

        Label hdr = new Label("API LOCALE SignalRGB / OpenRGB");
        hdr.getStyleClass().add("card-title");

        boolean running = OpenRgbServer.getInstance().isRunning();
        Label url = new Label("http://127.0.0.1:" + OpenRgbServer.PORT + "  —  "
            + (running ? "en ligne" : "hors ligne"));
        url.setStyle("-fx-text-fill: " + (running ? "#3dd68c" : "rgba(255,255,255,0.30)")
            + "; -fx-font-size: 11px; -fx-font-family: monospace;");

        Label hint = new Label("POST /device/0/effect  {\"effect\":\"BREATHING\",\"r\":124,\"g\":58,\"b\":237,\"speed\":80}");
        hint.setStyle("-fx-text-fill: rgba(255,255,255,0.28); -fx-font-size: 10px; -fx-font-family: monospace;");
        hint.setWrapText(true);

        card.getChildren().addAll(hdr, url, hint);
        return card;
    }

    // ── Color conversion ──────────────────────────────────────

    private Color toFx(int[] rgb) {
        if (rgb == null || rgb.length < 3) return Color.PURPLE;
        return Color.rgb(
            Math.max(0, Math.min(255, rgb[0])),
            Math.max(0, Math.min(255, rgb[1])),
            Math.max(0, Math.min(255, rgb[2])));
    }

    private int[] fromFx(Color c) {
        return new int[]{
            (int) (c.getRed()   * 255),
            (int) (c.getGreen() * 255),
            (int) (c.getBlue()  * 255)
        };
    }
}
