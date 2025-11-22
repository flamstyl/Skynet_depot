# Extension Chrome - Assistant IA Local

Extension Chrome pour intégrer l'assistant IA local dans votre navigateur.

## Installation

### En mode développeur (développement)

1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le **Mode développeur** (coin supérieur droit)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `extension/`

### Configuration

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Dans la popup, cliquez sur **Récupérer** pour obtenir le token d'authentification
3. Ou collez manuellement le token que vous avez obtenu depuis le backend
4. Cliquez sur **Sauvegarder le token**

Le voyant devrait passer au vert indiquant que l'extension est connectée au backend.

## Fonctionnalités

### Menus contextuels

Faites un clic droit sur n'importe quelle page pour accéder à :

- **📝 Résumer cette page** : Génère un résumé de la page active
- **📝 Résumer la sélection** : Résume le texte sélectionné
- **🌐 Traduire en français** : Traduit le texte sélectionné
- **💡 Expliquer la sélection** : Explique le texte sélectionné
- **✍️ Reformuler la sélection** : Reformule le texte sélectionné

### Raccourci clavier

- **Ctrl+M** (ou **Cmd+M** sur Mac) : Ouvre le dashboard de l'assistant

### Popup

Cliquez sur l'icône de l'extension pour accéder à :
- Ouvrir le dashboard
- Actions rapides (résumer, traduire)
- Configuration du token

## Prérequis

- Chrome ou Chromium (version 88+)
- Backend de l'assistant IA local en cours d'exécution sur `http://127.0.0.1:3333`

## Structure

```
extension/
├── manifest.json           # Configuration de l'extension (Manifest V3)
├── popup.html             # Interface de la popup
├── popup.js               # Logique de la popup
├── scripts/
│   ├── background.js      # Service Worker (background script)
│   └── contentScript.js   # Script injecté dans les pages
├── styles/
│   └── content.css        # Styles pour le content script
└── icons/                 # Icônes de l'extension
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

## Développement

Pour tester les modifications :
1. Modifiez les fichiers
2. Retournez sur `chrome://extensions/`
3. Cliquez sur le bouton de rechargement (🔄) pour l'extension

## Notes

- L'extension communique uniquement avec le backend local (localhost)
- Aucune donnée n'est envoyée sur Internet (sauf via le backend si configuré)
- Le token d'authentification est stocké localement dans le storage de l'extension

## Dépannage

### L'extension ne se connecte pas au backend
- Vérifiez que le backend est bien démarré sur `http://127.0.0.1:3333`
- Vérifiez que le token d'authentification est correct
- Consultez la console du background script : `chrome://extensions/` > Détails de l'extension > Inspecter les vues > Service Worker

### Les menus contextuels ne s'affichent pas
- Rechargez l'extension
- Redémarrez Chrome

### Les résultats ne s'affichent pas
- Vérifiez les permissions de l'extension
- Consultez la console de la page (`F12`)
