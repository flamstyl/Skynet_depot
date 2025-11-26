/**
 * File Tree Component
 * Displays workspace directory structure
 */

class FileTree {
    constructor(containerId, apiClient, onFileSelect) {
        this.containerId = containerId;
        this.apiClient = apiClient;
        this.onFileSelect = onFileSelect;
        this.currentPath = '/workspace';
        this.selectedFile = null;
    }

    async init() {
        await this.loadFiles(this.currentPath);
    }

    async loadFiles(path = '/workspace') {
        try {
            const data = await this.apiClient.listFiles(path);
            this.render(data.files);
        } catch (error) {
            console.error('Failed to load files:', error);
            this.renderError(error.message);
        }
    }

    render(files) {
        const container = document.getElementById(this.containerId);
        container.innerHTML = '';

        if (!files || files.length === 0) {
            container.innerHTML = '<div style="padding: 12px; color: #858585; font-size: 13px;">No files in workspace</div>';
            return;
        }

        // Sort: directories first, then files
        const sorted = files.sort((a, b) => {
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });

        sorted.forEach(file => {
            const item = this.createFileItem(file);
            container.appendChild(item);
        });
    }

    createFileItem(file) {
        const item = document.createElement('div');
        item.className = 'file-tree-item';
        item.dataset.path = file.path;
        item.dataset.type = file.type;

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = this.getIcon(file);
        item.appendChild(icon);

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = file.name;
        item.appendChild(name);

        if (file.type === 'directory') {
            const childCount = document.createElement('span');
            childCount.style.marginLeft = 'auto';
            childCount.style.color = '#858585';
            childCount.style.fontSize = '12px';
            childCount.textContent = file.children || '';
            item.appendChild(childCount);
        }

        item.addEventListener('click', () => this.handleItemClick(file, item));

        return item;
    }

    async handleItemClick(file, element) {
        if (file.type === 'directory') {
            // Navigate into directory
            await this.loadFiles(file.path);
        } else {
            // Select file
            this.selectFile(file, element);

            // Load file content
            try {
                const data = await this.apiClient.readFile(file.path);
                if (this.onFileSelect) {
                    this.onFileSelect(file, data.content);
                }
            } catch (error) {
                console.error('Failed to read file:', error);
            }
        }
    }

    selectFile(file, element) {
        // Remove previous selection
        const previousSelected = document.querySelector('.file-tree-item.active');
        if (previousSelected) {
            previousSelected.classList.remove('active');
        }

        // Add selection
        element.classList.add('active');
        this.selectedFile = file;
    }

    getIcon(file) {
        if (file.type === 'directory') {
            return '📁';
        }

        const ext = file.name.split('.').pop().toLowerCase();
        const icons = {
            py: '🐍',
            js: '📜',
            ts: '📘',
            jsx: '⚛️',
            tsx: '⚛️',
            html: '🌐',
            css: '🎨',
            json: '📋',
            md: '📝',
            txt: '📄',
            yml: '⚙️',
            yaml: '⚙️',
            xml: '📰',
            sh: '🔧',
            bat: '🔧',
            rs: '🦀',
            go: '🐹',
            java: '☕',
            cpp: '⚙️',
            c: '⚙️',
            cs: '🔷',
            rb: '💎',
            php: '🐘',
            sql: '🗄️',
            dockerfile: '🐳',
            gitignore: '🔀',
            env: '🔐'
        };

        return icons[ext] || '📄';
    }

    renderError(message) {
        const container = document.getElementById(this.containerId);
        container.innerHTML = `
            <div style="padding: 12px; color: #f48771; font-size: 13px;">
                ✗ Error: ${message}
            </div>
        `;
    }

    async refresh() {
        await this.loadFiles(this.currentPath);
    }

    async createFile(name) {
        const path = `${this.currentPath}/${name}`;
        try {
            await this.apiClient.writeFile(path, '');
            await this.refresh();
            return path;
        } catch (error) {
            console.error('Failed to create file:', error);
            throw error;
        }
    }

    async deleteFile(path) {
        try {
            await this.apiClient.deleteFile(path);
            await this.refresh();
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }

    getCurrentPath() {
        return this.currentPath;
    }

    getSelectedFile() {
        return this.selectedFile;
    }
}

export default FileTree;
