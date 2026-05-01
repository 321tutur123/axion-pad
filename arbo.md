# Arborescence du projet AxionPad

> Projet : macro pad programmable (RP2040 + CircuitPython) avec configurateur JavaFX et site e-commerce Next.js.

---

## Racine du projet

| Fichier | Rôle |
|---|---|
| `README.md` | Documentation principale : présentation du produit, versions (Mini/Standard/XL), stack technique, instructions de build |
| `.gitignore` | Fichiers et dossiers exclus du suivi Git |
| `RECAP_PROJET.txt` | Résumé global du projet |

## Maintenance updates for version 2.0.2:

### Key Simulation Fix (KeyHookService.java)
- Replaced Java Robot key simulation with native Windows SendInput API
- More reliable keypress simulation on Windows
- Fixed issue where physical key presses weren't triggering actions

### Mute Function Bug (WindowsVolumeService.java)
- Added explicit .exe suffix handling for process targets
- Added special case for Discord which needs full executable name
- Improved mute toggle reliability

### Media UI Cleanup (KeysController.java)
- Removed "VOLUME_INCREMENT" and "VOLUME_DECREMENT" options
- Volume control should be handled via sliders, not media keys

### Build Updates
- Version incremented to 2.0.2 in pom.xml
| `arbo.md` | Ce fichier — cartographie complète de l'arborescence |
| `axion-pad.*.log` | Log d'exécution de l'application (généré automatiquement) |
| `.aider.chat.history.md` | Historique de conversations avec l'IA Aider |
| `.aider.input.history` | Historique des commandes Aider |

---

## `.claude/` — Configuration Claude Code

| Fichier | Rôle |
|---|---|
| `settings.json` | Paramètres globaux Claude Code : serveur MCP filesystem, liste blanche de commandes (npm, git, bash) |
| `settings.local.json` | Surcharges locales non versionnées des paramètres Claude |

---

## `.github/workflows/` — CI/CD GitHub Actions

| Fichier | Rôle |
|---|---|
| `deploy.yml` | Pipeline de déploiement du site sur Cloudflare Pages (déclenché sur push dans `website/`, Node 22, `npm run pages:build`, wrangler-action) |
| `java-ci.yml` | Pipeline CI Java : compile et exécute les tests Maven (`mvn -B -q test`) sur Java 17 à chaque push/PR touchant `application/` |

---

## `application/` — Configurateur desktop JavaFX

Application de bureau Windows (Java 17 + JavaFX 21) qui permet de configurer le macro pad via USB série.

### Fichiers de build & config

| Fichier | Rôle |
|---|---|
| `pom.xml` | Fichier Maven : dépendances (JavaFX 21, jSerialComm, Gson, JNA), configuration du plugin jpackage pour générer le MSI |
| `build-windows.bat` | Script batch pour builder l'installeur MSI Windows |
| `build-unix.sh` | Script shell équivalent pour Linux/macOS |
| `icon.ico` | Icône de l'application |
| `CLAUDE.md` | Guide d'architecture interne pour Claude Code (pattern MVC, modèles matériels, flux de données) |
| `README.md` | Documentation technique détaillée : prérequis, connexion série, contrôle du volume, codes d'erreur, FAQ |
| `.claude/settings.local.json` | Surcharges Claude Code locales au sous-projet |

### `src/main/java/com/axionpad/` — Code source Java

#### Point d'entrée

| Fichier | Rôle |
|---|---|
| `Main.java` | Point d'entrée JVM ; initialise le logging vers `C:\temp\axionpad_debug.log` |
| `AxionPadApp.java` | Sous-classe `javafx.application.Application` ; démarre la fenêtre principale |
| `StartupRegistryHelper.java` | Interagit avec le registre Windows pour activer/désactiver le démarrage automatique au boot |

#### `view/` — Couche Vue (UI)

| Fichier | Rôle |
|---|---|
| `MainWindow.java` | Fenêtre racine : StackPane avec routing de navigation, sidebar, badge du modèle détecté |
| `PortDialog.java` | Dialogue de sélection du port série USB |

#### `controller/` — Couche Contrôleur (gestion des pages)

