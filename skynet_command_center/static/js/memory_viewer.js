/**
 * Skynet Command Center - Memory Viewer
 * ======================================
 * Handles memory exploration and tree viewing
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[MEMORY] Initializing...');

    loadMemory();

    // Button handlers
    document.getElementById('sync-memory').addEventListener('click', syncMemory);
    document.getElementById('refresh-memory').addEventListener('click', loadMemory);
});

/**
 * Load memory tree and stats
 */
async function loadMemory() {
    try {
        const response = await fetch('/api/memory/tree');
        const data = await response.json();

        if (data.success) {
            updateStats(data.stats);
            renderTree(data.tree);
        } else {
            console.error('[MEMORY] Error:', data.error);
        }
    } catch (error) {
        console.error('[MEMORY] Fetch error:', error);
    }
}

/**
 * Update memory stats
 */
function updateStats(stats) {
    document.getElementById('total-files').textContent = stats.total_files;
    document.getElementById('total-size').textContent = formatSize(stats.total_size);
    document.getElementById('last-updated').textContent = formatTime(stats.last_updated);
}

/**
 * Render memory tree
 */
function renderTree(tree) {
    const container = document.getElementById('memory-tree');

    if (!tree || !tree.children || tree.children.length === 0) {
        container.innerHTML = '<p class="loading">No files in memory</p>';
        return;
    }

    container.innerHTML = '';
    renderNode(tree, container, 0);
}

/**
 * Render tree node
 */
function renderNode(node, parent, level) {
    if (level > 5) return; // Max depth

    const indent = '  '.repeat(level);

    if (node.type === 'directory') {
        const line = document.createElement('div');
        line.textContent = `${indent}📁 ${node.name}/`;
        line.style.color = 'var(--accent)';
        line.style.cursor = 'pointer';
        line.style.marginBottom = '4px';

        parent.appendChild(line);

        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.style.display = 'block';

            node.children.forEach(child => {
                renderNode(child, childrenContainer, level + 1);
            });

            parent.appendChild(childrenContainer);

            // Toggle expand/collapse
            line.addEventListener('click', function() {
                childrenContainer.style.display =
                    childrenContainer.style.display === 'none' ? 'block' : 'none';
            });
        }
    } else {
        const line = document.createElement('div');
        const sizeText = node.size ? ` (${formatSize(node.size)})` : '';
        line.textContent = `${indent}📄 ${node.name}${sizeText}`;
        line.style.color = 'var(--text-primary)';
        line.style.marginBottom = '4px';
        parent.appendChild(line);
    }
}

/**
 * Sync memory
 */
async function syncMemory() {
    const btn = document.getElementById('sync-memory');
    btn.textContent = 'Syncing...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/memory/sync', { method: 'POST' });
        const result = await response.json();

        alert(result.message);
        loadMemory();
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        btn.textContent = 'Sync Memory';
        btn.disabled = false;
    }
}

/**
 * Format size
 */
function formatSize(bytes) {
    if (!bytes) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format time
 */
function formatTime(timestamp) {
    if (!timestamp || timestamp === 'Never') return 'Never';

    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return timestamp;
    }
}
