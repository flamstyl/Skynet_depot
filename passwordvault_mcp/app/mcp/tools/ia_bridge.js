/**
 * PasswordVault MCP — IA Bridge
 * Skynet Secure Vault v1.0
 *
 * Pont vers Claude API pour audit de sécurité
 */

const fs = require('fs').promises;
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

class IABridge {
    constructor() {
        this.client = null;
        this.prompts = {};
        this.initialized = false;
    }

    async init() {
        // Initialiser client Anthropic
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            console.warn('⚠️ ANTHROPIC_API_KEY not set - IA features disabled');
            this.initialized = false;
            return;
        }

        try {
            this.client = new Anthropic({
                apiKey: apiKey
            });

            // Charger les prompts
            await this.loadPrompts();

            console.log('✓ IA Bridge initialized (Claude API)');
            this.initialized = true;

        } catch (error) {
            console.error('Failed to initialize IA Bridge:', error);
            this.initialized = false;
        }
    }

    async loadPrompts() {
        /**
         * Charge les prompts depuis ai_prompts/
         */
        const promptsPath = path.join(__dirname, '../../../ai_prompts');

        try {
            const assessPrompt = await fs.readFile(
                path.join(promptsPath, 'assess_security.md'),
                'utf-8'
            );
            this.prompts.assess = assessPrompt;

            const improvePrompt = await fs.readFile(
                path.join(promptsPath, 'improve_password.md'),
                'utf-8'
            );
            this.prompts.improve = improvePrompt;

            const detectPrompt = await fs.readFile(
                path.join(promptsPath, 'detect_risks.md'),
                'utf-8'
            );
            this.prompts.detect = detectPrompt;

            console.log('✓ IA prompts loaded');

        } catch (error) {
            console.warn('⚠️ Failed to load prompts:', error.message);
        }
    }

    async callClaude(systemPrompt, userMessage) {
        /**
         * Appelle Claude API
         *
         * @param {string} systemPrompt - Prompt système
         * @param {string} userMessage - Message utilisateur
         * @returns {Promise<string>} - Réponse de Claude
         */
        if (!this.initialized || !this.client) {
            throw new Error('IA Bridge not initialized');
        }

        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 2000,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userMessage
                    }
                ]
            });

            return response.content[0].text;

        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    async assessSecurity(metadata) {
        /**
         * Évalue la sécurité d'un mot de passe (via métadonnées)
         *
         * @param {object} metadata - Métadonnées (PAS le password en clair!)
         * @returns {Promise<object>} - Rapport de sécurité
         */
        if (!this.initialized) {
            // Fallback si IA non disponible
            return this.fallbackAssessment(metadata);
        }

        const userMessage = `
Analyse la sécurité de ce mot de passe basé sur ses métadonnées:

- Longueur: ${metadata.password_length} caractères
- Majuscules: ${metadata.has_uppercase ? 'Oui' : 'Non'}
- Minuscules: ${metadata.has_lowercase ? 'Oui' : 'Non'}
- Chiffres: ${metadata.has_digits ? 'Oui' : 'Non'}
- Caractères spéciaux: ${metadata.has_special ? 'Oui' : 'Non'}
- Âge: ${metadata.age_days || 0} jours

Réponds en JSON avec:
{
  "score": <0-100>,
  "strength": "<weak|medium|strong|very_strong>",
  "weaknesses": ["..."],
  "recommendations": ["..."]
}
        `.trim();

        try {
            const response = await this.callClaude(
                this.prompts.assess || 'You are a password security expert.',
                userMessage
            );

            // Parser la réponse JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.fallbackAssessment(metadata);

        } catch (error) {
            console.error('Assessment error:', error);
            return this.fallbackAssessment(metadata);
        }
    }

    fallbackAssessment(metadata) {
        /**
         * Évaluation basique sans IA
         */
        let score = 0;

        if (metadata.password_length >= 12) score += 30;
        else if (metadata.password_length >= 8) score += 15;

        if (metadata.has_uppercase) score += 15;
        if (metadata.has_lowercase) score += 15;
        if (metadata.has_digits) score += 15;
        if (metadata.has_special) score += 25;

        const weaknesses = [];
        const recommendations = [];

        if (metadata.password_length < 12) {
            weaknesses.push('Password too short');
            recommendations.push('Use at least 12 characters');
        }

        if (!metadata.has_uppercase || !metadata.has_lowercase) {
            weaknesses.push('Missing uppercase or lowercase');
            recommendations.push('Use both uppercase and lowercase letters');
        }

        if (!metadata.has_special) {
            weaknesses.push('No special characters');
            recommendations.push('Add special characters (!@#$%^&*)');
        }

        if (metadata.age_days > 90) {
            weaknesses.push('Password is old');
            recommendations.push('Change password regularly (every 90 days)');
        }

        let strength = 'weak';
        if (score >= 80) strength = 'very_strong';
        else if (score >= 60) strength = 'strong';
        else if (score >= 40) strength = 'medium';

        return {
            score,
            strength,
            weaknesses,
            recommendations
        };
    }

    async improvePassword(context) {
        /**
         * Suggère des améliorations pour un mot de passe
         *
         * @param {object} context - Contexte (force actuelle, usage, etc.)
         * @returns {Promise<object>} - Suggestions
         */
        if (!this.initialized) {
            return {
                suggestions: [
                    'Use at least 12 characters',
                    'Mix uppercase, lowercase, digits, and special characters',
                    'Avoid common words and patterns',
                    'Use a passphrase (e.g., "correct-horse-battery-staple")'
                ]
            };
        }

        const userMessage = `
Contexte:
- Force actuelle: ${context.current_strength || 'unknown'}
- Site web: ${context.website || 'generic'}
- Nom d'utilisateur: ${context.username || 'unknown'}

Donne des suggestions spécifiques pour améliorer ce mot de passe.

Réponds en JSON:
{
  "suggestions": ["...", "..."],
  "example_pattern": "..."
}
        `.trim();

        try {
            const response = await this.callClaude(
                this.prompts.improve || 'You are a password security expert.',
                userMessage
            );

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Failed to parse response');

        } catch (error) {
            console.error('Improve error:', error);
            return {
                suggestions: [
                    'Use at least 12 characters',
                    'Mix character types',
                    'Avoid personal information'
                ]
            };
        }
    }

    async detectRisks(patterns) {
        /**
         * Détecte les risques de sécurité dans le vault
         *
         * @param {object} patterns - Patterns détectés
         * @returns {Promise<object>} - Analyse des risques
         */
        if (!this.initialized) {
            return {
                critical_risks: [],
                warnings: [],
                recommendations: []
            };
        }

        const userMessage = `
Analyse ces patterns de sécurité:

- Mots de passe réutilisés: ${patterns.reused_passwords || 0}
- Mots de passe faibles: ${patterns.weak_passwords || 0}
- Mots de passe anciens (>90 jours): ${patterns.old_passwords || 0}
- Total d'entrées: ${patterns.total_entries || 0}

Identifie les risques critiques et donne des recommandations.

Réponds en JSON:
{
  "critical_risks": ["..."],
  "warnings": ["..."],
  "recommendations": ["..."]
}
        `.trim();

        try {
            const response = await this.callClaude(
                this.prompts.detect || 'You are a password security expert.',
                userMessage
            );

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Failed to parse response');

        } catch (error) {
            console.error('Risk detection error:', error);
            return {
                critical_risks: [],
                warnings: [],
                recommendations: []
            };
        }
    }
}

// Instance globale
const iaBridge = new IABridge();

module.exports = {
    init: () => iaBridge.init(),
    assessSecurity: (metadata) => iaBridge.assessSecurity(metadata),
    improvePassword: (context) => iaBridge.improvePassword(context),
    detectRisks: (patterns) => iaBridge.detectRisks(patterns)
};
