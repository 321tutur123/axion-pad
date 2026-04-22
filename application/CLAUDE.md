# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Axion Pad Configurator is a JavaFX desktop app for configuring the **Axion Pad** keyboard (RP2040 + CircuitPython). It lets users map keys and potentiometers, then exports generated `code.py` (CircuitPython) and `deej-config.yaml` to the device.

**Stack:** Java 17, JavaFX 21, Maven, jSerialComm 2.11.0, Gson 2.10.1

## Build & Run Commands

```bash
# Run in development
mvn javafx:run

# Build fat JAR
mvn clean package
```

**Native installers:**
```bash
# Windows (.exe) — run from project root
scripts\build-windows.bat

# macOS (.dmg) or Linux (.deb)
chmod +x scripts/build-unix.sh && ./scripts/build-unix.sh
```

Output goes to `dist/windows/`, `dist/macos/`, or `dist/linux/`.

There are no automated tests in this project.

## Architecture

The app follows MVC with a manual page-routing pattern. `MainWindow` owns a `StackPane` and calls `showPage(id)` to swap content nodes. Controllers build their UI tree programmatically in `buildView()` — there are no FXML files.

### Layer breakdown

| Layer | Package | Role |
|---|---|---|
| Entry | `Main` → `AxionPadApp` | Launches JavaFX; `stop()` disconnects serial and saves config |
| View | `view/` | `MainWindow` (root shell + nav), `PortDialog` (serial port picker) |
| Controllers | `controller/` | Build and manage individual pages |
| Services | `service/` | `ConfigService` (JSON persistence), `SerialService` (hardware I/O) |
| Models | `model/` | `PadConfig`, `KeyConfig`, `SliderConfig` — also contain code-generation logic |

### Key data flows

**Serial → UI:**  
`SerialService.readLoop()` (background thread) parses DEEJ format `"val1|val2|val3|val4\n"` → fires `onSliderValues` callback via `Platform.runLater()` → `SoundbarController` updates level bars.

**Config persistence:**  
Config lives at `~/.axionpad/config.json`. `ConfigService` is a singleton; controllers call `ConfigService.getInstance().save()` after edits.

**Code generation:**  
`PadConfig.generateCodePy()` and `generateDeejYaml()` produce strings from model state. `ExportController` displays these and `ConfigService.exportCodePy(File)` writes them to disk.

### Controllers

- **`KeysController`** — 4×3 grid of 12 keys; detail panel for `ActionType` (KEYBOARD / APP / MUTE / MEDIA), modifiers, key binding, app path, mute target
- **`SlidersController`** — 2×2 grid of 4 potentiometer channels; maps each to a DEEJ process name
- **`SoundbarController`** — Live `ProgressBar` visualization of serial values; rebuilt on every page visit (not cached)
- **`ExportController`** — Shows generated `code.py` and `deej-config.yaml`; copy/save to file
- **`SimulatorController`** — Software-only simulation with clickable buttons and draggable sliders
- **`PresetService`** — Static `apply(presetId, config)` with four built-in presets: Streaming, Gaming, Productivity, DAW

### Models & code generation

`KeyConfig` holds `ActionType`, modifiers, key name, app path, mute target, or media key. Its `toPythonLine()` emits one `KEY_MAP` entry.  
`SliderConfig` holds label and DEEJ channel (process name). `toPythonLine()` and `toYamlLine()` emit the relevant config lines.  
`PadConfig` assembles all lines into complete `code.py` and `deej-config.yaml` strings.

### Serial communication

`SerialService` uses jSerialComm (no native drivers needed). Auto-detection searches port descriptions for "CircuitPython", "RP2040", "Adafruit". Baud rate: 9600. Values are raw ADC integers 0–1023.

## Config File Format

`~/.axionpad/config.json` — JSON with `version`, `profileName`, `keys` (array of 12), and `sliders` (array of 4). Only one profile is supported; presets overwrite the current config.

## UI Styling

All styling is in `src/main/resources/com/axionpad/css/dark.css`. The app uses a single dark theme; there is no light mode.
