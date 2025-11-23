/**
 * Prompts optimisés pour LM Studio
 */

export const PROMPTS = {
  summarizeThread: (messages: any[], options: any = {}) => `
Tu es un assistant intelligent qui résume des conversations email.

Voici un thread de ${messages.length} messages :

${messages.map((m, i) => `
Message ${i + 1}:
De: ${m.from}
À: ${m.to}
Date: ${m.date}
Sujet: ${m.subject}

${m.body}
`).join('\n---\n')}

Génère un résumé au format ${options.format || 'bullets'}, en ${options.language || 'français'}.
${options.includeActions ? 'Inclure les actions à faire si mentionnées.' : ''}

Réponds UNIQUEMENT en JSON :
{
  "summary": "Résumé principal en 1-2 phrases",
  "keyPoints": ["Point clé 1", "Point clé 2", "..."],
  "actions": [{"action": "...", "deadline": "...", "priority": "high|medium|low"}]
}
`,

  proposeReply: (thread: any, context: string = '', style: string = 'neutral') => `
Tu es un assistant qui aide à rédiger des réponses email.

Thread original :
Sujet: ${thread.subject}
De: ${thread.participants[0]}

Dernier message :
${thread.messages[thread.messages.length - 1].body}

Contexte additionnel : ${context || 'Aucun'}
Style souhaité : ${style}

Propose 3 variantes de réponse email (courte, standard, détaillée).

Réponds en JSON :
{
  "candidates": [
    {"type": "short", "subject": "Re: ...", "body": "..."},
    {"type": "standard", "subject": "Re: ...", "body": "..."},
    {"type": "detailed", "subject": "Re: ...", "body": "..."}
  ]
}
`,

  dailyDigest: (emails: any[], date: string) => `
Tu es un assistant qui génère un digest quotidien de la boîte mail.

Date : ${date}
Nombre de mails : ${emails.length}

Mails :
${emails.map((e, i) => `
${i + 1}. De: ${e.from} | Sujet: ${e.subject} | Snippet: ${e.snippet}
`).join('\n')}

Génère un rapport structuré :
1. Résumé global (2-3 phrases)
2. Mails urgents (si présents)
3. Catégories détectées (travail, personnel, newsletters, etc.)
4. Actions recommandées

Réponds en JSON :
{
  "digest": "...",
  "urgent": [{...}],
  "byCategory": {
    "work": [{...}],
    "personal": [{...}],
    "newsletters": [{...}]
  },
  "recommendedActions": ["..."]
}
`,

  classifyEmail: (email: any, categories: string[]) => `
Classe cet email dans une des catégories : ${categories.join(', ')}

Email :
De: ${email.from}
Sujet: ${email.subject}
Contenu: ${email.snippet}

Réponds en JSON :
{
  "category": "...",
  "confidence": 0.95,
  "suggestedLabels": ["Label 1", "Label 2"]
}
`,

  extractActions: (email: any) => `
Analyse cet email et extrait les actions/tâches mentionnées.

Email :
De: ${email.from}
Sujet: ${email.subject}
Contenu: ${email.body}

Réponds en JSON :
{
  "actions": [
    {"action": "...", "deadline": "YYYY-MM-DD ou null", "priority": "high|medium|low"}
  ]
}
`,

  sentimentAnalysis: (email: any) => `
Analyse le ton et le sentiment de cet email.

De: ${email.from}
Sujet: ${email.subject}
Contenu: ${email.snippet}

Réponds en JSON :
{
  "sentiment": "positive|neutral|negative",
  "tone": "formal|friendly|urgent|casual",
  "urgency": "high|medium|low"
}
`,
};
