/**
 * Sentinelle MCP - AI Bridge Tool
 * Handles AI analysis via CLI tools (Claude, Gemini)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Analyze event with AI
 *
 * @param {Object} event - Event to analyze
 * @param {string} promptType - Type of prompt (analyze_change, generate_reaction, summarize_event)
 * @param {Object} config - Server configuration
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeWithAI(event, promptType, config) {
    const startTime = Date.now();

    try {
        // Get AI backend configuration
        const backend = config.ai.backend;
        const modelConfig = config.ai.models[backend];

        if (!modelConfig || !modelConfig.enabled) {
            return {
                success: false,
                error: `AI backend ${backend} is not enabled`,
                model: backend
            };
        }

        // Build prompt
        const prompt = buildPrompt(event, promptType);

        if (!prompt) {
            return {
                success: false,
                error: 'Failed to build prompt',
                model: backend
            };
        }

        // Call AI CLI
        let result;

        if (backend === 'claude_cli') {
            result = await callClaudeCLI(prompt, modelConfig);
        } else if (backend === 'gemini_cli') {
            result = await callGeminiCLI(prompt, modelConfig);
        } else {
            return {
                success: false,
                error: `Unknown AI backend: ${backend}`,
                model: backend
            };
        }

        const duration = Date.now() - startTime;

        if (result.success) {
            // Parse AI response
            const parsed = parseAIResponse(result.output);

            return {
                success: true,
                model: backend,
                result: parsed,
                duration_ms: duration
            };
        } else {
            return {
                success: false,
                error: result.error,
                model: backend,
                duration_ms: duration
            };
        }

    } catch (error) {
        return {
            success: false,
            error: error.message,
            model: config.ai.backend,
            duration_ms: Date.now() - startTime
        };
    }
}

/**
 * Build prompt from template
 *
 * @param {Object} event - Event data
 * @param {string} promptType - Type of prompt
 * @returns {string|null} Formatted prompt
 */
function buildPrompt(event, promptType) {
    try {
        // Template path
        const templatePath = path.join(__dirname, '../../..', 'ai_prompts', `${promptType}.md`);

        // Check if template exists
        if (!fs.existsSync(templatePath)) {
            console.error(`Prompt template not found: ${templatePath}`);
            return null;
        }

        // Read template
        let template = fs.readFileSync(templatePath, 'utf8');

        // Format metadata
        const metadata = event.metadata || {};
        const metadataStr = Object.entries(metadata)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n');

        // Format context
        const context = event.context || {};
        const contextStr = Object.entries(context)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join('\n');

        // Replace placeholders
        template = template
            .replace(/\{event_type\}/g, event.event_type || 'unknown')
            .replace(/\{file_path\}/g, event.path || 'unknown')
            .replace(/\{file_name\}/g, event.file_name || 'unknown')
            .replace(/\{file_extension\}/g, event.file_extension || '')
            .replace(/\{category\}/g, event.category || 'unknown')
            .replace(/\{priority\}/g, event.priority || 'low')
            .replace(/\{timestamp\}/g, event.timestamp || '')
            .replace(/\{metadata\}/g, metadataStr || 'No metadata available')
            .replace(/\{context\}/g, contextStr || 'No context available');

        return template;

    } catch (error) {
        console.error('Error building prompt:', error);
        return null;
    }
}

/**
 * Call Claude CLI
 *
 * @param {string} prompt - Prompt text
 * @param {Object} config - Model configuration
 * @returns {Promise<Object>} Result
 */
function callClaudeCLI(prompt, config) {
    return new Promise((resolve) => {
        const command = config.command || 'claude';
        const timeout = config.timeout_ms || 30000;

        const claude = spawn(command, ['--no-interactive']);

        let output = '';
        let error = '';

        // Timeout handler
        const timeoutId = setTimeout(() => {
            claude.kill();
            resolve({
                success: false,
                error: `Claude CLI timeout after ${timeout}ms`
            });
        }, timeout);

        // Write prompt to stdin
        claude.stdin.write(prompt);
        claude.stdin.end();

        // Collect stdout
        claude.stdout.on('data', (data) => {
            output += data.toString();
        });

        // Collect stderr
        claude.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Handle completion
        claude.on('close', (code) => {
            clearTimeout(timeoutId);

            if (code === 0) {
                resolve({
                    success: true,
                    output: output.trim()
                });
            } else {
                resolve({
                    success: false,
                    error: error || `Claude CLI exited with code ${code}`
                });
            }
        });

        // Handle error
        claude.on('error', (err) => {
            clearTimeout(timeoutId);
            resolve({
                success: false,
                error: `Failed to spawn Claude CLI: ${err.message}`
            });
        });
    });
}

/**
 * Call Gemini CLI
 *
 * @param {string} prompt - Prompt text
 * @param {Object} config - Model configuration
 * @returns {Promise<Object>} Result
 */
function callGeminiCLI(prompt, config) {
    return new Promise((resolve) => {
        const command = config.command || 'gemini';
        const timeout = config.timeout_ms || 30000;

        const gemini = spawn(command);

        let output = '';
        let error = '';

        // Timeout handler
        const timeoutId = setTimeout(() => {
            gemini.kill();
            resolve({
                success: false,
                error: `Gemini CLI timeout after ${timeout}ms`
            });
        }, timeout);

        // Write prompt to stdin
        gemini.stdin.write(prompt);
        gemini.stdin.end();

        // Collect stdout
        gemini.stdout.on('data', (data) => {
            output += data.toString();
        });

        // Collect stderr
        gemini.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Handle completion
        gemini.on('close', (code) => {
            clearTimeout(timeoutId);

            if (code === 0) {
                resolve({
                    success: true,
                    output: output.trim()
                });
            } else {
                resolve({
                    success: false,
                    error: error || `Gemini CLI exited with code ${code}`
                });
            }
        });

        // Handle error
        gemini.on('error', (err) => {
            clearTimeout(timeoutId);
            resolve({
                success: false,
                error: `Failed to spawn Gemini CLI: ${err.message}`
            });
        });
    });
}

/**
 * Parse AI response into structured format
 *
 * @param {string} response - Raw AI response
 * @returns {Object} Parsed result
 */
function parseAIResponse(response) {
    const result = {
        summary: response,
        recommendations: [],
        confidence: 'medium'
    };

    // Extract recommendations (look for numbered lists or bullet points)
    const lines = response.split('\n');
    let inRecommendations = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.toLowerCase().includes('recommendation')) {
            inRecommendations = true;
            continue;
        }

        if (inRecommendations && trimmed) {
            // Check if line starts with number or bullet
            const match = trimmed.match(/^[\d\-•*]\s*(.+)/);
            if (match) {
                result.recommendations.push(match[1].trim());
            }
        }
    }

    // Determine confidence based on keywords
    const lowerResponse = response.toLowerCase();

    if (lowerResponse.includes('certain') ||
        lowerResponse.includes('definitely') ||
        lowerResponse.includes('clearly')) {
        result.confidence = 'high';
    } else if (lowerResponse.includes('might') ||
               lowerResponse.includes('possibly') ||
               lowerResponse.includes('unclear')) {
        result.confidence = 'low';
    }

    return result;
}

module.exports = {
    analyzeWithAI,
    buildPrompt,
    parseAIResponse
};
