import React, { useRef, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

const LogsPanel = ({ title, logs, type }) => {
  const logsRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = () => {
    return type === 'stderr' ? <AlertCircle size={16} /> : <FileText size={16} />;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-xs text-[var(--text-secondary)]">
          {logs.length} lines
        </span>
      </div>
      <div
        ref={logsRef}
        className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-2"
      >
        {logs.length === 0 ? (
          <div className="text-[var(--text-secondary)] text-xs p-2">
            {type === 'stderr' ? 'No errors' : 'No output yet'}
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`log-line ${type} flex gap-2`}
            >
              <span className="text-[var(--text-secondary)] min-w-[70px]">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className="flex-1 break-all">
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
