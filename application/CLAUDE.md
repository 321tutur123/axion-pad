# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Axion Pad Configurator v2.0.0 is a JavaFX desktop app for configuring the **Axion Pad** keyboard (RP2040 + CircuitPython). It supports three hardware models (MINI, STANDARD, XL) with dynamic UI, RGB LED control, OLED display management, and a REST API for third-party lighting tools (SignalRGB/OpenRGB).

**Stack:** Java 17, JavaFX 21, Maven, jSerialComm 2.11.0, Gson 2.10.1, JNA 5.13.0

## Build & Run Commands

```bash
# Run in development
mvn javafx:run

# Build fat JAR
mvn clean package

# Build Windows MSI installer (run from application/)
build-windows.bat
```

Output: `application/dist/AxionPad-2.0.0.msi`

There are no automated tests in this project.

## Architecture

MVC with a manual page-routing pattern. `MainWindow` owns a `StackPane` and calls `showPage(id)` to swap content nodes. Controllers build their UI tree programmatically in `buildView()` — there are no FXML files.

### Layer breakdown

| Layer | Package | Role |
|---|---|---|
| Entry | `Main` → `AxionPadApp` | Launches JavaFX; `stop()` + shutdown hook run `performCleanup()` |
| View | `view/` | `MainWindow` (root shell, nav, model badge), `PortDialog` (port picker) |
| Controllers | `controller/` | Build and manage individual pages |
| Services | `service/` | Serial I/O, config persistence, volume, RGB, OLED, REST API, hardware monitoring |
| Models | `model/` | `PadConfig`, `KeyConfig`, `SliderConfig`, `RgbConfig`, `DeviceModel` |

### Hardware models

`DeviceModel` enum drives all dynamic UI:

| Model | Keys | Pots | OLED | RGB |
|---|---|---|---|---|
| MINI | 6 (2×3) | 0 | No | No |
| STANDARD | 12 (3×4) | 4 | No | Yes |
| XL | 16 (4×4) | 6 | Yes | Yes |

Auto-detected from firmware greeting: `"AXIONPAD:MINI"`, `"AXIONPAD:STANDARD"`, `"AXIONPAD:XL"`.

### Key data flows

**Serial → Volume:**
`SerialService.readLoop()` parses `"val1|val2|...\n"` → fires `onRawSliderValues` (background thread, no FX overhead) → `WindowsVolumeService` sets OS volume via WASAPI/JNA.

**Serial → UI:**
Same read loop → fires `onSliderValues` (FX thread, 20 fps throttle, change-detection) → `SoundbarController` updates level bars.

**Device detection:**
Firmware sends `"AXIONPAD:MODEL"` on connect → `SerialService` calls `DeviceModel.fromString()` → fires `onModelDetected` → `MainWindow` updates model badge, rebuilds affected pages, enables RGB nav item.

**RGB control:**
`RgbController` → `RgbService.applyConfig()` → serial command (`RGB:STATIC:r,g,b`) → NeoPixels.
`OpenRgbServer` (port 7742) accepts POST from SignalRGB/OpenRGB → same `RgbService` path.

**OLED display (XL only):**
`OledService` starts on connect, syncs RTC, sends CPU/RAM/time every 2 s: `"OLED[:CPU:75][:RAM:60][:HHMM:1430]..."`.

**Config persistence:**
`~/.axionpad/config.json`. `ConfigService` is a singleton; controllers call `ConfigService.getInstance().save()` after edits. `PadConfig` includes `RgbConfig` and multi-layer `List<Layer>` (up to 3 layers, up to 16 keys each).

**UI minimization:**
`primaryStage.showingProperty()` → `SerialService.setUiMinimized(bool)` → suspends FX callbacks + sends `POLL:LOW`/`POLL:HIGH` to firmware to reduce USB traffic.

### Controllers

- **`KeysController`** — dynamic key grid (size from `DeviceModel`); detail panel for `ActionType` (KEYBOARD / APP / MUTE / MEDIA / AHK), modifiers, key binding, app path
- **`SlidersController`** — dynamic channel count (0/4/6 from model); maps each to a process name; shows "no pots" message for MINI
- **`RgbController`** — effect selector (OFF/STATIC/BREATHING/WAVE), color pickers, speed/brightness; only available for STANDARD and XL
- **`SoundbarController`** — live `ProgressBar` visualization; rebuilt on every page visit
- **`ExportController`** — shows generated `code.py`; copy/save to file
- **`SimulatorController`** — software-only simulation
- **`PresetService`** — four built-in presets: Streaming, Gaming, Productivity, DAW

### Services

- **`SerialService`** — jSerialComm port management, auto-detection, model detection, watchdog (5 s timeout), POLL mode switching
- **`ConfigService`** — JSON persistence, backward-compatible migration from v1 12-key configs
- **`WindowsVolumeService`** — WASAPI/COM via JNA on dedicated STA thread, 20 Hz throttle
- **`RgbService`** — singleton, persists `RgbConfig`, auto-applies on connect
- **`OledService`** — RTC sync + periodic stats broadcast (XL only)
- **`OpenRgbServer`** — HTTP REST on `127.0.0.1:7742`, CORS enabled, async via thread pool
- **`HardwareMonitorService`** — CPU/RAM via MXBean; GPU/temp stubbed (requires OSHI/NVML)
- **`KeyHookService`** — global keyboard hook registration
- **`DebugLogger`** — logs to `%APPDATA%/AxionPad/debug.log`

### Firmwares

Three CircuitPython firmware variants in `firmwares/`:

```
firmwares/
├── MINI/code.py      # 6-key, no RGB, no OLED
├── STANDARD/code.py  # 12-key, 4 pots, RGB NeoPixels
└── XL/code.py        # 16-key, 6 pots, RGB, OLED SSD1306, RTC
```

A copy of the STANDARD firmware is also embedded in `src/main/resources/com/axionpad/firmware/code.py` for in-app export.

## Config File Format

`~/.axionpad/config.json` — JSON with `version`, `profileName`, `layers` (list of `{name, keys[]}`), `sliders[]`, and `rgb` (`{effect, color1, color2, brightness, speed}`). Backward-compatible: old `keys`/`layer2`/`layer3` fields are migrated on first load.

## UI Styling

All styling in `src/main/resources/com/axionpad/css/dark.css`. Single dark theme, no light mode.

## OpenRGB/SignalRGB REST API

`http://127.0.0.1:7742` — started automatically when app launches.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | `{"connected":true,"model":"STANDARD"}` |
| GET | `/devices` | Device list with LED count |
| POST | `/device/0/color` | Set static color `{"r":255,"g":0,"b":128}` |
| POST | `/device/0/effect` | Set effect `{"effect":"BREATHING","speed":80,"brightness":200}` |
