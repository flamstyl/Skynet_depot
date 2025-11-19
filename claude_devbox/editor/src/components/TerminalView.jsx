import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

const TerminalView = ({ logs }) => {
  const terminalRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type) => {
    const colors = {
      'info': 'text-[var(--accent-blue)]',
      'success': 'text-[var(--accent-green)]',
      'warning': 'text-[var(--accent-yellow)]',
      'error': 'text-[var(--accent-red)]'
    };
    return colors[type] || 'text-[var(--text-primary)]';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Terminal size={16} />
          <span className="text-sm font-semibold">Docker Console</span>
        </div>
        <span className="text-xs text-[var(--text-secondary)]">
          {logs.length} lines
        </span>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-2 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-[var(--text-secondary)] p-2">
            No logs yet. Run some code to see output here.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="py-0.5 flex gap-2">
              <span className="text-[var(--text-secondary)] min-w-[60px]">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className={getLogColor(log.type)}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TerminalView;
