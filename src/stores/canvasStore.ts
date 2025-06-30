import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { NodeData, CanvasEdge } from '../types/canvas';

interface CanvasState {
  // Canvas mode
  canvasMode: 'design' | 'simulate' | 'deploy';
  setCanvasMode: (mode: 'design' | 'simulate' | 'deploy') => void;
  
  // Node selection
  selectedNodes: string[];
  setSelectedNodes: (nodeIds: string[]) => void;
  
  // Collaboration
  isCollaborative: boolean;
  setIsCollaborative: (enabled: boolean) => void;
  
  // Execution state
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
  
  // Canvas viewport
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  
  // Workflow state
  workflowNodes: Node[];
  workflowEdges: Edge[];
  setWorkflowNodes: (nodes: Node[]) => void;
  setWorkflowEdges: (edges: Edge[]) => void;
  
  // Selected node
  selectedNode: Node<NodeData> | null;
  setSelectedNode: (node: Node<NodeData> | null) => void;
  
  // Auto-save
  lastSaved: Date | null;
  setLastSaved: (date: Date) => void;
  
  // History for undo/redo
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;
  addToHistory: (nodes: Node[], edges: Edge[]) => void;
  undo: () => { nodes: Node[]; edges: Edge[] } | null;
  redo: () => { nodes: Node[]; edges: Edge[] } | null;
  
  // Performance monitoring
  executionMetrics: {
    totalNodes: number;
    completedNodes: number;
    failedNodes: number;
    averageExecutionTime: number;
    lastExecutionTime: Date | null;
  };
  updateExecutionMetrics: (metrics: Partial<CanvasState['executionMetrics']>) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Canvas mode
  canvasMode: 'design',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  
  // Node selection
  selectedNodes: [],
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  
  // Collaboration
  isCollaborative: false,
  setIsCollaborative: (enabled) => set({ isCollaborative: enabled }),
  
  // Execution state
  isExecuting: false,
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  
  // Canvas viewport
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (viewport) => set({ viewport }),
  
  // Workflow state
  workflowNodes: [],
  workflowEdges: [],
  setWorkflowNodes: (nodes) => {
    console.log('Setting workflow nodes:', nodes.length);
    set({ workflowNodes: nodes });
  },
  setWorkflowEdges: (edges) => {
    console.log('Setting workflow edges:', edges.length);
    set({ workflowEdges: edges });
  },
  
  // Selected node
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  
  // Auto-save
  lastSaved: null,
  setLastSaved: (date) => set({ lastSaved: date }),
  
  // History for undo/redo
  history: [],
  historyIndex: -1,
  addToHistory: (nodes, edges) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges))
    });
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      set({ historyIndex: historyIndex + 1 });
    }
    
    set({ history: newHistory });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1; 
      set({ historyIndex: newIndex });
      return history[newIndex];
    }
    return null;
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex });
      return history[newIndex];
    }
    return null;
  },
  
  // Performance monitoring
  executionMetrics: {
    totalNodes: 0,
    completedNodes: 0,
    failedNodes: 0,
    averageExecutionTime: 0,
    lastExecutionTime: null,
  },
  
  updateExecutionMetrics: (metrics) => {
    set((state) => ({
      executionMetrics: {
        ...state.executionMetrics,
        ...metrics,
      },
    }));
  },
}));