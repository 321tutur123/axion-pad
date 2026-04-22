# AXION PAD
**Configurateur RP2040 · CircuitPython**
*Documentation Technique & Guide de Débogage*
*Version 1.0 — Avril 2026*

---

## Table des matières
1. [Présentation du système](#1-présentation-du-système)
2. [Prérequis & Installation](#2-prérequis--installation)
3. [Architecture logicielle](#3-architecture-logicielle)
4. [Connexion série (port COM)](#4-connexion-série-port-com)
5. [Contrôle du volume (NirCmd)](#5-contrôle-du-volume-nircmd)
6. [Guide de débogage complet](#6-guide-de-débogage-complet)
7. [Codes d'erreur & solutions](#7-codes-derreur--solutions)
8. [FAQ](#8-faq)

---

## 1. Présentation du système
L'Axion Pad est un contrôleur physique USB basé sur un microcontrôleur RP2040 programmé en CircuitPython. Il se connecte à un PC via USB et communique avec le logiciel Axion Pad Configurator pour piloter le volume des applications Windows et envoyer des raccourcis clavier.

### Composants matériels

| Composant | Description |
| :--- | :--- |
| **Microcontrôleur** | RP2040 (Raspberry Pi Pico ou compatible) |
| **Firmware** | CircuitPython — exécute code.py au démarrage |
| **12 touches** | Boutons poussoirs — envoient F13 à F24 ou raccourcis configurés |
| **4 potentiomètres** | Envoi de valeurs 0–1023 via port série pour contrôle du volume |
| **Interface USB** | Apparaît comme port COM (CDC Serial) sous Windows |

### Flux de données
Le pad envoie en continu sur le port série les valeurs des 4 potentiomètres sous le format :
> `512|489|1023|0` (séparateur : `|` ou `,` ou `;`)

Le logiciel lit ces valeurs, les convertit en pourcentage (0–100%) et les transmet à NirCmd pour ajuster le volume des applications Windows correspondantes.

---

## 2. Prérequis & Installation

### Logiciels requis

| Logiciel | Version minimale | Rôle |
| :--- | :--- | :--- |
| **Java (JDK)** | 17 (Eclipse Adoptium) | Exécution du configurateur |
| **NirCmd** | 2.86+ | Contrôle du volume Windows |
| **CircuitPython** | 8.x ou 9.x | Firmware du pad |
| **Windows** | 10 ou 11 | Système d'exploitation |

### Installation de NirCmd (OBLIGATOIRE)

> **⚠ Attention** : NirCmd doit être installé sur CHAQUE PC utilisant l'Axion Pad. Sans lui, le contrôle du volume est non fonctionnel.

* Télécharger NirCmd depuis : `https://www.nirsoft.net/utils/nircmd.html` (version 64-bit).
* Extraire `nircmd.exe`.
* Copier `nircmd.exe` dans `C:\Windows\System32\`.
* Vérifier en PowerShell : `nircmd.exe setsysvolume 32767`.

Le volume master doit passer à 50% si NirCmd est correctement installé.

---

## 3. Architecture logicielle

### Structure des fichiers

| Fichier | Rôle |
| :--- | :--- |
| `Main.java` | Point d'entrée de l'application JavaFX |
| `view/MainWindow.java` | Fenêtre principale — titlebar, sidebar, routing des pages |
| `view/PortDialog.java` | Dialogue de sélection du port série COM |
| `service/SerialService.java` | Connexion et lecture série — thread dédié, callbacks |
| `service/VolumeService.java` | Appel NirCmd pour contrôle du volume par application |
| `service/ConfigService.java` | Lecture/écriture de la configuration JSON sur disque |
| `controller/KeysController.java` | Interface de configuration des 12 touches |
| `controller/SlidersController.java` | Interface de configuration des 4 potentiomètres |
| `controller/SoundbarController.java` | Affichage temps réel des niveaux de volume |
| `controller/SimulatorController.java` | Simulation du pad sans matériel physique |
| `resources/css/dark.css` | Thème visuel sombre de l'interface JavaFX |

---

## 4. Connexion série (port COM)

### Fonctionnement
L'Axion Pad apparaît sous Windows comme un port COM série (CDC). Le logiciel utilise la bibliothèque jSerialComm pour détecter et lire ce port. La détection automatique cherche les mots-clés suivants dans le nom du port :
* `circuitpython`, `rp2040`, `circuit`, `adafruit`, `usb serial`
* `usbmodem`, `cu.usbmodem`

Si aucun port correspondant n'est trouvé, le premier port COM disponible est présélectionné.

### Paramètres de connexion

| Paramètre | Valeur |
| :--- | :--- |
| **Baud rate** | 115200 |
| **Bits de données** | 8 |
| **Bits de stop** | 1 |
| **Parité** | Aucune |
| **Timeout lecture** | 2000 ms (semi-bloquant) |

---

## 5. Contrôle du volume (NirCmd)

### Principe
Chaque potentiomètre est associé à un "canal" (nom de processus Windows). Quand le pad envoie une valeur, le logiciel appelle NirCmd pour ajuster le volume de l'application correspondante.

### Canaux spéciaux

| Canal | Comportement |
| :--- | :--- |
| `master` | Volume master Windows (tous les sons) |
| `mic` / `default_record` | Volume du microphone / périphérique d'enregistrement par défaut |
| `discord.exe` | Volume de Discord spécifiquement |
| `spotify.exe` | Volume de Spotify spécifiquement |
| `system` | Sons système Windows |

### Limitation de débit
Pour éviter de surcharger NirCmd, les appels sont limités à 1 toutes les 100 ms (10 fois/seconde maximum), quelle que soit la fréquence d'envoi du pad.

---

## 6. Guide de débogage complet

### Problème : Le volume ne change pas

**Étape 1 — Vérifier NirCmd**
* Ouvrir PowerShell et taper :
    * `where.exe nircmd.exe`
* Si aucun résultat : NirCmd n'est pas installé. Voir section 2.
* Si trouvé, tester manuellement :
    * `nircmd.exe setsysvolume 32767`
* Le volume master doit passer à 50%. Sinon NirCmd est corrompu — le réinstaller.

**Étape 2 — Vérifier que le pad est bien connecté**
* Dans le logiciel, le bouton en haut à droite doit afficher "Axion Pad connecté".
* Si ce n'est pas le cas, cliquer sur "Connecter le pad" et sélectionner le bon port COM.

**Étape 3 — Vérifier le bon canal dans la configuration**
* Ouvrir l'onglet "Potentiomètres". Vérifier que le canal correspond bien au nom du processus de l'application cible. Exemples :
    * `discord.exe` — `spotify.exe` — `chrome.exe` — `master`

> **💡 Conseil** : Pour trouver le nom exact d'un processus : ouvrir le Gestionnaire des tâches > onglet Détails. Le nom affiché dans la colonne "Nom" est celui à utiliser.

### Problème : Le pad n'est pas détecté
**Vérifications à effectuer :**
* Débrancher et rebrancher le câble USB.
* Vérifier que le câble est bien un câble DATA (pas uniquement alimentation).
* Dans le Gestionnaire de périphériques Windows, vérifier qu'un port COM apparaît.
* Si le port apparaît avec un triangle jaune : installer les drivers CP210x ou CH340 selon la puce USB du pad.
* Réessayer en branchant sur un port USB directement sur la carte mère (pas un hub).

### Problème : L'application plante au démarrage
* Vérifier que Java 17 ou supérieur est installé :
    * `java -version`
* Si absent : télécharger Eclipse Adoptium JDK 17 sur `https://adoptium.net`.

### Problème : Une fenêtre NirCmd s'ouvre en boucle

> **⚠ Critique** : Ce problème indique que NirCmd reçoit des arguments incorrects. Forcer l'arrêt immédiatement avec ces commandes PowerShell :
> * `taskkill /F /IM nircmd.exe`
> * `taskkill /F /IM java.exe`

Puis réinstaller la dernière version du logiciel Axion Pad Configurator.

---

## 7. Codes d'erreur & solutions

| Message d'erreur | Solution |
| :--- | :--- |
| **Connexion impossible — Impossible d'ouvrir le port** | Le pad est débranché ou un autre logiciel utilise le port COM. Débrancher/rebrancher le pad. |
| **Erreur driver série — jSerialComm n'a pas pu charger** | Relancer le logiciel en tant qu'administrateur (clic droit > Exécuter en tant qu'administrateur). |
| **NirCmd introuvable** | Installer NirCmd et copier nircmd.exe dans C:\Windows\System32\. Voir section 2. |
| **Connexion perdue** | Le pad a été débranché pendant l'utilisation. Rebrancher et reconnecter via le bouton en haut à droite. |
| **Erreur lecture: null** | Timeout série. Vérifier le câble USB et réessayer. Un câble de mauvaise qualité peut causer des coupures. |
| **[Serial] Volume apply error** | NirCmd a retourné une erreur. Vérifier que le nom du processus dans la configuration est correct. |

---

## 8. FAQ

**Le pad fonctionne-t-il sur macOS / Linux ?**
Le matériel (RP2040 + CircuitPython) est compatible macOS et Linux. Cependant, `VolumeService.java` utilise NirCmd qui est exclusivement Windows. Sur macOS/Linux, le contrôle du volume nécessiterait une adaptation du code pour utiliser des outils natifs (AppleScript sur macOS, pactl sur Linux).

**Puis-je utiliser plusieurs pads simultanément ?**
Non, le logiciel ne gère qu'une seule connexion série à la fois. Pour supporter plusieurs pads, il faudrait modifier `SerialService` pour gérer plusieurs ports en parallèle.

**Comment réinitialiser la configuration ?**
Supprimer le fichier `AxionPad.cfg` situé dans le dossier du logiciel. Au prochain démarrage, une configuration par défaut sera recréée.

**Les touches F13–F24 ne font rien dans mon jeu ?**
Ces touches sont envoyées au système mais l'application cible doit les reconnaître. Pour les jeux, utiliser PowerToys Keyboard Manager ou AutoHotkey pour remapper F13–F24 vers des touches standard.

**Comment mettre à jour le firmware du pad ?**
* Brancher le pad en maintenant le bouton BOOTSEL enfoncé.
* Le pad apparaît comme un lecteur USB nommé `RPI-RP2`.
* Copier le nouveau fichier `code.py` (généré depuis l'onglet Export) à la racine du lecteur CIRCUITPY.
* Le pad redémarre automatiquement avec le nouveau firmware.

---
*Axion Pad Configurator — Document fourni avec le produit*
*Pour toute assistance, fournir ce document avec la description du problème rencontré.*
