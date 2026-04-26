# AxionPad

**The macro pad built for creators, streamers, and power users.**  
Map macros, control audio, and fine-tune every detail — all from one device.

→ **[axionpad.fr](https://axionpad.fr)**

---

## The Product

AxionPad is a compact, programmable macro pad powered by an RP2040 microcontroller. It comes in three versions to match every setup:

| Model | Keys | Faders | RGB | OLED |
|---|---|---|---|---|
| **Mini** | 6 | — | Optional | — |
| **Standard** | 12 | 4 | Optional | — |
| **XL** | 12 | 6 | Optional | Yes|

All models ship with the **AxionPad Native** configurator for Windows.

---

## AxionPad Native — Configurator App

The desktop companion app lets you configure every key and fader without touching any code. Changes are pushed directly to the device over USB.

**Download:** [Latest Release](https://github.com/321tutur123/axion-pad/releases/latest) — Windows `.exe` installer

### Key features

- **Macro keys** — keyboard shortcuts, app launch, media controls, mute targets, AutoHotkey scripts
- **Audio faders** — per-process volume control via WASAPI (no virtual audio drivers needed)
- **RGB control** — per-key color and lighting effects
- **OLED display** (XL only) — live system stats or custom text
- **Presets** — Streaming, Gaming, Productivity, DAW — switch in one click
- **Live soundbar** — real-time visualization of fader values
- **System tray** — runs silently in the background, auto-starts with Windows
- **Direct flash** — exports `code.py` and writes it straight to the device's `CIRCUITPY` drive

---

## Repository Structure

```
axion-pad/
├── application/      Java/JavaFX configurator (Maven)
├── firmwares/
│   ├── MINI/         CircuitPython firmware — Mini
│   ├── STANDARD/     CircuitPython firmware — Standard
│   └── XL/           CircuitPython firmware — XL
├── hardware/
│   ├── pcb/          PCB schematics
│   └── cad/          3D models (STL / OBJ)
├── website/          Next.js landing page → axionpad.fr (Cloudflare Pages)
└── assets/           Brand assets (logos, photos)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Microcontroller | RP2040 + CircuitPython |
| Desktop app | Java 17, JavaFX 21, Maven |
| Serial I/O | jSerialComm |
| Windows audio | WASAPI via JNA |
| Website | Next.js 15, Tailwind CSS |
| Hosting | Cloudflare Pages |
| CI/CD | GitHub Actions |

---

## Building from Source

### Prerequisites

- Java 17+
- Maven 3.8+

### Run in dev mode

```bash
cd application
mvn javafx:run
```

### Build Windows installer

```bash
cd application
scripts\build-windows.bat
# Output: dist/windows/AxionPadConfigurator.exe
```

---

## Website — Cloudflare Pages

Every push to `main` that touches `website/**` triggers an automatic deployment via GitHub Actions.

### Required secrets

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with *Cloudflare Pages: Edit* permission |
| `CLOUDFLARE_ACCOUNT_ID` | Found in the Cloudflare dashboard sidebar |

---

## License

The configurator source code is released under the **MIT License**.  
The AxionPad name, logo, and hardware designs are proprietary — all rights reserved.
