#!/bin/bash

# 🚀 Script de lancement du sandbox Docker
# Exécute une commande dans l'environnement isolé

set -e

IMAGE_NAME="mcp-sandbox:latest"
COMMAND="${1:-echo 'Hello from Sandbox!'}"
TIMEOUT="${2:-30}"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier que l'image existe
if ! docker images -q "$IMAGE_NAME" | grep -q .; then
    echo "🏗️  Image $IMAGE_NAME n'existe pas. Construction en cours..."
    cd "$(dirname "$0")"
    docker build -t "$IMAGE_NAME" .
fi

# Exécuter la commande dans le sandbox
echo "🐳 Exécution dans sandbox: $COMMAND"
echo "⏱️  Timeout: ${TIMEOUT}s"
echo "---"

docker run \
    --rm \
    --network none \
    --memory 256m \
    --cpus 0.5 \
    --user sandbox \
    --workdir /home/sandbox/workspace \
    "$IMAGE_NAME" \
    bash -c "$COMMAND"

EXIT_CODE=$?

echo "---"
echo "✅ Terminé avec code: $EXIT_CODE"

exit $EXIT_CODE