| Fichier | Rôle |
|---|---|
| `Controllers.java` | Registre central de tous les contrôleurs |
| `KeysController.java` | Grille de touches (6/12/16 selon le modèle) ; panneau de configuration par touche (ActionType : KEYBOARD, APP, MUTE, MEDIA, AHK) ; UI des modificateurs et raccourcis |
| `SlidersController.java` | Mapping des potentiomètres (0/4/6 canaux selon le modèle) ; noms des processus pour le contrôle du volume par application |
| `SoundbarController.java` | Visualisation en temps réel des niveaux sonores via `ProgressBar` |
| `RgbController.java` | Contrôle des LEDs RGB (effets : OFF/STATIC/BREATHING/WAVE, color pickers, vitesse, luminosité) — Standard/XL uniquement |
| `ExportController.java` | Affiche le code `code.py` généré pour le firmware ; fonctions copier/enregistrer |
| `SimulatorController.java` | Simulateur logiciel du périphérique (sans matériel réel) |
| `SettingsController.java` | Panneau des préférences de l'application |
| `PresetService.java` | Gestionnaire de presets intégrés (Streaming, Gaming, Productivité, MAO) |

#### `model/` — Couche Modèle (données)

| Fichier | Rôle |
|---|---|
| `DeviceModel.java` | Enum des modèles matériels : MINI (6 touches), STANDARD (12 touches + 4 pots), XL (16 touches + 6 pots + OLED). Auto-détecté depuis le greeting firmware |
| `KeyConfig.java` | Configuration d'une touche individuelle : ActionType, modificateurs, code touche, chemin d'application |
| `SliderConfig.java` | Configuration d'un canal potentiomètre : nom du processus, plage de volume |
| `RgbConfig.java` | Paramètres RGB : type d'effet, couleur1, couleur2, luminosité, vitesse |
| `PadConfig.java` | Configuration complète du pad : nom de profil, liste de layers, tableau sliders, config RGB. Rétrocompatible v1 |
| `AppSettings.java` | Paramètres applicatifs (démarrage auto, langue, etc.) |

#### `service/` — Couche Service (logique métier & matériel)

| Fichier | Rôle |
|---|---|
| `SerialService.java` | Gestion du port série via jSerialComm : auto-détection, détection du modèle depuis le greeting firmware, watchdog 5 s, basculement mode POLL selon minimisation de l'UI |
| `ConfigService.java` | Persistance JSON dans `~/.axionpad/config.json` ; migration rétrocompatible depuis la v1 |
| `WindowsVolumeService.java` | Contrôle audio WASAPI/COM via JNA sur thread STA dédié ; throttle à 20 Hz ; volume par application |
| `RgbService.java` | Persistance des effets LED et génération des commandes série (format `RGB:STATIC:r,g,b`) |
| `OledService.java` | Gestion de l'afficheur OLED du modèle XL : synchronisation RTC + stats périodiques CPU/RAM/heure toutes les 2 s |
| `OpenRgbServer.java` | Serveur HTTP REST sur `127.0.0.1:7742` pour l'intégration SignalRGB/OpenRGB ; CORS activé ; pool de threads asynchrone |
| `KeyHookService.java` | Enregistrement du hook clavier global Windows (capture bas niveau des touches) |
| `HardwareMonitorService.java` | Stats CPU/RAM via MXBean ; GPU/température stubés (nécessite OSHI/NVML) |
| `InventoryService.java` | Suivi de l'inventaire matériel |
| `AppLauncherService.java` | Lancement d'exécutables applicatifs |
| `SettingsService.java` | Persistance et récupération des paramètres |
| `I18n.java` | Chaînes d'internationalisation/localisation |
| `DebugLogger.java` | Logging vers `%APPDATA%/AxionPad/debug.log` |

### `src/main/resources/com/axionpad/`

| Chemin | Rôle |
|---|---|
| `css/dark.css` | Feuille de style unique — thème sombre de l'application |
| `firmware/code.py` | Copie embarquée du firmware STANDARD pour l'export in-app |
| `icons/axionpad_tray.png` | Icône de la barre système (tray) |
| `icons/icon.ico` | Icône de fenêtre |
| `icons/logo1.png` | Logo de l'application |

### `src/test/java/com/axionpad/model/` — Tests unitaires

