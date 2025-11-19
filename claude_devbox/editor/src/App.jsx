import React, { useState, useEffect, useRef } from 'react';
import FileTree from './components/FileTree';
import CodeEditor from './components/CodeEditor';
import TerminalView from './components/TerminalView';
import LogsPanel from './components/LogsPanel';
import StatusBar from './components/StatusBar';
import { Play, Bug, Save, FolderOpen } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [stdout, setStdout] = useState([]);
  const [stderr, setStderr] = useState([]);
  const [dockerLogs, setDockerLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState('idle'); // idle, running, success, error
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket for live logs
    connectWebSocket();

    // Load workspace files
    loadWorkspace();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        addLog('info', 'Connected to DevBox backend');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLog('error', 'WebSocket connection error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        addLog('warning', 'Disconnected from backend');
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'stdout':
        setStdout(prev => [...prev, { text: data.message, timestamp: Date.now() }]);
        break;
      case 'stderr':
        setStderr(prev => [...prev, { text: data.message, timestamp: Date.now() }]);
        break;
      case 'docker_log':
        setDockerLogs(prev => [...prev, { text: data.message, timestamp: Date.now() }]);
        break;
      case 'status':
        setRunStatus(data.status);
        break;
      case 'execution_complete':
        setIsRunning(false);
        handleExecutionComplete(data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addLog = (type, message) => {
    setDockerLogs(prev => [...prev, {
      text: message,
      type,
      timestamp: Date.now()
    }]);
  };

  const loadWorkspace = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/workspace/files`);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Failed to load workspace:', error);
      addLog('error', 'Failed to load workspace files');
    }
  };

  const handleRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setRunStatus('running');
    setStdout([]);
    setStderr([]);
    setDockerLogs([]);
    addLog('info', `Running ${selectedFile || 'code'}...`);

    try {
      await axios.post(`${API_URL}/api/run`, {
        code,
        language,
        filename: selectedFile,
        autoFix: autoFixEnabled
      });

      addLog('success', 'Execution request sent');
    } catch (error) {
      console.error('Execution failed:', error);
      addLog('error', `Execution failed: ${error.message}`);
      setIsRunning(false);
      setRunStatus('error');
    }
  };

  const handleAutoFix = async () => {
    if (stderr.length === 0) {
      addLog('warning', 'No errors to fix');
      return;
    }

    addLog('info', 'Requesting Claude to fix errors...');

    try {
      const response = await axios.post(`${API_URL}/api/autofix`, {
        code,
        stderr: stderr.map(e => e.text).join('\n'),
        language
      });

      if (response.data.fixedCode) {
        setCode(response.data.fixedCode);
        addLog('success', 'Code fixed by Claude, re-running...');

        // Auto re-run
        setTimeout(() => handleRun(), 1000);
      }
    } catch (error) {
      console.error('AutoFix failed:', error);
      addLog('error', `AutoFix failed: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      addLog('warning', 'No file selected to save');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/workspace/save`, {
        filename: selectedFile,
        content: code
      });
      addLog('success', `Saved ${selectedFile}`);
    } catch (error) {
      console.error('Save failed:', error);
      addLog('error', `Save failed: ${error.message}`);
    }
  };

  const handleExecutionComplete = (data) => {
    if (data.exitCode === 0 && data.stderr === '') {
      setRunStatus('success');
      addLog('success', `✓ Execution completed successfully (${data.duration}ms)`);
    } else {
      setRunStatus('error');
      addLog('error', `✗ Execution failed with exit code ${data.exitCode}`);

      // Auto-fix if enabled
      if (autoFixEnabled && data.stderr) {
        setTimeout(() => handleAutoFix(), 1500);
      }
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file.path);
    loadFileContent(file.path);
  };

  const loadFileContent = async (filepath) => {
    try {
      const response = await axios.get(`${API_URL}/api/workspace/file?path=${filepath}`);
      setCode(response.data.content);

      // Detect language from extension
      const ext = filepath.split('.').pop();
      const langMap = {
        'py': 'python',
        'js': 'javascript',
        'ts': 'typescript',
        'jsx': 'javascript',
        'tsx': 'typescript',
        'rs': 'rust',
        'go': 'go',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'rb': 'ruby',
        'php': 'php',
        'sh': 'shell'
      };
      setLanguage(langMap[ext] || 'plaintext');
    } catch (error) {
      console.error('Failed to load file:', error);
      addLog('error', `Failed to load ${filepath}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-[var(--accent-blue)]">
            ⚡ Claude DevBox
          </h1>
          <span className="text-xs text-[var(--text-secondary)]">
            Skynet Autonomous Development Environment
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="btn btn-primary flex items-center gap-2"
          >
            <Play size={16} />
            Run
          </button>

          <button
            onClick={handleAutoFix}
            disabled={isRunning || stderr.length === 0}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Bug size={16} />
            Auto-Fix
          </button>

          <button
            onClick={handleSave}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Save size={16} />
            Save
          </button>

          <button
            onClick={loadWorkspace}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FolderOpen size={16} />
            Refresh
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoFixEnabled}
              onChange={(e) => setAutoFixEnabled(e.target.checked)}
            />
            Auto-Fix on Error
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <div className="w-64 border-r border-[var(--border-color)] overflow-y-auto">
          <FileTree
            files={files}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col">
          <CodeEditor
            code={code}
            language={language}
            onChange={setCode}
            selectedFile={selectedFile}
          />
        </div>

        {/* Right Sidebar - Outputs */}
        <div className="w-96 border-l border-[var(--border-color)] flex flex-col">
          {/* Terminal */}
          <div className="h-1/3 border-b border-[var(--border-color)]">
            <TerminalView logs={dockerLogs} />
          </div>

          {/* Stdout */}
          <div className="h-1/3 border-b border-[var(--border-color)]">
            <LogsPanel
              title="Output (stdout)"
              logs={stdout}
              type="stdout"
            />
          </div>

          {/* Stderr */}
          <div className="h-1/3">
            <LogsPanel
              title="Errors (stderr)"
              logs={stderr}
              type="stderr"
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        runStatus={runStatus}
        isRunning={isRunning}
        language={language}
        selectedFile={selectedFile}
      />
    </div>
  );
}

export default App;
