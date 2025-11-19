/**
 * Compare - Version comparison utilities
 * Skynet Memory Visualizer
 */

class CompareManager {
    constructor() {
        this.diffCache = new Map();
    }

    // Simple diff algorithm (line-by-line)
    diff(textA, textB) {
        const linesA = textA.split('\n');
        const linesB = textB.split('\n');

        const result = {
            changes: [],
            stats: {
                lines_added: 0,
                lines_removed: 0,
                lines_changed: 0,
                chars_changed: 0
            }
        };

        const maxLines = Math.max(linesA.length, linesB.length);

        for (let i = 0; i < maxLines; i++) {
            const lineA = linesA[i] !== undefined ? linesA[i] : null;
            const lineB = linesB[i] !== undefined ? linesB[i] : null;

            if (lineA === null) {
                // Line added
                result.changes.push({
                    type: 'added',
                    lineNum: i + 1,
                    contentA: '',
                    contentB: lineB
                });
                result.stats.lines_added++;
            } else if (lineB === null) {
                // Line removed
                result.changes.push({
                    type: 'removed',
                    lineNum: i + 1,
                    contentA: lineA,
                    contentB: ''
                });
                result.stats.lines_removed++;
            } else if (lineA !== lineB) {
                // Line modified
                result.changes.push({
                    type: 'modified',
                    lineNum: i + 1,
                    contentA: lineA,
                    contentB: lineB
                });
                result.stats.lines_changed++;

                // Character-level diff
                const charDiff = this.characterDiff(lineA, lineB);
                result.stats.chars_changed += charDiff;
            } else {
                // Line unchanged
                result.changes.push({
                    type: 'unchanged',
                    lineNum: i + 1,
                    contentA: lineA,
                    contentB: lineB
                });
            }
        }

        return result;
    }

    // Character-level diff count
    characterDiff(strA, strB) {
        let changes = 0;
        const maxLen = Math.max(strA.length, strB.length);

        for (let i = 0; i < maxLen; i++) {
            if (strA[i] !== strB[i]) {
                changes++;
            }
        }

        return changes;
    }

    // Generate unified diff format
    unifiedDiff(textA, textB, contextLines = 3) {
        const linesA = textA.split('\n');
        const linesB = textB.split('\n');
        const diff = this.diff(textA, textB);

        let unified = '';
        let inChunk = false;
        let chunkStart = 0;
        let chunkLinesA = 0;
        let chunkLinesB = 0;
        let chunkContent = [];

        diff.changes.forEach((change, index) => {
            if (change.type !== 'unchanged') {
                if (!inChunk) {
                    // Start new chunk
                    inChunk = true;
                    chunkStart = Math.max(0, index - contextLines);
                    chunkContent = [];

                    // Add context before
                    for (let i = chunkStart; i < index; i++) {
                        const ctx = diff.changes[i];
                        chunkContent.push(` ${ctx.contentA}`);
                        chunkLinesA++;
                        chunkLinesB++;
                    }
                }

                // Add change
                if (change.type === 'added') {
                    chunkContent.push(`+${change.contentB}`);
                    chunkLinesB++;
                } else if (change.type === 'removed') {
                    chunkContent.push(`-${change.contentA}`);
                    chunkLinesA++;
                } else if (change.type === 'modified') {
                    chunkContent.push(`-${change.contentA}`);
                    chunkContent.push(`+${change.contentB}`);
                    chunkLinesA++;
                    chunkLinesB++;
                }
            } else if (inChunk) {
                // Add context after change
                chunkContent.push(` ${change.contentA}`);
                chunkLinesA++;
                chunkLinesB++;

                // Check if we should close chunk
                const nextChange = diff.changes[index + 1];
                if (!nextChange || nextChange.type === 'unchanged') {
                    // Close chunk
                    unified += `@@ -${chunkStart + 1},${chunkLinesA} +${chunkStart + 1},${chunkLinesB} @@\n`;
                    unified += chunkContent.join('\n') + '\n';

                    inChunk = false;
                    chunkLinesA = 0;
                    chunkLinesB = 0;
                }
            }
        });

        return unified;
    }

