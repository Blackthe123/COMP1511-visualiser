import React from 'react';
import type { LLNode, Variables } from '../state/types';

interface HeapAreaProps {
  nodes: LLNode[];
  variables: Variables;
  highlightedAddresses: string[];
}

export const HeapArea: React.FC<HeapAreaProps> = ({ nodes, highlightedAddresses }) => {
  return (
    <div className="heap-area">
      {nodes.map(node => (
        <div 
          key={node.address} 
          className={`heap-node ${highlightedAddresses.includes(node.address) ? 'highlighted' : ''}`}
        >
          <div className="heap-header">{node.address}</div>
          <div className="heap-row">
            <span className="heap-label">value:</span>
            <span>{node.value}</span>
          </div>
          <div className="heap-row">
            <span className="heap-label">next:</span>
            <span>{node.next || 'NULL'}</span>
          </div>
        </div>
      ))}
      {nodes.length === 0 && (
        <div style={{ color: 'var(--text-secondary)' }}>Heap is empty.</div>
      )}
    </div>
  );
};
