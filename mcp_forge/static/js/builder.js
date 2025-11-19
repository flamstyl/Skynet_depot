/**
 * MCP Forge Builder - Main JavaScript
 */

// API Base URL
const API_BASE = '/api';

// Global state
let currentAgent = null;
let components = {};
let canvasNodes = [];
let selectedNode = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
    initializeCanvas();
});

/**
 * Load available components from API
 */
async function loadComponents() {
    try {
        const response = await fetch(`${API_BASE}/builder/components`);
        const data = await response.json();

        if (data.success) {
            components = data.components;
            renderComponentLists();
        }
    } catch (error) {
        console.error('Failed to load components:', error);
    }
}

/**
 * Render component lists in sidebar
 */
function renderComponentLists() {
    // Render triggers
    const triggersList = document.getElementById('triggers-list');
    triggersList.innerHTML = '';
    if (components.triggers) {
        components.triggers.forEach(comp => {
            triggersList.appendChild(createComponentItem(comp, 'trigger'));
        });
    }

    // Render actions
    const actionsList = document.getElementById('actions-list');
    actionsList.innerHTML = '';
    if (components.actions) {
        components.actions.forEach(comp => {
            actionsList.appendChild(createComponentItem(comp, 'action'));
        });
    }

    // Render conditions
    const conditionsList = document.getElementById('conditions-list');
    conditionsList.innerHTML = '';
    if (components.conditions) {
        components.conditions.forEach(comp => {
            conditionsList.appendChild(createComponentItem(comp, 'condition'));
        });
    }

    // Render integrations
    const integrationsList = document.getElementById('integrations-list');
    integrationsList.innerHTML = '';
    if (components.integrations) {
        components.integrations.forEach(comp => {
            integrationsList.appendChild(createComponentItem(comp, 'integration'));
        });
    }
}

/**
 * Create component item element
 */
function createComponentItem(component, category) {
    const div = document.createElement('div');
    div.className = 'component-item';
    div.draggable = true;
    div.innerHTML = `
        <span class="icon">${component.icon}</span>
        <span>${component.name}</span>
    `;

    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('component', JSON.stringify({ ...component, category }));
    });

    return div;
}

/**
 * Save agent
 */
async function saveAgent() {
    const name = document.getElementById('agent-name').value;
    const description = document.getElementById('agent-description').value;
    const model = document.getElementById('agent-model').value;
    const role = document.getElementById('agent-role').value;
    const instructionsText = document.getElementById('agent-instructions').value;
    const instructions = instructionsText.split('\n').filter(line => line.trim());

    if (!name || !model) {
        alert('Please provide agent name and model');
        return;
    }

    const agentData = {
        name,
        description,
        model,
        role,
        instructions
    };

    try {
        let response;
        if (currentAgent && currentAgent.id) {
            // Update existing agent
            response = await fetch(`${API_BASE}/agents/${currentAgent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });
        } else {
            // Create new agent
            response = await fetch(`${API_BASE}/agents/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });
        }

        const data = await response.json();

        if (data.success) {
            currentAgent = data.agent;
            alert('Agent saved successfully!');

            // Save triggers, actions, conditions
            await saveCanvasNodes();
        } else {
            alert('Failed to save agent: ' + data.error);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save agent');
    }
}

/**
 * Save canvas nodes to agent
 */
async function saveCanvasNodes() {
    if (!currentAgent || !currentAgent.id) {
        return;
    }

    // Save triggers
    for (const node of canvasNodes) {
        if (node.category === 'trigger') {
            await fetch(`${API_BASE}/agents/${currentAgent.id}/triggers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: node.component.id.replace('trigger_', ''),
                    config: node.config || {}
                })
            });
        } else if (node.category === 'action') {
            await fetch(`${API_BASE}/agents/${currentAgent.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: node.component.id.replace('action_', ''),
                    name: node.component.name,
                    config: node.config || {}
                })
            });
        } else if (node.category === 'condition') {
            await fetch(`${API_BASE}/agents/${currentAgent.id}/conditions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: node.component.id.replace('condition_', ''),
                    expression: node.config?.expression || 'true',
                    true_branch: node.config?.true_branch || [],
                    false_branch: node.config?.false_branch || []
                })
            });
        }
    }
}

/**
 * Load agents
 */
async function loadAgents() {
    try {
        const response = await fetch(`${API_BASE}/agents/`);
        const data = await response.json();

        if (data.success) {
            showAgentsList(data.agents);
        }
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

/**
 * Show agents list modal
 */
function showAgentsList(agents) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '<div class="agents-list"></div>';

    const list = modalBody.querySelector('.agents-list');

    agents.forEach(agent => {
        const item = document.createElement('div');
        item.className = 'agent-list-item';
        item.style.padding = '1rem';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <h4>${agent.name}</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${agent.description || ''}</p>
            <small>Model: ${agent.model} | Status: ${agent.status}</small>
        `;

        item.addEventListener('click', () => {
            loadAgent(agent.id);
            closeModal();
        });

        list.appendChild(item);
    });

    document.getElementById('modal-title').textContent = 'Load Agent';
    document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Load specific agent
 */
