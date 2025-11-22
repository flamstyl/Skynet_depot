# 🎨 Skynet Creative MCP

Serveur MCP pour traitement d'images avancé avec Sharp.

## 🎯 Outils disponibles (7 tools)

- `image_resize` - Redimensionner (width, height, fit)
- `image_convert` - Convertir format (JPEG, PNG, WebP, AVIF, GIF)
- `image_rotate` - Rotation d'angle
- `image_watermark` - Ajouter watermark texte
- `image_compose` - Superposer deux images
- `image_metadata` - Extraire métadonnées EXIF
- `image_optimize` - Optimiser pour le web (compression)

## 📦 Installation

```bash
cd skynet-creative-mcp
npm install
npm run build
```

## 🔧 Configuration

```json
{
  "mcp": {
    "servers": {
      "creative": {
        "command": "node",
        "args": ["/chemin/vers/skynet-creative-mcp/dist/index.js"]
      }
    }
  }
}
```

## 📖 Exemples

```
"Redimensionne photo.jpg à 800x600 pixels"
→ image_resize

"Convertis image.png en WebP avec qualité 90"
→ image_convert

"Ajoute le watermark 'Skynet 2025' sur banner.jpg"
→ image_watermark

"Optimise logo.jpg pour le web"
→ image_optimize
```

## 📄 Licence

MIT - Skynet Depot © 2025
