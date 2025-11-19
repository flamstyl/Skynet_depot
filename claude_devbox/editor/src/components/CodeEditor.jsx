import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, language, onChange, selectedFile }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco editor
    monaco.editor.defineTheme('devbox-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editorLineNumber.foreground': '#858585',
        'editorCursor.foreground': '#007acc',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    monaco.editor.setTheme('devbox-dark');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="text-sm font-semibold">
          {selectedFile || 'Untitled'}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">
          {language}
        </span>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme="devbox-dark"
          options={{
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            minimap: { enabled: true },
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'off',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'selection',
            bracketPairColorization: {
              enabled: true
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