async function loadAgent(agentId) {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}`);
        const data = await response.json();

        if (data.success) {
            currentAgent = data.agent;
            populateAgentForm(currentAgent);
        }
    } catch (error) {
        console.error('Failed to load agent:', error);
    }
}

/**
 * Populate form with agent data
 */
function populateAgentForm(agent) {
    document.getElementById('agent-name').value = agent.name || '';
    document.getElementById('agent-description').value = agent.description || '';
    document.getElementById('agent-model').value = agent.config.model || '';
    document.getElementById('agent-role').value = agent.config.role || '';
    document.getElementById('agent-instructions').value = agent.config.instructions?.join('\n') || '';
}

/**
 * Show preview
 */
async function showPreview() {
    if (!currentAgent || !currentAgent.id) {
        alert('Please save the agent first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/builder/preview/${currentAgent.id}`);
        const data = await response.json();

        if (data.success) {
            showPreviewModal(data.preview);
        }
    } catch (error) {
        console.error('Preview error:', error);
    }
}

/**
 * Show preview modal
 */
function showPreviewModal(preview) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h4>Execution Flow</h4>
        <div style="margin-bottom: 1rem;">
            ${preview.execution_flow.map((step, idx) => `
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--light-bg); border-radius: 4px;">
                    <strong>${idx + 1}. ${step.description}</strong>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Type: ${step.type}</div>
                </div>
            `).join('')}
        </div>
        <h4>Cost Estimate</h4>
        <p>Model: ${preview.estimated_cost.model}</p>
        <p>Input tokens: ~${preview.estimated_cost.estimated_input_tokens}</p>
        <p>Output tokens: ~${preview.estimated_cost.estimated_output_tokens}</p>
        <p><strong>Estimated cost: $${preview.estimated_cost.estimated_cost_usd}</strong></p>

        <h4>Duration Estimate</h4>
        <p>~${preview.estimated_duration_ms}ms</p>

        ${preview.potential_issues.length > 0 ? `
            <h4>Potential Issues</h4>
            ${preview.potential_issues.map(issue => `
                <div style="padding: 0.5rem; margin: 0.5rem 0; background: var(--warning-color); color: black; border-radius: 4px;">
                    <strong>${issue.severity.toUpperCase()}</strong>: ${issue.message}
                </div>
            `).join('')}
        ` : ''}
    `;

    document.getElementById('modal-title').textContent = 'Agent Preview';
    document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Test dry run
 */
async function testDryRun() {
    if (!currentAgent || !currentAgent.id) {
        alert('Please save the agent first');
        return;
    }

    const testInput = prompt('Enter test input (JSON):');
    let inputData = null;

    if (testInput) {
        try {
            inputData = JSON.parse(testInput);
        } catch {
            inputData = { input: testInput };
        }
    }

    try {
        const response = await fetch(`${API_BASE}/builder/dry-run/${currentAgent.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: inputData })
        });

        const data = await response.json();

        if (data.success) {
            showDryRunResult(data.result);
        }
    } catch (error) {
        console.error('Dry run error:', error);
    }
}

/**
 * Show dry run result
 */
function showDryRunResult(result) {
    const modalBody = document.getElementById('modal-body');
    const statusColor = result.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)';

    modalBody.innerHTML = `
        <div style="padding: 1rem; background: ${statusColor}; color: white; border-radius: 4px; margin-bottom: 1rem;">
            <strong>Status: ${result.status.toUpperCase()}</strong>
        </div>
        <p><strong>Duration:</strong> ${result.duration_ms}ms</p>

        ${result.output_data ? `
            <h4>Output</h4>
            <pre style="background: var(--light-bg); padding: 1rem; border-radius: 4px; overflow-x: auto;">${JSON.stringify(result.output_data, null, 2)}</pre>
        ` : ''}

        ${result.error_message ? `
            <h4>Error</h4>
            <div style="background: var(--danger-color); color: white; padding: 1rem; border-radius: 4px;">
                ${result.error_message}
            </div>
        ` : ''}
    `;

    document.getElementById('modal-title').textContent = 'Dry Run Result';
    document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Validate with AI
 */
