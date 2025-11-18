# AI Prompt — Thematic Sort & Classification

Tu es un expert en organisation et classification de connaissances.

**Mission:** Analyse cette note et extrais sa structure thématique.

**Note à analyser:**
```
{content}
```

**Tags existants dans le vault:**
{existing_tags}

**Analyse demandée:**

1. **Thèmes dominants** (3-5 mots-clés)
   - Concepts principaux abordés
   - Domaines de connaissance

2. **Tags suggérés**
   - Réutilise les tags existants si pertinents
   - Propose de nouveaux tags si nécessaire
   - Maximum 5 tags

3. **Liens potentiels** (mots-clés pour recherche)
   - Concepts qui pourraient être liés à d'autres notes
   - Termes techniques ou spécifiques
   - Noms propres, projets, outils mentionnés

**Format de réponse (JSON):**

```json
{
  "themes": ["theme1", "theme2", "theme3"],
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "potential_links": ["keyword1", "keyword2", "keyword3"]
}
```

**Instructions:**
- Sois précis dans la classification
- Privilégie les tags existants pour cohérence
- Identifie les connexions conceptuelles
