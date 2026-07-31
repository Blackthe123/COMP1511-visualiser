import React from 'react';

interface CodeViewerProps {
  codeSnippet: string;
  currentLine: number;
  onSnippetChange?: (type: 'insert' | 'delete' | 'free' | 'reverse' | 'find') => void;
  activeSnippetType?: 'insert' | 'delete' | 'free' | 'reverse' | 'find';
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ codeSnippet, currentLine, onSnippetChange, activeSnippetType }) => {
  const lines = codeSnippet.split('\n');

  return (
    <>
      <div className="code-viewer-header">
        <div 
          className={`code-tab ${activeSnippetType === 'insert' ? 'active' : ''}`}
          onClick={() => onSnippetChange?.('insert')}
        >
          insert_at_index
        </div>
        <div 
          className={`code-tab ${activeSnippetType === 'delete' ? 'active' : ''}`}
          onClick={() => onSnippetChange?.('delete')}
        >
          delete_node
        </div>
        <div 
          className={`code-tab ${activeSnippetType === 'free' ? 'active' : ''}`}
          onClick={() => onSnippetChange?.('free')}
        >
          free_list
        </div>
        <div 
          className={`code-tab ${activeSnippetType === 'reverse' ? 'active' : ''}`}
          onClick={() => onSnippetChange?.('reverse')}
        >
          reverse_list
        </div>
        <div 
          className={`code-tab ${activeSnippetType === 'find' ? 'active' : ''}`}
          onClick={() => onSnippetChange?.('find')}
        >
          find_node
        </div>
      </div>
      <div className="code-viewer">
      {lines.map((line, idx) => (
        <div key={idx} className={`code-line ${idx === currentLine ? 'active' : ''}`}>
          <span className="line-number">{idx + 1}</span>
          <span className="line-content" style={{ whiteSpace: 'pre' }}>
            {line}
          </span>
        </div>
      ))}
      </div>
    </>
  );
};