    // Highlight changes within a line (character-level)
    highlightLineChanges(lineA, lineB) {
        const highlighted = {
            a: [],
            b: []
        };

        const maxLen = Math.max(lineA.length, lineB.length);

        for (let i = 0; i < maxLen; i++) {
            const charA = lineA[i] || '';
            const charB = lineB[i] || '';

            if (charA === charB) {
                highlighted.a.push({ char: charA, changed: false });
                highlighted.b.push({ char: charB, changed: false });
            } else {
                highlighted.a.push({ char: charA, changed: true });
                highlighted.b.push({ char: charB, changed: true });
            }
        }

        return highlighted;
    }

    // Format diff for display
    formatDiff(diff, format = 'side-by-side') {
        if (format === 'unified') {
            return this.formatUnified(diff);
        } else {
            return this.formatSideBySide(diff);
        }
    }

    formatSideBySide(diff) {
        const html = {
            left: [],
            right: []
        };

        diff.changes.forEach(change => {
            const cssClass = `diff-line-${change.type}`;

            html.left.push({
                lineNum: change.lineNum,
                content: change.contentA,
                class: cssClass
            });

            html.right.push({
                lineNum: change.lineNum,
                content: change.contentB,
                class: cssClass
            });
        });

        return html;
    }

    formatUnified(diff) {
        const html = [];

        diff.changes.forEach(change => {
            if (change.type === 'unchanged') return;

            const cssClass = `diff-line-${change.type}`;
            const prefix = change.type === 'added' ? '+' : (change.type === 'removed' ? '-' : '~');

            html.push({
                lineNum: change.lineNum,
                content: prefix + (change.contentB || change.contentA),
                class: cssClass
            });
        });

        return html;
    }

    // Calculate similarity percentage
    similarity(textA, textB) {
        const linesA = textA.split('\n');
        const linesB = textB.split('\n');

        let matching = 0;
        const maxLines = Math.max(linesA.length, linesB.length);

        for (let i = 0; i < maxLines; i++) {
            if (linesA[i] === linesB[i]) {
                matching++;
            }
        }

        return (matching / maxLines) * 100;
    }

    // Export diff to various formats
    exportDiff(diff, format = 'text') {
        switch (format) {
            case 'json':
                return JSON.stringify(diff, null, 2);
            case 'patch':
                return this.toPatchFormat(diff);
            case 'html':
                return this.toHTML(diff);
            default:
                return this.toText(diff);
        }
    }

    toText(diff) {
        let text = `Diff Summary\n`;
        text += `============\n`;
        text += `Lines added: ${diff.stats.lines_added}\n`;
        text += `Lines removed: ${diff.stats.lines_removed}\n`;
        text += `Lines changed: ${diff.stats.lines_changed}\n`;
        text += `Characters changed: ${diff.stats.chars_changed}\n\n`;

        diff.changes.forEach(change => {
            if (change.type !== 'unchanged') {
                text += `Line ${change.lineNum}: ${change.type}\n`;
                if (change.contentA) text += `  - ${change.contentA}\n`;
                if (change.contentB) text += `  + ${change.contentB}\n`;
            }
        });

        return text;
    }

    toPatchFormat(diff) {
        let patch = '';
        diff.changes.forEach(change => {
            if (change.type === 'removed') {
                patch += `- ${change.contentA}\n`;
            } else if (change.type === 'added') {
                patch += `+ ${change.contentB}\n`;
            }
        });
        return patch;
    }

    toHTML(diff) {
        let html = '<div class="diff-viewer">';
        diff.changes.forEach(change => {
            html += `<div class="diff-line diff-line-${change.type}">`;
            html += `<span class="line-num">${change.lineNum}</span>`;
            html += `<span class="line-content">${this.escapeHTML(change.contentB || change.contentA)}</span>`;
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
const compareManager = new CompareManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompareManager;
}
