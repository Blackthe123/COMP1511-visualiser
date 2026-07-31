import React, { useState, useEffect, useRef } from 'react';
import { WorkArea } from './components/WorkArea';
import { HeapArea } from './components/HeapArea';
import { CodeViewer } from './components/CodeViewer';
import type { LLNode, Variables, Frame } from './state/types';
import { CODE_INSERT, CODE_DELETE, CODE_FREE, CODE_REVERSE, CODE_FIND } from './state/types';
import { generateInsertFrames, generateDeleteFrames, generateFreeFrames, generateReverseFrames, generateFindFrames } from './state/engine';

export default function App() {
  const [nodes, setNodes] = useState<LLNode[]>([]);
  const [variables] = useState<Variables>({ head: null });
  
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<number | null>(null);

  // Forms State
  const [activeForm, setActiveForm] = useState<'insert' | 'delete' | 'find' | null>(null);
  const [insertValue, setInsertValue] = useState(10);
  const [insertIndex, setInsertIndex] = useState(0);
  const [deleteValue, setDeleteValue] = useState(10);
  const [findValue, setFindValue] = useState(10);

  // Layout and View State
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const [heapAreaHeight, setHeapAreaHeight] = useState(30);
  const [activeSnippetType, setActiveSnippetType] = useState<'insert' | 'delete' | 'free' | 'reverse' | 'find'>('insert');

  // Sync state with current frame
  const currentFrame = frames[frameIndex] || {
    nodes,
    variables,
    lineIndex: -1,
    explanation: 'Ready.',
    codeSnippet: activeSnippetType === 'insert' ? CODE_INSERT : activeSnippetType === 'delete' ? CODE_DELETE : activeSnippetType === 'reverse' ? CODE_REVERSE : activeSnippetType === 'find' ? CODE_FIND : CODE_FREE,
  };

  const handleNodeMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
    if (frames.length > 0) {
      setFrames(prevFrames => prevFrames.map(f => ({
        ...f,
        nodes: f.nodes.map(n => n.id === id ? { ...n, x, y } : n)
      })));
    }
  };

  const startInsert = () => {
    const newFrames = generateInsertFrames(
      frames.length > 0 ? frames[frames.length - 1].nodes : nodes,
      frames.length > 0 ? frames[frames.length - 1].variables.head : variables.head,
      insertValue,
      insertIndex
    );
    setFrames(newFrames);
    setFrameIndex(0);
    setIsPlaying(false);
    setActiveForm(null);
    setActiveSnippetType('insert');
  };

  const startDelete = () => {
    const newFrames = generateDeleteFrames(
      frames.length > 0 ? frames[frames.length - 1].nodes : nodes,
      frames.length > 0 ? frames[frames.length - 1].variables.head : variables.head,
      deleteValue
    );
    setFrames(newFrames);
    setFrameIndex(0);
    setIsPlaying(false);
    setActiveForm(null);
    setActiveSnippetType('delete');
  };

  const startFree = () => {
    const newFrames = generateFreeFrames(
      frames.length > 0 ? frames[frames.length - 1].nodes : nodes,
      frames.length > 0 ? frames[frames.length - 1].variables.head : variables.head
    );
    setFrames(newFrames);
    setFrameIndex(0);
    setIsPlaying(false);
    setActiveForm(null);
    setActiveSnippetType('free');
  };

  const startReverse = () => {
    const newFrames = generateReverseFrames(
      frames.length > 0 ? frames[frames.length - 1].nodes : nodes,
      frames.length > 0 ? frames[frames.length - 1].variables.head : variables.head
    );
    setFrames(newFrames);
    setFrameIndex(0);
    setIsPlaying(false);
    setActiveForm(null);
    setActiveSnippetType('reverse');
  };

  const startFind = () => {
    const newFrames = generateFindFrames(
      frames.length > 0 ? frames[frames.length - 1].nodes : nodes,
      frames.length > 0 ? frames[frames.length - 1].variables.head : variables.head,
      findValue
    );
    setFrames(newFrames);
    setFrameIndex(0);
    setIsPlaying(false);
    setActiveForm(null);
    setActiveSnippetType('find');
  };

  const reorderNodes = () => {
    const activeNodes = frames.length > 0 ? frames[frames.length - 1].nodes : nodes;
    const headAddress = frames.length > 0 ? frames[frames.length - 1].variables.head : variables.head;
    
    const newNodes = [...activeNodes];
    let curr = headAddress;
    let index = 0;
    while (curr) {
      const nodeObj = newNodes.find(n => n.address === curr);
      if (nodeObj) {
        nodeObj.x = 50 + (index * 130);
        nodeObj.y = 100;
        curr = nodeObj.next === '?' ? null : nodeObj.next;
        index++;
      } else {
        break;
      }
    }
    
    if (frames.length > 0) {
      setFrames(prevFrames => prevFrames.map((f, i) => i === frames.length - 1 ? { ...f, nodes: newNodes } : f));
    } else {
      setNodes(newNodes);
    }
  };

  const stepNext = () => {
    if (frameIndex < frames.length - 1) {
      setFrameIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const skipToEnd = () => {
    if (frames.length > 0) {
      setFrameIndex(frames.length - 1);
      setIsPlaying(false);
    }
  };

  const stepPrev = () => {
    if (frameIndex > 0) {
      setFrameIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      playRef.current = window.setInterval(() => {
        setFrameIndex(prev => {
          if (prev < frames.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1000);
    } else if (playRef.current) {
      clearInterval(playRef.current);
    }
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, frames.length]);

  const highlightedAddresses = React.useMemo(() => {
    const addresses = new Set<string>();
    if (currentFrame.variables['curr']) addresses.add(currentFrame.variables['curr']);
    if (currentFrame.variables['temp']) addresses.add(currentFrame.variables['temp']);
    if (currentFrame.variables['next_node']) addresses.add(currentFrame.variables['next_node']);
    if (currentFrame.variables['prev']) addresses.add(currentFrame.variables['prev']);
    return Array.from(addresses);
  }, [currentFrame]);

  // Resizer logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleHeapMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleHeapMouseMove);
    document.addEventListener('mouseup', handleHeapMouseUp);
  };

  const handleHeapMouseMove = (e: MouseEvent) => {
    const newHeight = 100 - (e.clientY / window.innerHeight) * 100;
    if (newHeight > 10 && newHeight < 80) {
      setHeapAreaHeight(newHeight);
    }
  };

  const handleHeapMouseUp = () => {
    document.removeEventListener('mousemove', handleHeapMouseMove);
    document.removeEventListener('mouseup', handleHeapMouseUp);
  };
  const isOperating = frames.length > 0 && frameIndex < frames.length - 1;

  const handleSnippetChange = (type: 'insert' | 'delete' | 'free' | 'reverse' | 'find') => {
    // Only allow switching when not mid-execution
    if (!isOperating) {
      setActiveSnippetType(type);
    }
  };

  // While an operation is running step-by-step, lock the viewer to that function's code.
  // Any other time (idle, before first confirm, or after last frame) allow free browsing.
  const snippetMap = {
    insert: CODE_INSERT,
    delete: CODE_DELETE,
    free: CODE_FREE,
    reverse: CODE_REVERSE,
    find: CODE_FIND,
  };
  const displayedSnippet = isOperating ? currentFrame.codeSnippet : snippetMap[activeSnippetType];
  const displayedLineIndex = isOperating ? currentFrame.lineIndex : -1;
  const displayedActiveSnippetType = isOperating
    ? (currentFrame.codeSnippet === CODE_INSERT ? 'insert'
      : currentFrame.codeSnippet === CODE_DELETE ? 'delete'
      : currentFrame.codeSnippet === CODE_REVERSE ? 'reverse'
      : currentFrame.codeSnippet === CODE_FIND ? 'find'
      : 'free')
    : activeSnippetType;

  return (
    <div className="app-container">
      <div className="left-panel" style={{ width: `${leftPanelWidth}%` }}>
        <div className="controls">
          <h2>Controls</h2>
          <div className="controls-row">
            <button disabled={isOperating} onClick={() => setActiveForm(activeForm === 'insert' ? null : 'insert')}>Insert Node</button>
            <button disabled={isOperating} onClick={() => setActiveForm(activeForm === 'delete' ? null : 'delete')}>Delete Node</button>
            <button disabled={isOperating} onClick={() => setActiveForm(activeForm === 'find' ? null : 'find')}>Find Node</button>
          </div>
          <div className="controls-row">
            <button disabled={isOperating} onClick={startReverse} style={{ background: isOperating ? 'var(--node-bg)' : 'var(--accent)', borderColor: isOperating ? 'var(--node-bg)' : 'var(--accent)' }}>Reverse List</button>
            <button disabled={isOperating} onClick={startFree} style={{ background: isOperating ? 'var(--node-bg)' : 'var(--node-highlight)', borderColor: isOperating ? 'var(--node-bg)' : 'var(--node-highlight)' }}>Reset (Free)</button>
            <button disabled={isOperating} onClick={reorderNodes}>Reorder</button>
          </div>
          
          {activeForm === 'insert' && !isOperating && (
            <div className="controls-forms">
              <div className="control-title">Insert at Index</div>
              <div className="control-group">
                <label>Value</label>
                <input type="number" value={insertValue} onChange={e => setInsertValue(Number(e.target.value))} />
              </div>
              <div className="control-group">
                <label>Index</label>
                <input type="number" value={insertIndex} onChange={e => setInsertIndex(Number(e.target.value))} />
              </div>
              <button onClick={startInsert} style={{ background: 'var(--accent)', marginTop: '0.5rem' }}>Confirm Insert</button>
            </div>
          )}

          {activeForm === 'delete' && !isOperating && (
            <div className="controls-forms">
              <div className="control-title">Delete by Value</div>
              <div className="control-group">
                <label>Value</label>
                <input type="number" value={deleteValue} onChange={e => setDeleteValue(Number(e.target.value))} />
              </div>
              <button onClick={startDelete} style={{ background: 'var(--node-highlight)', borderColor: 'var(--node-highlight)', marginTop: '0.5rem' }}>Confirm Delete</button>
            </div>
          )}

          {activeForm === 'find' && !isOperating && (
            <div className="controls-forms">
              <div className="control-title">Find Node</div>
              <div className="control-group">
                <label>Value</label>
                <input type="number" value={findValue} onChange={e => setFindValue(Number(e.target.value))} />
              </div>
              <button onClick={startFind} style={{ background: 'var(--accent)', borderColor: 'var(--accent)', marginTop: '0.5rem' }}>Confirm Find</button>
            </div>
          )}
          
          <hr style={{ borderColor: 'var(--node-border)' }} />
          
          <div className="controls-row">
            <button onClick={stepPrev} disabled={frameIndex === 0 || frames.length === 0}>Step Prev</button>
            <button onClick={stepNext} disabled={frameIndex >= frames.length - 1 || frames.length === 0}>Step Next</button>
            <button onClick={skipToEnd} disabled={frameIndex >= frames.length - 1 || frames.length === 0}>Skip to End</button>
            <button onClick={() => setIsPlaying(!isPlaying)} disabled={frameIndex >= frames.length - 1 || frames.length === 0}>
              {isPlaying ? 'Pause' : 'Auto Play'}
            </button>
          </div>
          <div style={{ color: 'var(--accent)', marginTop: '0.5rem', minHeight: '3rem' }}>
            {currentFrame.explanation}
          </div>
        </div>
        
        <div className="vars-panel">
          <h3>Variables</h3>
          {Object.entries(currentFrame.variables).map(([k, v]) => (
            <div className="var-item" key={k}>
              <span>{k}</span>
              <span style={{ color: 'var(--accent)' }}>{v !== null ? String(v) : 'NULL'}</span>
            </div>
          ))}
        </div>

        <CodeViewer 
          codeSnippet={displayedSnippet}
          currentLine={displayedLineIndex}
          activeSnippetType={displayedActiveSnippetType}
          onSnippetChange={handleSnippetChange}
        />
      </div>

      <div className="resizer" onMouseDown={handleMouseDown} />

      <div className="right-panel">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <WorkArea 
            nodes={currentFrame.nodes}
            variables={currentFrame.variables}
            highlightedAddresses={highlightedAddresses}
            onNodeMove={handleNodeMove}
          />
        </div>
        <div className="heap-resizer" onMouseDown={handleHeapMouseDown} />
        <div style={{ height: `${heapAreaHeight}%`, display: 'flex', flexDirection: 'column' }}>
          <HeapArea 
            nodes={currentFrame.nodes}
            variables={currentFrame.variables}
            highlightedAddresses={highlightedAddresses}
          />
        </div>
      </div>
    </div>
  );
}