async function validateWithAI() {
    if (!currentAgent || !currentAgent.id) {
        alert('Please save the agent first');
        return;
    }

    const validator = confirm('Use Claude for validation?\nOK = Claude, Cancel = GPT') ? 'claude' : 'gpt';

    try {
        const response = await fetch(`${API_BASE}/validation/${currentAgent.id}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validator })
        });

        const data = await response.json();

        if (data.success) {
            showValidationResult(data.validation);
        }
    } catch (error) {
        console.error('Validation error:', error);
        alert('Validation failed. Make sure API keys are configured.');
    }
}

/**
 * Show validation result
 */
function showValidationResult(validation) {
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <div style="padding: 1rem; background: var(--primary-color); color: white; border-radius: 4px; margin-bottom: 1rem;">
            <h3>Score: ${validation.score}/100</h3>
            <small>Validator: ${validation.validator}</small>
        </div>

        <h4>Feedback</h4>
        <p>${validation.feedback}</p>

        ${validation.suggestions.length > 0 ? `
            <h4>Suggestions</h4>
            <ul>
                ${validation.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
        ` : ''}
    `;

    document.getElementById('modal-title').textContent = 'AI Validation Result';
    document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Export agent
 */
async function exportAgent() {
    if (!currentAgent || !currentAgent.id) {
        alert('Please save the agent first');
        return;
    }

    const format = prompt('Export format:\n1. YAML\n2. JSON\n3. n8n\n4. MCP\n\nEnter number:');

    const formats = { '1': 'yaml', '2': 'json', '3': 'n8n', '4': 'mcp' };
    const selectedFormat = formats[format] || 'yaml';

    try {
        const response = await fetch(`${API_BASE}/export/${currentAgent.id}/${selectedFormat}`);
        const data = await response.json();

        if (data.success) {
            showExportResult(data, selectedFormat);
        }
    } catch (error) {
        console.error('Export error:', error);
    }
}

/**
 * Show export result
 */
function showExportResult(data, format) {
    const content = data.content || JSON.stringify(data.workflow || data.config, null, 2);

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <p><strong>Format:</strong> ${format.toUpperCase()}</p>
        <p><strong>Filename:</strong> ${data.filename}</p>
        <textarea readonly style="width: 100%; height: 400px; font-family: monospace; padding: 1rem; background: var(--light-bg); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">${content}</textarea>
        <button class="btn btn-primary" onclick="downloadExport('${format}')" style="margin-top: 1rem;">Download</button>
    `;

    document.getElementById('modal-title').textContent = 'Export Result';
    document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Download export
 */
async function downloadExport(format) {
    if (!currentAgent || !currentAgent.id) return;

    window.location.href = `${API_BASE}/export/${currentAgent.id}/download/${format}`;
}

/**
 * Show templates
 */
async function showTemplates() {
    try {
        const response = await fetch(`${API_BASE}/builder/templates`);
        const data = await response.json();

        if (data.success) {
            showTemplatesModal(data.templates);
        }
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

/**
 * Show templates modal
 */
function showTemplatesModal(templates) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '<div class="templates-list"></div>';

    const list = modalBody.querySelector('.templates-list');

    templates.forEach(template => {
        const item = document.createElement('div');
        item.style.padding = '1rem';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <h4>${template.name}</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${template.description}</p>
            <small>Model: ${template.model}</small>
        `;

        item.addEventListener('click', () => {
            applyTemplate(template);
            closeModal();
        });

        list.appendChild(item);
    });

    document.getElementById('modal-title').textContent = 'Agent Templates';
    document.getElementById('modal-overlay').style.display = 'flex';
}

/**
 * Apply template
 */
function applyTemplate(template) {
    document.getElementById('agent-name').value = template.name;
    document.getElementById('agent-description').value = template.description;
    document.getElementById('agent-model').value = template.model;
    document.getElementById('agent-role').value = template.role;
    document.getElementById('agent-instructions').value = template.instructions.join('\n');
}

/**
 * Close modal
 */
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}