| Fichier | Rôle |
|---|---|
| `DeviceModelTest.java` | Tests du modèle matériel (enum DeviceModel) |
| `PadConfigTest.java` | Tests de l'objet de configuration (sérialisation, migration v1→v2) |
| `SliderConfigTest.java` | Tests de la configuration des potentiomètres |

### `dist/` — Installeurs distribués

| Fichier | Rôle |
|---|---|
| `AxionPad-2.0.1.msi` | Installeur MSI version actuelle |
| `AxionPad-2.0.0.msi` | Version précédente |
| `AxionPad-1.0.1.msi` | Version legacy |
| `AxionPad-1.0.msi` | Version originale |

---

## `firmwares/` — Firmware CircuitPython (3 variantes)

Chaque variante émet un greeting `AXIONPAD:[MODELE]` au démarrage pour l'auto-détection par le configurateur.

| Fichier | Rôle |
|---|---|
| `MINI/code.py` | Firmware 6 touches (2×3), sans RGB ni OLED |
| `STANDARD/code.py` | Firmware 12 touches (3×4), 4 potentiomètres, LEDs RGB NeoPixel |
| `XL/code.py` | Firmware 16 touches (4×4), 6 potentiomètres, RGB NeoPixel, écran OLED SSD1306, module RTC |

**Protocole série :**
- Sortie : `"val1|val2|val3|val4\n"` pour les valeurs des sliders
- Entrée : `RGB:STATIC:r,g,b` · `POLL:LOW/HIGH` · `OLED[:CPU:XX][:RAM:XX][:HHMM:XXXX]`

---

## `hardware/` — Fichiers de conception matérielle

### `hardware/cad/body/` — Boîtier

| Fichier | Rôle |
|---|---|
| `Body_certo.SLDPRT` / `.STL` | Corps principal du boîtier (SolidWorks + export STL pour impression 3D) |
| `Top_Case_.SLDPRT` / `.STL` | Couvercle supérieur |
| `body axion v5.f3z` | Boîtier version 5 (Fusion 360) |
| `body axion v4.3.3mf` / `body axion.3mf` | Boîtier en format 3MF (impression 3D) |
| `v_perso axion.3mf` | Variante personnalisée |
| `alignement des touches v*.stl` | Gabarits d'alignement des touches (v1 et v2) |
| `dessus slider.stl` | Dessus du slider |
| `tentative bras.stl` | Tentative de conception d'un bras de maintien |

### `hardware/cad/components/` — Modèles de composants

| Fichier | Rôle |
|---|---|
| `cherry_mx_switch.step` | Modèle 3D d'un switch Cherry MX |
| `cherry_mx_keycap.*` | Keycap Cherry MX (STL + OBJ) |
| `fader_knob.*` | Bouton de fader (STL + OBJ) |
| `knob.*` | Bouton rotatif (STEP + 3MF) |
| `screw_chc_m3_l14.*` | Vis CHC M3 L14 (STEP + OBJ + MTL) |

### `hardware/cad/exports/` — Assemblages exportés

| Dossier | Rôle |
|---|---|
| `assembly_2026-03-27/` | Export d'assemblage PCB + composants (format OBJ/MTL, mars 2026) |
| `assembly_2026-04-21/` | Export complet récent (avril 2026) : PCB, corps, fond, couvercle, switches |

### `hardware/pcb/` — PCB

| Fichier | Rôle |
|---|---|
| `axion_v1_pcb.step` / `.stp` | Modèle 3D du PCB (dernière révision) |
| `gerber.zip` | Fichiers Gerber pour la fabrication du PCB |

### `hardware/mcu/microcontrolleur/` — Microcontrôleur

| Fichier | Rôle |
|---|---|
| `BOM_AS2040.xlsx` | Liste des composants (Bill of Materials) pour l'AS2040 (alternative RP2040) |
| `PickAndPlace_PCB_AS2040-copy_2026-02-25.csv` | Coordonnées de placement pour l'assemblage automatique |
| `as2040.json` | Spécifications du composant |

### `hardware/obj/` — Exports 3D PCB

| Fichier | Rôle |
|---|---|
| `OBJ_PCB_AXION_V1_PCB_2.obj` / `.mtl` | Modèle 3D du PCB en format OBJ avec matériaux |

