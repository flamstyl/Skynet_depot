/**
 * Code Editor Component
 * Wraps Monaco Editor with DevBox-specific functionality
 */

class CodeEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.editor = null;
        this.language = options.language || 'python';
        this.theme = options.theme || 'vs-dark';
        this.onChangeCallback = options.onChange || null;
        this.onSaveCallback = options.onSave || null;
    }

    async init() {
        return new Promise((resolve) => {
            require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

            require(['vs/editor/editor.main'], () => {
                const container = document.getElementById(this.containerId);

                this.editor = monaco.editor.create(container, {
                    value: this.getDefaultCode(this.language),
                    language: this.language,
                    theme: this.theme,
                    automaticLayout: true,
                    fontSize: 14,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    snippetSuggestions: 'top',
                    tabSize: 4,
                    insertSpaces: true,
                    renderWhitespace: 'selection',
                    lineNumbers: 'on',
                    glyphMargin: true,
                    folding: true,
                    bracketPairColorization: {
                        enabled: true
                    }
                });

                // Set up event listeners
                this.editor.onDidChangeModelContent(() => {
                    if (this.onChangeCallback) {
                        this.onChangeCallback(this.getValue());
                    }
                    this.updateCursorPosition();
                });

                this.editor.onDidChangeCursorPosition(() => {
                    this.updateCursorPosition();
                });

                // Keyboard shortcuts
                this.editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                    () => {
                        if (this.onSaveCallback) {
                            this.onSaveCallback(this.getValue());
                        }
                    }
                );

                resolve(this.editor);
            });
        });
    }

    getDefaultCode(language) {
        const templates = {
            python: `# Claude DevBox - Python Example
import sys

def main():
    print("Hello from Claude DevBox!")
    print(f"Python version: {sys.version}")

if __name__ == "__main__":
    main()
`,
            javascript: `// Claude DevBox - JavaScript Example
console.log('Hello from Claude DevBox!');
console.log('Node.js version:', process.version);
`,
            typescript: `// Claude DevBox - TypeScript Example
function greet(name: string): void {
    console.log(\`Hello \${name} from Claude DevBox!\`);
}

greet('World');
`,
            java: `// Claude DevBox - Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Claude DevBox!");
    }
}
`,
            rust: `// Claude DevBox - Rust Example
fn main() {
    println!("Hello from Claude DevBox!");
}
`,
            go: `// Claude DevBox - Go Example
package main

import "fmt"

func main() {
    fmt.Println("Hello from Claude DevBox!")
}
`,
            cpp: `// Claude DevBox - C++ Example
#include <iostream>

int main() {
    std::cout << "Hello from Claude DevBox!" << std::endl;
    return 0;
}
`,
            csharp: `// Claude DevBox - C# Example
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from Claude DevBox!");
    }
}
`
        };

        return templates[language] || `// Welcome to Claude DevBox\n\n`;
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setValue(code) {
        if (this.editor) {
            this.editor.setValue(code);
        }
    }

    setLanguage(language) {
        if (this.editor) {
            this.language = language;
            const model = this.editor.getModel();
            monaco.editor.setModelLanguage(model, language);
        }
    }

    format() {
        if (this.editor) {
            this.editor.getAction('editor.action.formatDocument').run();
        }
    }

    updateCursorPosition() {
        if (!this.editor) return;

        const position = this.editor.getPosition();
        const cursorElement = document.getElementById('cursorPosition');
        if (cursorElement) {
            cursorElement.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
        }
    }

    setTheme(theme) {
        if (this.editor) {
            this.theme = theme;
            monaco.editor.setTheme(theme);
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
    }

    // Error markers
    setErrors(errors) {
        if (!this.editor) return;

        const model = this.editor.getModel();
        const markers = errors.map(error => ({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: error.line || 1,
            startColumn: error.column || 1,
            endLineNumber: error.line || 1,
            endColumn: error.column ? error.column + (error.length || 10) : 100,
            message: error.message
        }));

        monaco.editor.setModelMarkers(model, 'devbox', markers);
    }

    clearErrors() {
        if (!this.editor) return;
        const model = this.editor.getModel();
        monaco.editor.setModelMarkers(model, 'devbox', []);
    }

    // Decorations
    highlightLine(lineNumber, className = 'errorLine') {
        if (!this.editor) return;

        const decorations = this.editor.deltaDecorations([], [
            {
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                    isWholeLine: true,
                    className: className,
                    glyphMarginClassName: 'errorGlyph'
                }
            }
        ]);

        return decorations;
    }

    clearDecorations(decorations) {
        if (this.editor && decorations) {
            this.editor.deltaDecorations(decorations, []);
        }
    }
}

export default CodeEditor;
