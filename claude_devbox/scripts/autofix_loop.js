/**
 * Claude DevBox - Auto-Fix Loop Script
 * Standalone script to test the auto-correction functionality
 */

import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';

async function autofixLoop(code, language, options = {}) {
    const maxRetries = options.maxRetries || 5;
    const context = options.context || 'Testing auto-fix loop';

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       Claude DevBox - Auto-Fix Loop                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Language: ${language}`);
    console.log(`Max Retries: ${maxRetries}`);
    console.log(`Context: ${context}`);
    console.log('');
    console.log('Initial Code:');
    console.log('─'.repeat(60));
    console.log(code);
    console.log('─'.repeat(60));
    console.log('');

    try {
        console.log('🚀 Starting auto-fix process...\n');

        const response = await axios.post(`${API_BASE}/autofix`, {
            code,
            language,
            maxRetries,
            context
        });

        const result = response.data;

        console.log('═'.repeat(60));
        console.log('                   RESULTS');
        console.log('═'.repeat(60));
        console.log('');

        if (result.success) {
            console.log('✓ Status: SUCCESS');
            console.log(`✓ Attempts: ${result.attempts}`);
            console.log(`✓ Duration: ${result.duration}ms`);
            console.log('');
            console.log('Final Code:');
            console.log('─'.repeat(60));
            console.log(result.finalCode);
            console.log('─'.repeat(60));
        } else {
            console.log('✗ Status: FAILED');
            console.log(`✗ Attempts: ${result.attempts}`);
            console.log(`✗ Error: ${result.error}`);
            console.log('');
            console.log('Last Code:');
            console.log('─'.repeat(60));
            console.log(result.finalCode);
            console.log('─'.repeat(60));
        }

        console.log('');
        console.log('Attempt History:');
        console.log('─'.repeat(60));

        if (result.history) {
            result.history.forEach((attempt, index) => {
                console.log(`\nAttempt ${index + 1}:`);

                if (attempt.error) {
                    console.log(`  Error: ${attempt.error}`);
                } else if (attempt.stderr) {
                    console.log(`  Exit Code: ${attempt.exitCode}`);
                    console.log(`  Stderr:`);
                    attempt.stderr.split('\n').forEach(line => {
                        if (line.trim()) console.log(`    ${line}`);
                    });
                }

                if (attempt.fix) {
                    console.log(`  Fix Applied: Yes`);
                }

                if (attempt.stdout && attempt.exitCode === 0) {
                    console.log(`  Success! Output:`);
                    attempt.stdout.split('\n').forEach(line => {
                        if (line.trim()) console.log(`    ${line}`);
                    });
                }
            });
        }

        console.log('');
        console.log('═'.repeat(60));

        return result;

    } catch (error) {
        console.error('');
        console.error('✗ Auto-fix failed:');
        console.error(`  ${error.message}`);

        if (error.response) {
            console.error(`  HTTP ${error.response.status}: ${error.response.statusText}`);
            if (error.response.data) {
                console.error(`  ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }

        throw error;
    }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
    // Buggy Python code for testing
    const buggyCo = `
import requests

# This code has intentional errors for testing auto-fix
def fetch_data(url):
    response = requests.get(url
    return response.json()

# Missing closing parenthesis above
# Also missing error handling

url = "https://api.github.com/users/github"
data = fetch_data(url)
print(f"Name: {data['name']}")
print(f"Followers: {data['followers']}")
`;

    autofixLoop(buggyCode, 'python', {
        maxRetries: 5,
        context: 'Testing auto-fix with intentionally buggy code'
    }).then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        process.exit(1);
    });
}

export default autofixLoop;
