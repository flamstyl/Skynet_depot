import React from 'react';
import { Circle, CheckCircle, XCircle, Loader } from 'lucide-react';

const StatusBar = ({ runStatus, isRunning, language, selectedFile }) => {
  const getStatusIcon = () => {
    if (isRunning) {
      return <Loader size={14} className="animate-spin text-[var(--accent-blue)]" />;
    }

    switch (runStatus) {
      case 'success':
        return <CheckCircle size={14} className="text-[var(--accent-green)]" />;
      case 'error':
        return <XCircle size={14} className="text-[var(--accent-red)]" />;
      default:
        return <Circle size={14} className="text-[var(--text-secondary)]" />;
    }
  };

  const getStatusText = () => {
    if (isRunning) return 'Running...';

    switch (runStatus) {
      case 'success':
        return 'Execution successful';
      case 'error':
        return 'Execution failed';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>

        {selectedFile && (
          <div className="text-[var(--text-secondary)]">
            {selectedFile}
          </div>
        )}

        <div className="text-[var(--text-secondary)]">
          Language: <span className="text-[var(--accent-blue)]">{language}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[var(--text-secondary)]">
        <div>
          Backend: <span className="text-[var(--accent-green)]">Connected</span>
        </div>
        <div>
          Docker: <span className="text-[var(--accent-green)]">Ready</span>
        </div>
        <div>
          Claude DevBox v1.0.0
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
