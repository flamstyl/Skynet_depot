# Guide de contribution

Merci de votre intérêt pour contribuer à l'Assistant IA Personnel Local ! 🎉

## Comment contribuer

### Signaler un bug

Si vous trouvez un bug, ouvrez une issue avec :
- Une description claire du problème
- Les étapes pour reproduire
- Le comportement attendu vs observé
- Votre environnement (OS, Python version, Node version)

### Proposer une fonctionnalité

Pour proposer une nouvelle fonctionnalité :
1. Ouvrez une issue pour discuter de la fonctionnalité
2. Attendez les retours avant de commencer le développement
3. Une fois validée, suivez le processus de Pull Request ci-dessous

### Soumettre une Pull Request

1. **Fork** le projet
2. **Créez une branche** pour votre fonctionnalité :
   ```bash
   git checkout -b feature/ma-super-fonctionnalite
   ```
3. **Commitez** vos changements avec des messages clairs :
   ```bash
   git commit -m "Ajout de la fonctionnalité X"
   ```
4. **Pushez** vers votre fork :
   ```bash
   git push origin feature/ma-super-fonctionnalite
   ```
5. **Ouvrez une Pull Request** vers la branche `main`

## Standards de code

### Python (Backend)

- Suivez **PEP 8**
- Utilisez des **docstrings** pour les fonctions
- Ajoutez des **type hints** quand possible
- Commentez en **français** pour la cohérence

Exemple :
```python
def process_message(message: str, temperature: float = 0.7) -> str:
    """
    Traite un message utilisateur et génère une réponse.

    Args:
        message: Le message de l'utilisateur
        temperature: Température pour la génération (0-2)

    Returns:
        La réponse générée par l'IA
    """
    # Votre code ici
    pass
```

### JavaScript/React (Frontend)

- Utilisez **ESLint** pour le linting
- Préférez les **fonctions fléchées** et les **hooks**
- Commentez les composants complexes
- Utilisez **Tailwind CSS** pour le styling

Exemple :
```jsx
/**
 * Composant pour afficher un message de chat
 */
const MessageBubble = ({ message, isUser }) => {
  // Votre code ici
};
```

### Extension Chrome

- Respectez le **Manifest V3**
- Documentez les permissions requises
- Testez sur plusieurs pages web

## Tests

### Backend

Ajoutez des tests pour vos fonctionnalités :
```bash
cd backend
pytest tests/
```

### Frontend

```bash
cd frontend
npm test
```

## Documentation

- Mettez à jour le **README.md** si nécessaire
- Ajoutez des exemples d'utilisation
- Documentez les nouvelles API ou endpoints

## Code de conduite

- Soyez respectueux et constructif
- Accueillez les nouveaux contributeurs
- Focalisez sur le code, pas sur les personnes
- Aidez à créer une communauté inclusive

## Questions ?

N'hésitez pas à ouvrir une issue ou à rejoindre les discussions !

Merci pour votre contribution ! 🙏
