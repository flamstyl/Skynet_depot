/**
 * Editor - Document editing utilities
 * Skynet Memory Visualizer
 */

class EditorManager {
    constructor() {
        this.editor = null;
        this.currentDoc = null;
        this.isDirty = false;
        this.autoSaveTimer = null;
    }

    // Initialize editor
    init(editorElement) {
        this.editor = editorElement;
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
    }

    // Setup auto-save
    setupAutoSave(delay = 3000) {
        if (!this.editor) return;

        this.editor.addEventListener('input', () => {
            this.isDirty = true;
            clearTimeout(this.autoSaveTimer);

            this.autoSaveTimer = setTimeout(() => {
                this.save();
            }, delay);
        });
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        if (!this.editor) return;

        this.editor.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }

            // Ctrl/Cmd + B: Bold
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.formatBold();
            }

            // Ctrl/Cmd + I: Italic
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.formatItalic();
            }

            // Ctrl/Cmd + K: Insert link
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.insertLink();
            }
        });
    }

    // Save document
    async save() {
        // TODO: Implement actual save logic
        console.log('Saving document...');
        this.isDirty = false;
    }

    // Get selected text
    getSelection() {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const text = this.editor.value;

        return {
            text: text.substring(start, end),
            start,
            end
        };
    }

    // Replace selection
    replaceSelection(newText) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const text = this.editor.value;

        this.editor.value = text.substring(0, start) + newText + text.substring(end);
        this.editor.selectionStart = start;
        this.editor.selectionEnd = start + newText.length;
        this.editor.focus();
    }

    // Wrap selection with markers
    wrapSelection(before, after = before) {
        const selection = this.getSelection();
        const wrapped = before + selection.text + after;
        this.replaceSelection(wrapped);
    }

    // === Formatting Functions ===

    formatBold() {
        this.wrapSelection('**');
    }

    formatItalic() {
        this.wrapSelection('*');
    }

    formatCode() {
        this.wrapSelection('`');
    }

    formatCodeBlock() {
        this.wrapSelection('```\n', '\n```');
    }

    insertHeading(level = 2) {
        const selection = this.getSelection();
        const prefix = '#'.repeat(level) + ' ';
        this.replaceSelection(prefix + selection.text);
    }

    insertList() {
        const selection = this.getSelection();
        const lines = selection.text.split('\n');
        const formatted = lines.map(line => '- ' + line).join('\n');
        this.replaceSelection(formatted);
    }

    insertOrderedList() {
        const selection = this.getSelection();
        const lines = selection.text.split('\n');
        const formatted = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
        this.replaceSelection(formatted);
    }

    insertLink() {
        const selection = this.getSelection();
        const url = prompt('Enter URL:');
        if (url) {
            const link = `[${selection.text || 'Link'}](${url})`;
            this.replaceSelection(link);
        }
    }

    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            const alt = prompt('Enter alt text (optional):') || 'Image';
            const image = `![${alt}](${url})`;
            this.replaceSelection(image);
        }
    }

    insertTable(rows = 3, cols = 3) {
        let table = '|';
        for (let i = 0; i < cols; i++) {
            table += ' Header |';
        }
        table += '\n|';
        for (let i = 0; i < cols; i++) {
            table += ' ------ |';
        }
        for (let r = 0; r < rows; r++) {
            table += '\n|';
            for (let c = 0; c < cols; c++) {
                table += ' Cell |';
            }
        }
        this.replaceSelection(table);
    }

    // === Statistics ===

    getStats() {
        const text = this.editor.value;
        const lines = text.split('\n').length;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;

        return {
            lines,
            words,
            chars,
            charsNoSpaces
        };
    }

    // === Search & Replace ===

    find(query, caseSensitive = false) {
        const text = this.editor.value;
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        const matches = [];

        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                text: match[0],
                index: match.index
            });
        }

        return matches;
    }

    replace(query, replacement, all = false) {
        const text = this.editor.value;
        const flags = all ? 'g' : '';
        const regex = new RegExp(query, flags);
        this.editor.value = text.replace(regex, replacement);
    }

    // === Undo/Redo ===

    undo() {
        document.execCommand('undo');
    }

    redo() {
        document.execCommand('redo');
    }
}

// Create global instance
const editorManager = new EditorManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorManager;
}
