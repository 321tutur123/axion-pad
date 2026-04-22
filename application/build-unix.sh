#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Axion Pad Configurator — Script de build macOS / Linux
#  Génère : .dmg (macOS) ou .deb/.rpm (Linux)
#  Pré-requis : Java 17+, Maven 3.6+
# ═══════════════════════════════════════════════════════════

set -e

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Axion Pad Configurator — Build     ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

OS="$(uname -s)"

# Vérification Java 17+
JAVA_VER=$(java -version 2>&1 | head -1 | sed 's/.*version "\([0-9]*\).*/\1/')
if [ "$JAVA_VER" -lt 17 ] 2>/dev/null; then
    echo "[ERREUR] Java 17 ou supérieur est requis (trouvé: $JAVA_VER)"
    echo "Télécharge Java 17 sur : https://adoptium.net/"
    exit 1
fi

# Vérification Maven
if ! command -v mvn &> /dev/null; then
    echo "[ERREUR] Maven n'est pas installé."
    echo "Installe Maven : brew install maven  (macOS) ou apt install maven  (Ubuntu)"
    exit 1
fi

echo "[1/3] Compilation Maven..."
mvn clean package -q

echo "[2/3] Création du package natif avec jpackage..."

if [ "$OS" = "Darwin" ]; then
    # macOS → .dmg
    mkdir -p dist/macos
    jpackage \
        --input target \
        --name "Axion Pad Configurator" \
        --main-jar axionpad-1.0.0.jar \
        --main-class com.axionpad.Main \
        --type dmg \
        --dest dist/macos \
        --app-version 1.0.0 \
        --vendor "Axion Pad" \
        --description "Configurateur officiel pour le clavier Axion Pad" \
        --icon src/main/resources/com/axionpad/icons/axionpad.icns \
        --java-options "--add-modules javafx.controls,javafx.fxml,javafx.graphics" \
        || {
            echo "[INFO] jpackage a échoué, création d'un JAR exécutable..."
            mkdir -p dist/macos
            cp target/axionpad-1.0.0.jar dist/macos/AxionPadConfigurator.jar
            cat > dist/macos/launch.sh << 'EOF'
#!/bin/bash
java -jar "$(dirname "$0")/AxionPadConfigurator.jar"
EOF
            chmod +x dist/macos/launch.sh
        }
    echo "[OK] Package macOS dans dist/macos/"

elif [ "$OS" = "Linux" ]; then
    # Linux → .deb
    mkdir -p dist/linux
    jpackage \
        --input target \
        --name "axionpad-configurator" \
        --main-jar axionpad-1.0.0.jar \
        --main-class com.axionpad.Main \
        --type deb \
        --dest dist/linux \
        --app-version 1.0.0 \
        --vendor "Axion Pad" \
        --description "Configurateur officiel pour le clavier Axion Pad" \
        --icon src/main/resources/com/axionpad/icons/axionpad.png \
        --linux-shortcut \
        --java-options "--add-modules javafx.controls,javafx.fxml,javafx.graphics" \
        || {
            echo "[INFO] jpackage a échoué, création d'un JAR exécutable..."
            mkdir -p dist/linux
            cp target/axionpad-1.0.0.jar dist/linux/AxionPadConfigurator.jar
            cat > dist/linux/launch.sh << 'EOF'
#!/bin/bash
java -jar "$(dirname "$0")/AxionPadConfigurator.jar"
EOF
            chmod +x dist/linux/launch.sh
        }
    echo "[OK] Package Linux dans dist/linux/"
fi

echo ""
echo "  ════════════════════════════════════════"
echo "   Build terminé !"
echo "  ════════════════════════════════════════"
echo ""
