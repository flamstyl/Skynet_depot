/**
 * Canvas Management - Drag & Drop functionality
 */

let isDragging = false;
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };

/**
 * Initialize canvas
 */
function initializeCanvas() {
    const canvas = document.getElementById('canvas');

    // Handle drop on canvas
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();

        const componentData = e.dataTransfer.getData('component');
        if (componentData) {
            const component = JSON.parse(componentData);
            addNodeToCanvas(component, e.clientX, e.clientY);
        }
    });

    // Handle canvas click to deselect
    canvas.addEventListener('click', (e) => {
        if (e.target === canvas) {
            deselectNode();
        }
    });
}

/**
 * Add node to canvas
 */
function addNodeToCanvas(component, x, y) {
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    const node = {
        id: `node_${Date.now()}`,
        component: component,
        category: component.category,
        x: x - canvasRect.left + canvas.scrollLeft - 75,
        y: y - canvasRect.top + canvas.scrollTop - 50,
        config: {}
    };

    canvasNodes.push(node);
    renderNode(node);
}

/**
 * Render node on canvas
 */
function renderNode(node) {
    const canvas = document.getElementById('canvas');
    const nodeEl = document.createElement('div');

    nodeEl.className = 'canvas-node';
    nodeEl.id = node.id;
    nodeEl.style.left = node.x + 'px';
    nodeEl.style.top = node.y + 'px';

    const bgColors = {
        trigger: '#4CAF50',
        action: '#2196F3',
        condition: '#FF9800',
        integration: '#E91E63'
    };

    nodeEl.style.borderColor = bgColors[node.category] || '#666';

    nodeEl.innerHTML = `
        <div class="node-header">
            <span class="node-icon">${node.component.icon}</span>
            <button class="node-delete" onclick="deleteNode('${node.id}')">&times;</button>
        </div>
        <div class="node-title">${node.component.name}</div>
        <div class="node-type">${node.category}</div>
    `;

    // Make draggable
    nodeEl.addEventListener('mousedown', (e) => {
        if (e.target.className === 'node-delete') return;

        isDragging = true;
        draggedNode = node;

        const rect = nodeEl.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        selectNode(node);
        e.preventDefault();
    });

    // Click to select
    nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node);
    });

    canvas.appendChild(nodeEl);
}

/**
 * Handle mouse move for dragging
 */
document.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedNode) return;

    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    draggedNode.x = e.clientX - canvasRect.left + canvas.scrollLeft - dragOffset.x;
    draggedNode.y = e.clientY - canvasRect.top + canvas.scrollTop - dragOffset.y;

    const nodeEl = document.getElementById(draggedNode.id);
    if (nodeEl) {
        nodeEl.style.left = draggedNode.x + 'px';
        nodeEl.style.top = draggedNode.y + 'px';
    }
});

/**
 * Handle mouse up to stop dragging
 */
document.addEventListener('mouseup', () => {
    isDragging = false;
    draggedNode = null;
});

/**
 * Select node
 */
function selectNode(node) {
    selectedNode = node;

    // Update UI
    document.querySelectorAll('.canvas-node').forEach(el => {
        el.classList.remove('selected');
    });

    const nodeEl = document.getElementById(node.id);
    if (nodeEl) {
        nodeEl.classList.add('selected');
    }

    // Show properties
    showNodeProperties(node);
}

/**
 * Deselect node
 */
function deselectNode() {
    selectedNode = null;

    document.querySelectorAll('.canvas-node').forEach(el => {
        el.classList.remove('selected');
    });

    const propertiesContent = document.getElementById('properties-content');
    propertiesContent.innerHTML = '<p class="hint">Select a component to edit its properties</p>';
}

/**
 * Show node properties
 */
function showNodeProperties(node) {
    const propertiesContent = document.getElementById('properties-content');

    let configHTML = `
        <h4>${node.component.name}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
            ${node.component.description}
        </p>
    `;

    // Generate config fields based on schema
    if (node.component.config_schema && node.component.config_schema.properties) {
        configHTML += '<div class="config-fields">';

        for (const [key, schema] of Object.entries(node.component.config_schema.properties)) {
            const value = node.config[key] || schema.default || '';
            const required = node.component.config_schema.required?.includes(key);

            configHTML += `
                <div class="config-field" style="margin-bottom: 1rem;">
                    <label>${key}${required ? ' *' : ''}</label>
                    ${schema.description ? `<p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${schema.description}</p>` : ''}
            `;

            if (schema.enum) {
                configHTML += `
                    <select id="config_${key}" class="select-field" onchange="updateNodeConfig('${node.id}', '${key}', this.value)">
                        ${schema.enum.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                `;
            } else if (schema.type === 'number') {
                configHTML += `
                    <input type="number" id="config_${key}" class="input-field" value="${value}"
                           min="${schema.minimum || ''}" max="${schema.maximum || ''}"
                           onchange="updateNodeConfig('${node.id}', '${key}', parseFloat(this.value))">
                `;
            } else if (schema.type === 'boolean') {
                configHTML += `
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="config_${key}" ${value ? 'checked' : ''}
                               onchange="updateNodeConfig('${node.id}', '${key}', this.checked)">
                        <span>Enabled</span>
                    </label>
                `;
            } else {
                configHTML += `
                    <input type="text" id="config_${key}" class="input-field" value="${value}"
                           onchange="updateNodeConfig('${node.id}', '${key}', this.value)">
                `;
            }

            configHTML += '</div>';
        }

        configHTML += '</div>';
    }

    propertiesContent.innerHTML = configHTML;
}

/**
 * Update node configuration
 */
function updateNodeConfig(nodeId, key, value) {
    const node = canvasNodes.find(n => n.id === nodeId);
    if (node) {
        node.config[key] = value;
        console.log('Updated config:', node.config);
    }
}

/**
 * Delete node
 */
function deleteNode(nodeId) {
    if (!confirm('Delete this component?')) return;

    // Remove from array
    canvasNodes = canvasNodes.filter(n => n.id !== nodeId);

    // Remove from DOM
    const nodeEl = document.getElementById(nodeId);
    if (nodeEl) {
        nodeEl.remove();
    }

    // Deselect if was selected
    if (selectedNode && selectedNode.id === nodeId) {
        deselectNode();
    }
}

/**
 * Clear canvas
 */
function clearCanvas() {
    if (!confirm('Clear all components from canvas?')) return;

    canvasNodes = [];
    document.getElementById('canvas').innerHTML = '';
    deselectNode();
}

/**
 * Auto-layout nodes
 */
function autoLayout() {
    const padding = 50;
    const nodeWidth = 200;
    const nodeHeight = 120;
    const verticalSpacing = 150;

    let currentY = padding;

    // Layout triggers
    const triggers = canvasNodes.filter(n => n.category === 'trigger');
    triggers.forEach((node, idx) => {
        node.x = padding;
        node.y = currentY + (idx * verticalSpacing);
    });

    currentY += triggers.length * verticalSpacing + verticalSpacing;

    // Layout actions
    const actions = canvasNodes.filter(n => n.category === 'action');
    actions.forEach((node, idx) => {
        node.x = padding + nodeWidth + 100;
        node.y = padding + (idx * verticalSpacing);
    });

    // Layout conditions
    const conditions = canvasNodes.filter(n => n.category === 'condition');
    conditions.forEach((node, idx) => {
        node.x = padding + (nodeWidth + 100) * 2;
        node.y = padding + (idx * verticalSpacing);
    });

    // Re-render
    document.getElementById('canvas').innerHTML = '';
    canvasNodes.forEach(node => renderNode(node));
}
