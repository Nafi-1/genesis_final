import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { 
  CanvasMetrics, 
  CollaborationUser, 
  SmartSuggestion, 
  AutoLayoutOptions,
  ExecutionContext,
  CanvasShortcut,
  NodeTemplate 
} from '../types';

interface EnhancedCanvasState {
  // Core Canvas State
  canvasMode: 'design' | 'simulate' | 'deploy' | 'debug';
  setCanvasMode: (mode: 'design' | 'simulate' | 'deploy' | 'debug') => void;
  // Workflow Nodes and Edges
  workflowNodes: Node[];
  workflowEdges: Edge[];
  setWorkflowNodes: (nodes: Node[]) => void;
  setWorkflowEdges: (edges: Edge[]) => void;
  
  // Enhanced Selection
  selectedNodes: string[];
  selectedEdges: string[];
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  
  // Collaboration
  isCollaborative: boolean;
  collaborators: CollaborationUser[];
  setIsCollaborative: (enabled: boolean) => void;
  addCollaborator: (user: CollaborationUser) => void;
  updateCollaborator: (userId: string, updates: Partial<CollaborationUser>) => void;
  removeCollaborator: (userId: string) => void;
  
  // Execution & Performance
  isExecuting: boolean;
  executionContext: ExecutionContext | null;
  metrics: CanvasMetrics;
  setIsExecuting: (executing: boolean) => void;
  setExecutionContext: (context: ExecutionContext | null) => void;
  updateMetrics: (metrics: Partial<CanvasMetrics>) => void;
  
  // Smart Features
  smartSuggestions: SmartSuggestion[];
  autoLayoutEnabled: boolean;
  layoutOptions: AutoLayoutOptions;
  setSuggestions: (suggestions: SmartSuggestion[]) => void;
  setAutoLayoutEnabled: (enabled: boolean) => void;
  setLayoutOptions: (options: AutoLayoutOptions) => void;
  
  // Visual Settings
  showGrid: boolean;
  showMinimap: boolean;
  showNeuralNetwork: boolean;
  showParticles: boolean;
  particleIntensity: number;
  setShowGrid: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowNeuralNetwork: (show: boolean) => void;
  setShowParticles: (show: boolean) => void;
  setParticleIntensity: (intensity: number) => void;
  
  // Canvas Viewport
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  centerCanvas: () => void;
  zoomToFit: () => void;
  
  // History & Undo/Redo
  history: { nodes: Node[]; edges: Edge[]; timestamp: Date }[];
  historyIndex: number;
  maxHistorySize: number;
  addToHistory: (nodes: Node[], edges: Edge[]) => void;
  undo: () => { nodes: Node[]; edges: Edge[] } | null;
  redo: () => { nodes: Node[]; edges: Edge[] } | null;
  clearHistory: () => void;
  
  // Auto-save
  lastSaved: Date | null;
  autoSaveInterval: number;
  setLastSaved: (date: Date) => void;
  setAutoSaveInterval: (interval: number) => void;
  
  // Node Templates
  nodeTemplates: NodeTemplate[];
  customTemplates: NodeTemplate[];
  addNodeTemplate: (template: NodeTemplate) => void;
  removeNodeTemplate: (templateId: string) => void;
  
  // Keyboard Shortcuts
  shortcuts: CanvasShortcut[];
  addShortcut: (shortcut: CanvasShortcut) => void;
  removeShortcut: (key: string) => void;
  
  // Canvas Themes
  currentTheme: string;
  themes: Record<string, any>;
  setTheme: (themeId: string) => void;
  
  // Performance Monitoring
  performanceMode: 'auto' | 'high' | 'balanced' | 'low';
  setPerformanceMode: (mode: 'auto' | 'high' | 'balanced' | 'low') => void;
  
  // Debug Mode
  debugMode: boolean;
  debugLogs: any[];
  setDebugMode: (enabled: boolean) => void;
  addDebugLog: (log: any) => void;
  clearDebugLogs: () => void;
  
  // Actions
  reset: () => void;
}