### `hardware/top/` — Plaque supérieure

| Fichier | Rôle |
|---|---|
| `pieces/Grand Jaiks-Jarv/` | Variante de design de plaque supérieure |
| `pieces/ImageToStl.com_tinker.zip` | Conversion image vers STL |
| `pieces/top.zip` | Design consolidé de la plaque supérieure |

---

## `website/` — Site e-commerce Next.js (axionpad.fr)

### Fichiers de config & build

| Fichier | Rôle |
|---|---|
| `package.json` | Dépendances npm : Next.js 15.5, React 19, TypeScript, GSAP, Three.js, React Three Fiber, Zustand, Stripe, Tailwind CSS |
| `package-lock.json` | Versions exactes verrouillées des dépendances |
| `next.config.ts` | Configuration Next.js (output, redirects, etc.) |
| `tsconfig.json` | Configuration TypeScript |
| `postcss.config.mjs` | PostCSS pour Tailwind CSS |
| `eslint.config.mjs` | Règles ESLint |
| `.env.local` | Variables d'environnement locales (clés Stripe, D1, secrets — non versionné) |
| `wrangler.toml` | Configuration Cloudflare Workers/Pages (binding D1, nom du projet) |
| `.vercel/project.json` | Métadonnées Vercel (legacy, migration vers Cloudflare Pages effectuée) |
| `CLAUDE.md` | Redirige vers `AGENTS.md` |
| `AGENTS.md` | Avertissements sur les différences de version Next.js et les breaking changes |

### `migrations/` — Schémas base de données Cloudflare D1

| Fichier | Rôle |
|---|---|
| `0001_orders.sql` | Schéma de la table des commandes |
| `0002_reviews.sql` | Schéma de la table des avis produits |
| `0003_add_tracking.sql` | Ajout du suivi de commande |
| `0004_idempotency.sql` | Clés d'idempotence pour éviter les doublons de paiement |

### `public/` — Assets statiques

| Fichier | Rôle |
|---|---|
| `models/axionpad.glb` | Modèle 3D du produit en glTF binaire (utilisé dans le viewer 3D du site) |
| `images/products/` | Dossier des photos produits (placeholder `.gitkeep`) |
| `*.svg` | Icônes SVG génériques (file, globe, window, next, vercel) |

### `src/app/` — Pages & routes Next.js (App Router)

| Fichier/Dossier | Rôle |
|---|---|
| `page.tsx` | Page d'accueil : scène 3D avec scroll storytelling (300vh), animations GSAP ScrollTrigger |
| `layout.tsx` | Layout racine : providers, police, métadonnées globales |
| `globals.css` | Styles CSS globaux |
| `favicon.ico` | Favicon du site |
| `shop/page.tsx` | Page liste des produits |
| `shop/[slug]/page.tsx` | Page détail produit dynamique avec viewer 3D |
| `shop/[slug]/ProductConfigurator.tsx` | Composant configurateur interactif du produit |
| `login/page.tsx` | Page de connexion utilisateur |
| `register/page.tsx` | Page d'inscription |
| `cart/page.tsx` | Page panier |
| `checkout/page.tsx` | Formulaire de paiement |
| `success/page.tsx` | Page de confirmation de commande |
| `track/page.tsx` | Suivi de commande |
| `about/page.tsx` | Page à propos |
| `software/page.tsx` | Page du logiciel configurateur |
| `cgv/page.tsx` | Conditions Générales de Vente |
| `confidentialite/page.tsx` | Politique de confidentialité |
| `mentions-legales/page.tsx` | Mentions légales |
| `components/[slug]/page.tsx` | Page de présentation dynamique d'un composant matériel |

### `src/app/api/` — Routes API Next.js

| Route | Rôle |
|---|---|
| `auth/login/route.ts` | Endpoint de connexion utilisateur |
| `auth/register/route.ts` | Endpoint d'inscription utilisateur |
| `admin/login/route.ts` | Authentification admin |
| `admin/orders/route.ts` | Liste et gestion des commandes (admin) |
| `admin/orders/[id]/route.ts` | Détail et mise à jour d'une commande individuelle |
| `checkout/route.ts` | Création d'une session Stripe Checkout |
| `reviews/route.ts` | Soumission et récupération des avis produits |
| `track/route.ts` | API de suivi de commande |
| `webhook/route.ts` | Gestionnaire de webhooks Stripe (événements de paiement) |

