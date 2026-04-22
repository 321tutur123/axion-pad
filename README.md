# Axion Pad

**Audio & Macro Controller** — JavaFX configurator for the Axion Pad hardware (RP2040 + CircuitPython).  
Map 12 macro keys, control 4 audio faders, and export your config directly to the device.

---

## Download

**[→ Latest Release](https://github.com/321tutur123/axion-pad/releases/latest)** — Windows `.exe` installer

---

## Features

- **12 macro keys** — keyboard shortcuts, app launch, media controls, mute targets
- **4 audio faders** — per-process volume via DEEJ protocol
- **Live soundbar** — real-time ADC visualization
- **Presets** — Streaming, Gaming, Productivity, DAW, Soundboard
- **Auto-connect** — detects RP2040 / CircuitPython device on startup
- **System tray** — runs silently, launches with Windows
- **Code export** — generates `code.py` (CircuitPython) and `deej-config.yaml`

---

## Project Structure

```
axion-pad/
├── application/          Java/JavaFX configurator (Maven)
│   ├── src/
│   ├── pom.xml
│   └── scripts/          Native installer scripts (Windows / macOS / Linux)
├── website/              Static landing page → Cloudflare Pages
│   └── index.html
├── assets/
│   └── logos/            Brand assets (SVG, PNG, PDF)
├── hardware/             PCB schematics & CircuitPython firmware
└── .github/
    └── workflows/
        └── deploy.yml    Auto-deploy website to Cloudflare Pages
```

---

## Development

### Prerequisites

- Java 17+
- Maven 3.8+

### Run

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

The landing page is a zero-dependency static HTML/CSS/JS file in `website/`.

**Auto-deploy** is configured via GitHub Actions: every push to `main` that touches `website/**` triggers a Cloudflare Pages deployment.

### Manual deploy

```bash
npx wrangler pages deploy website --project-name axion-pad
```

### Required secrets (GitHub → Settings → Secrets)

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with *Cloudflare Pages: Edit* permission |
| `CLOUDFLARE_ACCOUNT_ID` | Found in Cloudflare dashboard → right sidebar |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop app | Java 17, JavaFX 21, Maven |
| Serial I/O | jSerialComm 2.11.0 |
| Native hooks | JNA 5.13.0 |
| Firmware | CircuitPython, RP2040 |
| Website | HTML / CSS / Vanilla JS |
| Hosting | Cloudflare Pages |
| CI/CD | GitHub Actions |

Thanks for reading
---

## License

MIT — see [LICENSE](LICENSE)
