/**
 * NoteVault MCP — AI Bridge
 * Integration with Claude API for AI features
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

// Initialize Claude client
let anthropic = null;

function getAnthropicClient(config) {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY || config.claude_api_key;
    if (!apiKey) {
      console.warn('⚠️ No Anthropic API key found, using mock responses');
      return null;
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

/**
 * Load AI prompt template
 */
async function loadPrompt(promptName) {
  try {
    const promptPath = path.join(process.cwd(), '../../ai_prompts', `${promptName}.md`);
    return await fs.readFile(promptPath, 'utf-8');
  } catch (err) {
    console.warn(`⚠️ Could not load prompt ${promptName}, using default`);
    return null;
  }
}

/**
 * Call Claude API
 */
async function callClaude(prompt, config) {
  const client = getAnthropicClient(config);

  if (!client) {
    // Mock response for testing
    return `[MOCK] Claude response for: ${prompt.substring(0, 50)}...`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;

  } catch (err) {
    console.error('Claude API error:', err);
    throw new Error(`Claude API failed: ${err.message}`);
  }
}

/**
 * Summarize note content
 */
export async function aiSummarize(content, format, config) {
  console.log(`🧠 AI Summarize: format=${format}`);

  // Load prompt template
  let promptTemplate = await loadPrompt('summarize_note');

  if (!promptTemplate) {
    promptTemplate = `Tu es un assistant expert en prise de notes.
Résume cette note en 3 formats :

**Note:**
{content}

**Formats:**
1. **1 phrase** (tweet-style)
2. **5 lignes** (executive summary)
3. **Version détaillée** (bullet points clés)`;
  }

  // Build prompt
  const prompt = promptTemplate.replace('{content}', content);

  // Call Claude
  const response = await callClaude(prompt, config);

  // Parse response (simple version)
  // TODO: Improve parsing
  const summaries = {
    short: response.split('\n')[0] || 'Summary not available',
    medium: response.substring(0, 200),
    detailed: response
  };

  return {
    format: format,
    summary: summaries[format] || summaries.medium,
    all_formats: summaries
  };
}

/**
 * Classify note and suggest tags
 */
export async function aiClassify(content, existing_tags, config) {
  console.log(`🧠 AI Classify`);

  let promptTemplate = await loadPrompt('thematic_sort');

  if (!promptTemplate) {
    promptTemplate = `Analyse cette note et extrais :
1. **Thèmes dominants** (3-5 mots-clés)
2. **Tags suggérés**
3. **Liens potentiels** avec autres notes (indices)

**Note:**
{content}

**Tags existants dans le vault:**
{existing_tags}

Réponds en JSON:
{
  "themes": ["theme1", "theme2", ...],
  "suggested_tags": ["tag1", "tag2", ...],
  "potential_links": ["keyword1", "keyword2", ...]
}`;
  }

  const prompt = promptTemplate
    .replace('{content}', content)
    .replace('{existing_tags}', existing_tags.join(', '));

  const response = await callClaude(prompt, config);

  // Try to parse JSON
  try {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse Claude JSON response, using fallback');
  }

  // Fallback: extract from text
  return {
    themes: ['uncategorized'],
    suggested_tags: [],
    potential_links: []
  };
}

/**
 * Extract key ideas and actionable items
 */
export async function aiExtractMemory(content, config) {
  console.log(`🧠 AI Extract Memory`);

  let promptTemplate = await loadPrompt('memory_extract');

  if (!promptTemplate) {
    promptTemplate = `Extrais de cette note :
- **Idées clés** (insights importants)
- **Points actionnables** (TODOs)
- **Concepts à retenir**

**Note:**
{content}

Réponds en JSON:
{
  "key_ideas": ["idea1", "idea2", ...],
  "actionable_items": ["todo1", "todo2", ...],
  "concepts": ["concept1", "concept2", ...]
}`;
  }

  const prompt = promptTemplate.replace('{content}', content);

  const response = await callClaude(prompt, config);

  // Try to parse JSON
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn('Failed to parse memory extraction, using fallback');
  }

  return {
    key_ideas: [],
    actionable_items: [],
    concepts: []
  };
}

/**
 * RAG summary across multiple notes
 */
export async function aiRagSummary(note_ids, query, config) {
  console.log(`🧠 AI RAG Summary: ${note_ids.length} notes`);

  // TODO: Fetch note excerpts from backend
  // For now, use mock data
  const note_excerpts = note_ids.map((id, idx) =>
    `[Note ${idx + 1}] Mock excerpt for note ${id}`
  ).join('\n\n');

  let promptTemplate = await loadPrompt('rag_summary');

  if (!promptTemplate) {
    promptTemplate = `Contexte : {query}
Notes pertinentes :

{note_excerpts}

Génère un résumé synthétique répondant à la question,
en citant les sources (IDs des notes).`;
  }

  const prompt = promptTemplate
    .replace('{query}', query)
    .replace('{note_excerpts}', note_excerpts);

  const response = await callClaude(prompt, config);

  return {
    query: query,
    note_count: note_ids.length,
    summary: response
  };
}

export default {
  aiSummarize,
  aiClassify,
  aiExtractMemory,
  aiRagSummary
};