### `src/components/` — Composants React réutilisables

| Fichier | Rôle |
|---|---|
| `3d/Scene.tsx` | Setup de la scène Three.js de base |
| `3d/HeroScene.tsx` | Scène 3D de la section hero |
| `3d/ScrollScene.tsx` | Scène 3D pilotée par le scroll |
| `3d/ProductModel.tsx` | Viewer 3D du produit (chargement du fichier `.glb`) |
| `3d/FloatingParticles.tsx` | Effet de particules flottantes |
| `3d/ModelErrorBoundary.tsx` | Error boundary pour les erreurs de rendu 3D |
| `layout/Navbar.tsx` | Barre de navigation : icône panier, liens auth |
| `layout/Footer.tsx` | Pied de page |
| `CheckoutButton.tsx` | Bouton de paiement Stripe |
| `ProductImage.tsx` | Image produit avec fallback |
| `ReviewSection.tsx` | Section d'affichage des avis clients |
| `animations/ScrollReveal.tsx` | Animations d'apparition au scroll |

### `src/data/`, `src/types/`, `src/hooks/`, `src/lib/`, `src/store/`

| Fichier | Rôle |
|---|---|
| `data/products.json` | Catalogue produits (noms, descriptions, prix, modèles) |
| `types/index.ts` | Définitions des types TypeScript partagés |
| `env.d.ts` | Types des variables d'environnement |
| `hooks/useScrollAnimation.ts` | Hook personnalisé pour les animations basées sur le scroll |
| `lib/gsap.ts` | Wrapper GSAP et initialisation de ScrollTrigger |
| `lib/three.ts` | Utilitaires Three.js |
| `lib/scrollProgress.ts` | Tracking de la progression du scroll |
| `lib/products-data.ts` | Utilitaires de données produits |
| `lib/components-data.ts` | Données des composants matériels présentés sur le site |
| `lib/api.ts` | Client API (fetch helpers) |
| `lib/user-auth.ts` | Utilitaires d'authentification utilisateur |
| `lib/admin-auth.ts` | Utilitaires d'authentification admin |
| `store/cart.ts` | Store Zustand du panier : add / remove / clear |

---

## `assets/` — Assets de marque & marketing

### `assets/logos/`

| Fichier | Rôle |
|---|---|
| `colored-logo.png/svg/pdf` | Logo AxionPad coloré (3 formats) |
| `transparent-logo.png/svg/pdf` | Logo avec fond transparent (3 formats) |
| `logo.png`, `logo1.png`, `logo2.png` | Variantes du logo |
| `Vista Logos.zip` | Pack de logos Vista |

### `assets/photos/`

| Fichier | Rôle |
|---|---|
| `vue dessus.png` | Photo du produit vue de dessus |
| `vue du coté.png` | Photo vue de côté |
| `derriere.jpg` | Photo vue de derrière |
| `image large.jpg` | Grande photo produit (marketing) |

---

## `_deprecated_root/` — Ancienne version du site (archivé)

Contient l'itération précédente du site web avant la migration vers `/website/`. Même structure que le site actuel mais **ne plus maintenée**. Conservé uniquement pour référence historique. Inclut `frontend/node_modules/` (~8000+ fichiers) et les artefacts de build `.next/`.

---

## Stack technologique résumée

| Couche | Technologie |
|---|---|
| Firmware | CircuitPython (RP2040) |
| Configurateur desktop | Java 17, JavaFX 21, Maven, jSerialComm, JNA, Gson |
| Site web | Next.js 15, React 19, TypeScript, Tailwind CSS |
| 3D web | Three.js, React Three Fiber, GSAP |
| État global web | Zustand |
| Paiement | Stripe |
| Base de données | Cloudflare D1 (SQLite) |
| Hébergement | Cloudflare Pages |
| CI/CD | GitHub Actions |
| Conception matérielle | SolidWorks, Fusion 360, KiCad (Gerber) |
