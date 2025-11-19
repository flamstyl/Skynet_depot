import React, { useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';

const FileTree = ({ files, onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (items, level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isSelected = selectedFile === item.path;

      if (item.type === 'folder') {
        return (
          <div key={item.path}>
            <div
              className={`file-tree-item flex items-center gap-1 ${isSelected ? 'selected' : ''}`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => toggleFolder(item.path)}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="text-[var(--accent-blue)]" />
              <span>{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div>
                {renderTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={item.path}
          className={`file-tree-item flex items-center gap-1 ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16 + 24}px` }}
          onClick={() => onFileSelect(item)}
        >
          <File size={16} className="text-[var(--accent-green)]" />
          <span>{item.name}</span>
        </div>
      );
    });
  };

  return (
    <div className="p-2">
      <div className="panel-header text-sm font-semibold mb-2">
        Workspace Files
      </div>
      <div className="space-y-0.5">
        {files.length === 0 ? (
          <div className="text-[var(--text-secondary)] text-sm p-2">
            No files in workspace
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};

export default FileTree;
