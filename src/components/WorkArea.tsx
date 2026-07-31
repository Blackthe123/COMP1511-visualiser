import React, { useState, useRef } from 'react';
import type { LLNode, Variables } from '../state/types';

interface WorkAreaProps {
  nodes: LLNode[];
  variables: Variables;
  highlightedAddresses: string[];
  onNodeMove: (id: string, x: number, y: number) => void;
}

export const WorkArea: React.FC<WorkAreaProps> = ({ nodes, variables, highlightedAddresses, onNodeMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragging(id);
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - offset.x;
    const y = e.clientY - containerRect.top - offset.y;
    onNodeMove(dragging, x, y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      const target = e.currentTarget as HTMLDivElement;
      target.releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  // Helper to draw curved arrows between nodes
  const renderArrows = () => {
    return nodes.map(node => {
      if (!node.next || node.next === '?') return null;

      const isHighlighted = highlightedAddresses.includes(node.address);
      const startX = node.x + 67.5; // center of 'next' box (width 90, so 45 + 22.5)
      const startY = node.y + 60; // Bottom of node

      if (node.next === null) {
        // Draw arrow pointing to NULL text block just below it
        const endX = startX;
        const endY = startY + 25;
        const pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
        
        return (
          <React.Fragment key={`${node.address}-null`}>
            <path
              key={pathD} // forces re-render of marker
              className={`arrow-path ${isHighlighted ? 'highlighted' : ''}`}
              d={pathD}
              markerEnd={`url(#arrowhead${isHighlighted ? '-highlighted' : ''})`}
            />
            <rect x={endX - 25} y={endY} width="50" height="20" fill="var(--heap-bg)" rx="4" />
            <text x={endX} y={endY + 14} fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize="12px" textAnchor="middle">
              NULL
            </text>
          </React.Fragment>
        );
      }

      const targetNode = nodes.find(n => n.address === node.next);
      if (!targetNode) return null;

      const endX = targetNode.x + 45; // center of target node
      const endY = targetNode.y - 2; // Top of node, -2 to touch border exactly

      // Control points for a nice bezier curve
      const c1x = startX;
      const c1y = startY + 40;
      const c2x = endX;
      const c2y = endY - 40;

      const pathD = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
      
      return (
        <path
          key={`${node.address}-${node.next}-${pathD}`} // pathD included to force marker update on drag
          className={`arrow-path ${isHighlighted ? 'highlighted' : ''}`}
          d={pathD}
          markerEnd={`url(#arrowhead${isHighlighted ? '-highlighted' : ''})`}
        />
      );
    });
  };

  // Draw pointers for variables (head, curr, new_node, etc)
  const renderVariables = () => {
    return Object.entries(variables).map(([varName, address], index) => {
      if (!address) return null;
      const targetNode = nodes.find(n => n.address === address);
      if (!targetNode) return null;

      const startX = 50 + index * 100;
      const startY = 30;
      
      const endX = targetNode.x + 60;
      const endY = targetNode.y;

      const pathD = `M ${startX} ${startY} Q ${startX} ${endY - 50}, ${endX} ${endY}`;

      return (
        <React.Fragment key={`var-${varName}`}>
          <text x={startX} y={startY - 10} fill="var(--accent)" fontFamily="var(--font-mono)" fontSize="12px" textAnchor="middle">
            {varName}
          </text>
          <path
            className="arrow-path"
            stroke="var(--accent)"
            d={pathD}
            markerEnd="url(#arrowhead-var)"
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div 
      className="work-area" 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="arrows-layer">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
          </marker>
          <marker id="arrowhead-highlighted" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--node-highlight)" />
          </marker>
          <marker id="arrowhead-var" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
          </marker>
        </defs>
        {renderArrows()}
        {renderVariables()}
      </svg>

      {nodes.map(node => (
        <div
          key={node.id}
          className={`node ${highlightedAddresses.includes(node.address) ? 'highlighted' : ''}`}
          style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
          onPointerDown={(e) => handlePointerDown(e, node.id)}
        >
          <div className="node-header">{node.address}</div>
          <div className="node-body">
            <div className="node-value">{node.value}</div>
            <div className="node-next" style={{ fontSize: '0.7rem' }}>
              {node.next === '?' ? '?' : node.next === null ? 'NULL' : node.next}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