export const useEnhancedCanvasStore = create<EnhancedCanvasState>((set, get) => ({
  // Core Canvas State
  canvasMode: 'design',
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  
  // Workflow Nodes and Edges
  workflowNodes: [],
  workflowEdges: [],
  setWorkflowNodes: (nodes) => set({ workflowNodes: nodes }),
  setWorkflowEdges: (edges) => set({ workflowEdges: edges }),
  
  // Enhanced Selection
  selectedNodes: [],
  selectedEdges: [],
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  setSelectedEdges: (edgeIds) => set({ selectedEdges: edgeIds }),
  
  // Collaboration
  isCollaborative: false,
  collaborators: [],
  setIsCollaborative: (enabled) => set({ isCollaborative: enabled }),
  addCollaborator: (user) => {
    const { collaborators } = get();
    set({ collaborators: [...collaborators, user] });
  },
  updateCollaborator: (userId, updates) => {
    const { collaborators } = get();
    set({
      collaborators: collaborators.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      )
    });
  },
  removeCollaborator: (userId) => {
    const { collaborators } = get();
    set({ collaborators: collaborators.filter(user => user.id !== userId) });
  },
  
  // Execution & Performance
  isExecuting: false,
  executionContext: null,
  metrics: {
    totalNodes: 0,
    completedNodes: 0,
    failedNodes: 0,
    averageExecutionTime: 0,
    successRate: 0,
    performanceScore: 0,
  },
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setExecutionContext: (context) => set({ executionContext: context }),
  updateMetrics: (metrics) => {
    const currentMetrics = get().metrics;
    set({ metrics: { ...currentMetrics, ...metrics } });
  },
  
  // Smart Features
  smartSuggestions: [],
  autoLayoutEnabled: true,
  layoutOptions: {
    algorithm: 'dagre',
    direction: 'TB',
    spacing: { x: 250, y: 150 },
    animate: true,
  },
  setSuggestions: (suggestions) => set({ smartSuggestions: suggestions }),
  setAutoLayoutEnabled: (enabled) => set({ autoLayoutEnabled: enabled }),
  setLayoutOptions: (options) => set({ layoutOptions: options }),
  
  // Visual Settings
  showGrid: true,
  showMinimap: true,
  showNeuralNetwork: true,
  showParticles: true,
  particleIntensity: 0.4,
  setShowGrid: (show) => set({ showGrid: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
  setShowNeuralNetwork: (show) => set({ showNeuralNetwork: show }),
  setShowParticles: (show) => set({ showParticles: show }),
  setParticleIntensity: (intensity) => set({ particleIntensity: intensity }),
  
  // Canvas Viewport
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (viewport) => set({ viewport }),
  centerCanvas: () => {
    // Implementation would center the canvas
    set({ viewport: { x: 0, y: 0, zoom: 1 } });
  },
  zoomToFit: () => {
    // Implementation would zoom to fit all nodes
    set({ viewport: { x: 0, y: 0, zoom: 0.8 } });
  },
  
  // History & Undo/Redo
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  addToHistory: (nodes, edges) => {
    const { history, historyIndex, maxHistorySize } = get();
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add new state
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: new Date()
    });
    
    // Limit history size
    if (newHistory.length > maxHistorySize) {
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
      return {
        nodes: history[newIndex].nodes,
        edges: history[newIndex].edges
      };
    }
    return null;
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex });
      return {
        nodes: history[newIndex].nodes,
        edges: history[newIndex].edges
      };
    }
    return null;
  },
  
  clearHistory: () => set({ history: [], historyIndex: -1 }),
  
  // Auto-save
  lastSaved: null,
  autoSaveInterval: 30000, // 30 seconds
  setLastSaved: (date) => set({ lastSaved: date }),
  setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
  
  // Node Templates
  nodeTemplates: [
    {
      id: 'agent-template',
      type: 'agent',
      name: 'AI Agent',
      description: 'Intelligent digital worker',
      icon: () => null, // Would be actual icon component
      color: 'from-purple-500 to-pink-500',
      category: 'Core',
      defaultData: { status: 'ready' },
      connectable: { input: true, output: true, multiple: true }
    },
    // More templates...
  ],
  customTemplates: [],
  addNodeTemplate: (template) => {
    const { customTemplates } = get();
    set({ customTemplates: [...customTemplates, template] });
  },
  removeNodeTemplate: (templateId) => {
    const { customTemplates } = get();
    set({ 
      customTemplates: customTemplates.filter(t => t.id !== templateId) 
    });
  },
  
  // Keyboard Shortcuts
  shortcuts: [
    {
      key: 's',
      modifiers: ['ctrl'],
      action: 'save',
      description: 'Save canvas'
    },
    {
      key: 'z',
      modifiers: ['ctrl'],
      action: 'undo',
      description: 'Undo last action'
    },
    {
      key: 'z',
      modifiers: ['ctrl', 'shift'],
      action: 'redo',
      description: 'Redo last action'
    },
    {
      key: 'r',
      modifiers: ['ctrl', 'shift'],
      action: 'execute',
      description: 'Run workflow'
    },
  ],
  addShortcut: (shortcut) => {
    const { shortcuts } = get();
    set({ shortcuts: [...shortcuts, shortcut] });
  },
  removeShortcut: (key) => {
    const { shortcuts } = get();
    set({ shortcuts: shortcuts.filter(s => s.key !== key) });
  },
  
  // Canvas Themes
  currentTheme: 'quantum',
  themes: {
    quantum: {
      name: 'Quantum',
      colors: {
        background: 'from-slate-900 via-purple-900 to-slate-900',
        node: 'bg-white/10',
        edge: '#8b5cf6',
        selection: '#8b5cf6',
        grid: '#ffffff',
      },
      effects: {
        particles: true,
        neural_network: true,
        glow: true,
        shadows: true,
      }
    },
    minimal: {
      name: 'Minimal',
      colors: {
        background: 'from-gray-50 to-gray-100',
        node: 'bg-white',
        edge: '#6b7280',
        selection: '#3b82f6',
        grid: '#e5e7eb',
      },
      effects: {
        particles: false,
        neural_network: false,
        glow: false,
        shadows: true,
      }
    }
  },
  setTheme: (themeId) => set({ currentTheme: themeId }),
  
  // Performance Monitoring
  performanceMode: 'auto',
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  
  // Debug Mode
  debugMode: false,
  debugLogs: [],
  setDebugMode: (enabled) => set({ debugMode: enabled }),
  addDebugLog: (log) => {
    const { debugLogs } = get();
    const newLogs = [...debugLogs, { ...log, timestamp: new Date() }];
    // Keep only last 100 logs
    if (newLogs.length > 100) {
      newLogs.shift();
    }
    set({ debugLogs: newLogs });
  },
  clearDebugLogs: () => set({ debugLogs: [] }),
  
  // Actions
  reset: () => {
    set({
      selectedNodes: [],
      selectedEdges: [],
      isExecuting: false,
      executionContext: null,
      smartSuggestions: [],
      history: [],
      historyIndex: -1,
      lastSaved: null,
      debugLogs: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
  },
}));