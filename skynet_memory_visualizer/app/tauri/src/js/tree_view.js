/**
 * Tree View - Document browser functionality
 * Skynet Memory Visualizer
 */

// Tree view specific utilities and helper functions

class TreeViewManager {
    constructor() {
        this.currentTree = null;
        this.selectedNode = null;
        this.expandedNodes = new Set();
    }

    // Build tree structure from flat file list
    buildTree(files) {
        const root = [];
        const pathMap = new Map();

        files.forEach(file => {
            const parts = file.path.split('/').filter(p => p);
            let current = root;
            let currentPath = '';

            parts.forEach((part, index) => {
                currentPath += '/' + part;
                const isLast = index === parts.length - 1;

                let node = pathMap.get(currentPath);

                if (!node) {
                    node = {
                        name: part,
                        path: currentPath,
                        type: isLast ? 'file' : 'directory',
                        children: []
                    };

                    if (isLast && file.size) {
                        node.size = file.size;
                        node.modified = file.modified;
                    }

                    pathMap.set(currentPath, node);
                    current.push(node);
                }

                if (!isLast) {
                    current = node.children;
                }
            });
        });

        return root;
    }

    // Sort nodes
    sortNodes(nodes, sortBy = 'name') {
        const sorted = [...nodes];

        sorted.sort((a, b) => {
            // Directories first
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;

            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'modified':
                    return new Date(b.modified || 0) - new Date(a.modified || 0);
                case 'size':
                    return (b.size || 0) - (a.size || 0);
                case 'type':
                    const extA = a.name.split('.').pop();
                    const extB = b.name.split('.').pop();
                    return extA.localeCompare(extB);
                default:
                    return 0;
            }
        });

        // Recursively sort children
        sorted.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children = this.sortNodes(node.children, sortBy);
            }
        });

        return sorted;
    }

    // Filter tree by query
    filterTree(nodes, query) {
        if (!query) return nodes;

        const filtered = [];

        nodes.forEach(node => {
            const matches = node.name.toLowerCase().includes(query.toLowerCase());
            const children = node.children ? this.filterTree(node.children, query) : [];

            if (matches || children.length > 0) {
                filtered.push({
                    ...node,
                    children
                });
            }
        });

        return filtered;
    }

    // Get node icon based on file type
    getIcon(node) {
        if (node.type === 'directory') {
            return this.expandedNodes.has(node.path) ? '📂' : '📁';
        }

        const ext = node.name.split('.').pop().toLowerCase();
        const iconMap = {
            'md': '📝',
            'markdown': '📝',
            'txt': '📄',
            'json': '🔧',
            'js': '📜',
            'py': '🐍',
            'rs': '🦀',
            'ts': '📘',
            'html': '🌐',
            'css': '🎨',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'gif': '🖼️',
            'svg': '🖼️',
            'pdf': '📕',
            'zip': '📦',
            'tar': '📦',
            'gz': '📦'
        };

        return iconMap[ext] || '📄';
    }

    // Expand node
    expand(nodePath) {
        this.expandedNodes.add(nodePath);
    }

    // Collapse node
    collapse(nodePath) {
        this.expandedNodes.delete(nodePath);
    }

    // Toggle node expansion
    toggle(nodePath) {
        if (this.expandedNodes.has(nodePath)) {
            this.collapse(nodePath);
        } else {
            this.expand(nodePath);
        }
    }

    // Expand all nodes
    expandAll(nodes) {
        nodes.forEach(node => {
            if (node.type === 'directory') {
                this.expand(node.path);
                if (node.children) {
                    this.expandAll(node.children);
                }
            }
        });
    }

    // Collapse all nodes
    collapseAll() {
        this.expandedNodes.clear();
    }

    // Get breadcrumb for path
    getBreadcrumb(path) {
        const parts = path.split('/').filter(p => p);
        const breadcrumb = [];
        let current = '';

        parts.forEach(part => {
            current += '/' + part;
            breadcrumb.push({
                name: part,
                path: current
            });
        });

        return breadcrumb;
    }
}

// Create global instance
const treeManager = new TreeViewManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TreeViewManager;
}
