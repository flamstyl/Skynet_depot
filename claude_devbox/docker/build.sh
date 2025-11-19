#!/bin/bash
# Build Claude DevBox Sandbox Docker Image

set -e

IMAGE_NAME="devbox-sandbox"
IMAGE_TAG="latest"

echo "=== Building Claude DevBox Sandbox ==="
echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""

# Build the image
docker build \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" \
    -f Dockerfile \
    .

echo ""
echo "✓ Build complete!"
echo ""
echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""

# Display image info
docker images | grep "${IMAGE_NAME}"

echo ""
echo "To test the image, run:"
echo "  docker run --rm -it ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "To test with workspace:"
echo "  docker run --rm -it -v \$(pwd)/../workspace:/workspace ${IMAGE_NAME}:${IMAGE_TAG}"
