import React, { useCallback, useEffect, useState, useRef, useMemo, ComponentType } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Node,
  Panel as ReactFlowPanel,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ConnectionMode,
  MarkerType,
  Connection,
  BackgroundVariant,
  NodeTypes,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Settings,
  Play,
  Pause,
  Save,
  Share2,
  Sparkles,
  Eye,
  EyeOff,
  Grid,
  Workflow,
  Brain,
  Users,
  RotateCcw,
  RotateCw,
  Keyboard,
  Lightbulb,
  Wand2,
  Target,
  GitBranch,
  Database,
  Globe,
  Mail,
  MessageSquare,
  DollarSign,
  BarChart,
  FileText,
  Clock,
  Rocket,
  Heart,
  Layout,
  Zap as Lightning,
  Zap
} from 'lucide-react';
import { AgentNode as AgentNodeComponent } from './nodes/AgentNode';
import { TriggerNode as TriggerNodeComponent } from './nodes/TriggerNode';
import { ActionNode as ActionNodeComponent } from './nodes/ActionNode';
import { ConditionNode as ConditionNodeComponent } from './nodes/ConditionNode';
import { DelayNode as DelayNodeComponent } from './nodes/DelayNode';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { NodeConfigPanel } from '../ui/NodeConfig/NodeConfigPanel';
import { useCanvasControls } from '../../hooks/useCanvasControls';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Blueprint } from '../../types';
import {
  AgentNodeData,
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
  DelayNodeData,
  CanvasEdge,
  NodeData
} from '../../types/canvas';

// Define node types with proper typing
const nodeTypes: Record<string, React.ComponentType<any>> = {
  agent: AgentNodeComponent as React.ComponentType<any>,
  trigger: TriggerNodeComponent as React.ComponentType<any>,
  action: ActionNodeComponent as React.ComponentType<any>,
  condition: ConditionNodeComponent as React.ComponentType<any>,
  delay: DelayNodeComponent as React.ComponentType<any>,
};

const proOptions = {
  hideAttribution: true,
};

interface EnhancedQuantumCanvasProps {
  blueprint?: Blueprint;
  initialNodes?: Node<NodeData>[];
  initialEdges?: CanvasEdge[];
  onSave?: (nodes: Node<NodeData>[], edges: CanvasEdge[]) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
}

// Enhanced Quantum Particle System
const QuantumParticleSystem: React.FC<{ intensity: number; nodeCount: number }> = ({ intensity, nodeCount }) => {
  const particleCount = Math.min(100, 20 + nodeCount * 5);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: `linear-gradient(45deg, 
              ${i % 4 === 0 ? '#8b5cf6' :
                i % 4 === 1 ? '#06b6d4' :
                  i % 4 === 2 ? '#10b981' : '#f59e0b'}40, 
              transparent)`
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0, intensity, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
};

// Neural Network Visualization
const NeuralNetworkOverlay: React.FC<{ nodes: Node<NodeData>[] }> = ({ nodes }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
      {nodes.map((node, i) =>
        nodes.slice(i + 1).map((otherNode, j) => {
          const distance = Math.sqrt(
            Math.pow(node.position.x - otherNode.position.x, 2) +
            Math.pow(node.position.y - otherNode.position.y, 2)
          );

          if (distance < 400) {
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={node.position.x + 140}
                y1={node.position.y + 60}
                x2={otherNode.position.x + 140}
                y2={otherNode.position.y + 60}
                stroke="url(#neuralGradient)"
                strokeWidth={Math.max(0.5, 3 - distance / 100)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  pathLength: { duration: 2 },
                  opacity: {
                    duration: 4,
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }
                }}
              />
            );
          }
          return null;
        })
      )}
      <defs>
        <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Smart Node Suggestions
const SmartSuggestions: React.FC<{
  selectedNode: Node<NodeData> | null;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}> = ({ selectedNode, onAddNode }) => {
  const suggestions = useMemo(() => {
    if (!selectedNode) return [];

    const nodeType = selectedNode.type;
    const suggestions = [];

    if (nodeType === 'trigger') {
      suggestions.push(
        { type: 'agent', label: 'Add AI Agent', icon: Bot, reason: 'Process the trigger event' },
        { type: 'condition', label: 'Add Condition', icon: GitBranch, reason: 'Filter trigger events' }
      );
    } else if (nodeType === 'agent') {
      suggestions.push(
        { type: 'action', label: 'Add Action', icon: Lightning, reason: 'Execute agent output' },
        { type: 'condition', label: 'Add Logic', icon: Target, reason: 'Branch based on agent result' }
      );
    } else if (nodeType === 'condition') {
      suggestions.push(
        { type: 'action', label: 'True Action', icon: Lightning, reason: 'When condition is true' },
        { type: 'delay', label: 'Add Delay', icon: Clock, reason: 'Wait before proceeding' }
      );
    }

    return suggestions.slice(0, 3);
  }, [selectedNode]);

  if (!selectedNode || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <GlassCard variant="medium" className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-medium text-sm">Smart Suggestions</span>
        </div>
        <div className="flex space-x-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onAddNode(suggestion.type, {
                x: selectedNode.position.x + 350,
                y: selectedNode.position.y + index * 100
              })}
              className="flex flex-col items-center p-3 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors group"
            >
              <suggestion.icon className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white font-medium">{suggestion.label}</span>
              <span className="text-xs text-gray-400 mt-1 text-center">{suggestion.reason}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

// Collaboration Cursors
const CollaborationCursor: React.FC<{ user: { id: string; name: string; color: string; x: number; y: number } }> = ({ user }) => (
  <motion.div
    className="absolute pointer-events-none z-50"
    style={{ left: user.x, top: user.y }}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    exit={{ scale: 0 }}
  >
    <div className="relative">
      <motion.div
        className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
        style={{ backgroundColor: user.color }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div
        className="absolute top-5 left-0 px-2 py-1 rounded text-xs text-white font-medium shadow-lg whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  </motion.div>
);

export const EnhancedQuantumCanvas: React.FC<EnhancedQuantumCanvasProps> = ({
  blueprint,
  initialNodes,
  initialEdges,
  onSave,
  onExecute,
  isExecuting = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initialEdges || []);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isNeuralNetworkVisible, setIsNeuralNetworkVisible] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isAnyNodeDragging, setIsAnyNodeDragging] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Get canvas controls
  const {
    selectedNode,
    isNodeConfigOpen,
    openNodeConfig,
    closeNodeConfig,
    updateNodeData,
    deleteNode
  } = useCanvasControls();

  // Enhanced Canvas state
  const {
    canvasMode,
    setCanvasMode,
    selectedNodes,
    setSelectedNodes,
    isCollaborative,
    setIsCollaborative,
    addToHistory,
    undo,
    redo,
    executionMetrics,
    updateExecutionMetrics
  } = useCanvasStore();

  // Initialize canvas with blueprint data if provided
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0 && initialEdges && initialEdges.length > 0) {
      console.log('🎨 Using provided nodes and edges:', {
        nodes: initialNodes.length,
        edges: initialEdges.length
      });
      setNodes(initialNodes);
      setEdges(initialEdges);
    } else if (blueprint && blueprint.suggested_structure) {
      console.log('🎨 No pre-generated canvas found, initializing from blueprint');
      generateEnhancedNodesFromBlueprint(blueprint);
    }
  }, [blueprint, initialNodes, initialEdges]);

  // Mock collaboration users
  const [collaborators] = useState([
    { id: '1', name: 'Alex Chen', color: '#8b5cf6', x: 200, y: 150 },
    { id: '2', name: 'Sarah Kim', color: '#06b6d4', x: 500, y: 300 },
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              const redoState = redo();
              if (redoState) {
                setNodes([...redoState.nodes] as Node<NodeData>[]);
                setEdges([...redoState.edges] as CanvasEdge[]);
              }
            } else {
              const undoState = undo();
              if (undoState) {
                setNodes([...undoState.nodes] as Node<NodeData>[]);
                setEdges([...undoState.edges] as CanvasEdge[]);
              }
            }
            event.preventDefault();
            break;
          case 's':
            handleSave();
            event.preventDefault();
            break;
          case 'r':
            if (event.shiftKey) {
              handleExecute();
              event.preventDefault();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const generateEnhancedNodesFromBlueprint = useCallback((blueprint: Blueprint) => {
    if (!blueprint) return;

    const newNodes: Node<NodeData>[] = [];
    const newEdges: CanvasEdge[] = [];

    // Create trigger node with enhanced positioning
    const triggerNode: Node<TriggerNodeData> = {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 50, y: 200 },
      data: {
        label: 'Guild Activation',
        triggerType: 'manual',
        description: 'Initiates the guild workflow with intelligent coordination',
        icon: Rocket,
        color: 'from-emerald-500 to-teal-500',
        status: 'ready'
      } satisfies TriggerNodeData,
    };
    newNodes.push(triggerNode);

    // Create agent nodes with smart layout algorithm
    blueprint.suggested_structure.agents.forEach((agent, index) => {
      const angle = (index * 2 * Math.PI) / blueprint.suggested_structure.agents.length;
      const radius = 300;
      const centerX = 500;
      const centerY = 300;

      const agentNode: Node<AgentNodeData> = {
        id: `agent-${index + 1}`,
        type: 'agent',
        position: {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        },
        data: {
          label: agent.name,
          role: agent.role,
          description: agent.description,
          tools: agent.tools_needed,
          personality: getAgentPersonality(agent.role),
          icon: getAgentIcon(agent.role),
          color: getAgentColor(index),
          status: 'ready'
        } satisfies AgentNodeData,
      };
      newNodes.push(agentNode);

      // Enhanced connections with curved paths
      if (index === 0) {
        const edge: CanvasEdge = {
          id: `trigger-agent-${index + 1}`,
          source: 'trigger-1',
          target: `agent-${index + 1}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          sourceHandle: null,
          targetHandle: null
        };
        newEdges.push(edge);
      }

      // Create intelligent connections between agents
      if (index > 0) {
        const edge: CanvasEdge = {
          id: `agent-${index}-agent-${index + 1}`,
          source: `agent-${index}`,
          target: `agent-${index + 1}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          sourceHandle: null,
          targetHandle: null
        };
        newEdges.push(edge);
      }
    });

    // Create workflow action nodes with enhanced layout
    blueprint.suggested_structure.workflows.forEach((workflow, index) => {
      const workflowNode: Node<ActionNodeData> = {
        id: `workflow-${index + 1}`,
        type: 'action',
        position: {
          x: 200 + (index * 400),
          y: 600
        },
        data: {
          label: workflow.name,
          description: workflow.description,
          actionType: mapTriggerTypeToActionType(workflow.trigger_type),
          icon: getWorkflowIcon(workflow.trigger_type),
          color: getWorkflowColor(workflow.trigger_type),
          status: 'pending'
        } satisfies ActionNodeData,
      };
      newNodes.push(workflowNode);

      // Connect agents to workflows intelligently
      if (blueprint.suggested_structure.agents.length > 0) {
        const targetAgentIndex = Math.min(index + 1, blueprint.suggested_structure.agents.length);
        const edge: CanvasEdge = {
          id: `agent-${targetAgentIndex}-workflow-${index + 1}`,
          source: `agent-${targetAgentIndex}`,
          target: `workflow-${index + 1}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          sourceHandle: null,
          targetHandle: null
        };
        newEdges.push(edge);
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
    addToHistory(newNodes, newEdges);
  }, []);

  const getAgentPersonality = (role: string) => {
    const personalities: Record<string, string> = {
      'analyst': 'Data-driven, analytical, precise with strategic insights',
      'support': 'Empathetic, patient, solution-focused with customer care',
      'sales': 'Persuasive, relationship-focused, results-oriented',
      'marketing': 'Creative, brand-conscious, engagement-focused',
      'finance': 'Detail-oriented, compliance-focused, accuracy-driven',
      'operations': 'Efficient, process-oriented, optimization-focused',
    };

    const roleKey = Object.keys(personalities).find(key =>
      role.toLowerCase().includes(key)
    );

    return personalities[roleKey || 'analyst'] || 'Professional, intelligent, and goal-oriented';
  };

  const getAgentIcon = (role: string) => {
    const roleIcons: Record<string, any> = {
      'analyst': BarChart,
      'support': MessageSquare,
      'sales': DollarSign,
      'marketing': Sparkles,
      'finance': DollarSign,
      'operations': Settings,
      'hr': Users,
      'customer': Heart,
      'data': Database,
      'content': FileText,
      'social': Share2,
      'email': Mail,
      'report': FileText,
      'intelligence': Brain,
      'specialist': Target,
    };

    const roleKey = Object.keys(roleIcons).find(key =>
      role.toLowerCase().includes(key)
    );

    return roleIcons[roleKey || 'specialist'] || Bot;
  };

  const getAgentColor = (index: number) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-violet-500 to-purple-500',
      'from-indigo-500 to-blue-500',
    ];
    return colors[index % colors.length];
  };

  const getWorkflowIcon = (triggerType: string) => {
    const triggerIcons: Record<string, any> = {
      'schedule': Clock,
      'webhook': Globe,
      'manual': Play,
      'event': Zap,
    };
    return triggerIcons[triggerType] || Workflow;
  };

  const getWorkflowColor = (triggerType: string) => {
    const triggerColors: Record<string, string> = {
      'schedule': 'from-blue-500 to-indigo-500',
      'webhook': 'from-green-500 to-emerald-500',
      'manual': 'from-purple-500 to-violet-500',
      'event': 'from-yellow-500 to-orange-500',
    };
    return triggerColors[triggerType] || 'from-gray-500 to-slate-500';
  };

  const mapTriggerTypeToActionType = (triggerType: string): ActionNodeData['actionType'] => {
    const mapping: Record<string, ActionNodeData['actionType']> = {
      'schedule': 'database',
      'webhook': 'api',
      'manual': 'notification',
      'event': 'webhook',
    };
    return mapping[triggerType] || 'api';
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const edge: CanvasEdge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source || '',
        target: params.target || '',
        sourceHandle: params.sourceHandle || null,
        targetHandle: params.targetHandle || null,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
      };
      const newEdges = addEdge(edge, edges);
      setEdges(newEdges);
      addToHistory(nodes, newEdges);
    },
    [edges, nodes, addToHistory, setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNodes([node.id]);
    if (event.detail === 2) {  // Double-click to open config
      openNodeConfig(node.id);
    } else {
      setSelectedNodes([node.id]);
    }
  }, [setSelectedNodes]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
    addToHistory(nodes, edges);
  }, [nodes, edges, onSave, addToHistory]);

  const handleExecute = useCallback(() => {
    if (onExecute) {
      onExecute();
      updateExecutionMetrics({
        totalNodes: nodes.length,
        lastExecutionTime: new Date()
      });
    }
  }, [onExecute, nodes.length, updateExecutionMetrics]);

  const addSmartNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const nodeCreationTools = [
      {
        type: 'agent',
        icon: Bot,
        label: 'AI Agent',
        color: 'from-purple-500 to-pink-500',
        description: 'Intelligent digital worker with advanced capabilities'
      },
      {
        type: 'trigger',
        icon: Zap,
        label: 'Smart Trigger',
        color: 'from-emerald-500 to-teal-500',
        description: 'Intelligent workflow initiator'
      },
      {
        type: 'action',
        icon: Lightning,
        label: 'Action Node',
        color: 'from-blue-500 to-cyan-500',
        description: 'Powerful execution engine'
      },
      {
        type: 'condition',
        icon: Target,
        label: 'Logic Gate',
        color: 'from-orange-500 to-red-500',
        description: 'Intelligent decision branching'
      },
      {
        type: 'delay',
        icon: Clock,
        label: 'Time Control',
        color: 'from-violet-500 to-purple-500',
        description: 'Precise timing control'
      },
    ];

    const nodeTemplate = nodeCreationTools.find(tool => tool.type === type);
    if (!nodeTemplate) return;

    let newNode: Node<NodeData>;

    switch (type) {
      case 'agent':
        newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position: position || {
            x: Math.random() * 400 + 200,
            y: Math.random() * 400 + 200
          },
          data: {
            label: `New ${nodeTemplate.label}`,
            description: nodeTemplate.description,
            role: 'AI Assistant',
            tools: ['API', 'Database'],
            icon: nodeTemplate.icon,
            color: nodeTemplate.color,
            status: 'ready'
          } satisfies AgentNodeData,
        } satisfies Node<AgentNodeData>;
        break;
      case 'trigger':
        newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position: position || {
            x: Math.random() * 400 + 200,
            y: Math.random() * 400 + 200
          },
          data: {
            label: `New ${nodeTemplate.label}`,
            description: nodeTemplate.description,
            triggerType: 'manual',
            icon: nodeTemplate.icon,
            color: nodeTemplate.color,
            status: 'ready'
          } satisfies TriggerNodeData,
        } satisfies Node<TriggerNodeData>;
        break;
      case 'action':
        newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position: position || {
            x: Math.random() * 400 + 200,
            y: Math.random() * 400 + 200
          },
          data: {
            label: `New ${nodeTemplate.label}`,
            description: nodeTemplate.description,
            actionType: 'api',
            icon: nodeTemplate.icon,
            color: nodeTemplate.color,
            status: 'pending'
          } satisfies ActionNodeData,
        } satisfies Node<ActionNodeData>;
        break;
      case 'condition':
        newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position: position || {
            x: Math.random() * 400 + 200,
            y: Math.random() * 400 + 200
          },
          data: {
            label: `New ${nodeTemplate.label}`,
            description: nodeTemplate.description,
            conditionType: 'if',
            condition: 'value > threshold',
            icon: nodeTemplate.icon,
            color: nodeTemplate.color,
            status: 'ready'
          } satisfies ConditionNodeData,
        } satisfies Node<ConditionNodeData>;
        break;
      case 'delay':
        newNode = {
          id: `${type}-${Date.now()}`,
          type,
          position: position || {
            x: Math.random() * 400 + 200,
            y: Math.random() * 400 + 200
          },
          data: {
            label: `New ${nodeTemplate.label}`,
            description: nodeTemplate.description,
            delayType: 'fixed',
            duration: '5s',
            icon: nodeTemplate.icon,
            color: nodeTemplate.color,
            status: 'ready'
          } satisfies DelayNodeData,
        } satisfies Node<DelayNodeData>;
        break;
      default:
        return;
    }

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    addToHistory(newNodes, edges);
  }, [nodes, edges, addToHistory]);

  const autoLayout = useCallback(() => {
    // Implement dagre auto-layout algorithm
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * 350 + 100,
        y: Math.floor(index / 3) * 200 + 100
      }
    }));

    setNodes(layoutedNodes);
    addToHistory(layoutedNodes, edges);
  }, [nodes, edges, addToHistory]);

  return (
    <ReactFlowProvider>
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Quantum Background */}
      <QuantumParticleSystem intensity={0.4} nodeCount={nodes.length} />

      {/* Neural Network Overlay */}
      {isNeuralNetworkVisible && <NeuralNetworkOverlay nodes={nodes} />}

      {/* Top Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-4 left-4 right-4 z-50"
      >
        <GlassCard variant="medium" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo & Info */}
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Workflow className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-bold">
                    {blueprint?.suggested_structure.guild_name || 'Enhanced Quantum Canvas'}
                  </h3>
                  <p className="text-gray-300 text-xs">
                    {nodes.length} nodes • {edges.length} connections • {executionMetrics.completedNodes} completed
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
                {['design', 'simulate', 'deploy'].map((mode) => (
                  <HolographicButton
                    key={mode}
                    variant={canvasMode === mode ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setCanvasMode(mode as any)}
                    className="capitalize min-w-[80px]"
                  >
                    {mode}
                  </HolographicButton>
                ))}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center space-x-2">
              {/* View Controls */}
              <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
                <HolographicButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGridVisible(!isGridVisible)}
                  className={isGridVisible ? 'text-blue-400' : ''}
                >
                  <Grid className="w-4 h-4" />
                </HolographicButton>

                <HolographicButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNeuralNetworkVisible(!isNeuralNetworkVisible)}
                  className={isNeuralNetworkVisible ? 'text-purple-400' : ''}
                >
                  <Brain className="w-4 h-4" />
                </HolographicButton>

                <HolographicButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimapVisible(!isMinimapVisible)}
                  className={isMinimapVisible ? 'text-green-400' : ''}
                >
                  {isMinimapVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </HolographicButton>
              </div>

              {/* History Controls */}
              <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
                <HolographicButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const undoState = undo();
                    if (undoState) {
                      setNodes([...undoState.nodes] as Node<NodeData>[]);
                      setEdges([...undoState.edges] as CanvasEdge[]);
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </HolographicButton>

                <HolographicButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const redoState = redo();
                    if (redoState) {
                      setNodes([...redoState.nodes] as Node<NodeData>[]);
                      setEdges([...redoState.edges] as CanvasEdge[]);
                    }
                  }}
                >
                  <RotateCw className="w-4 h-4" />
                </HolographicButton>
              </div>

              {/* Smart Tools */}
              <HolographicButton
                variant="ghost"
                size="sm"
                onClick={autoLayout}
              >
                <Layout className="w-4 h-4" />
              </HolographicButton>

              <HolographicButton
                variant="ghost"
                size="sm"
                onClick={() => setIsCollaborative(!isCollaborative)}
                className={isCollaborative ? 'text-purple-400' : ''}
              >
                <Users className="w-4 h-4" />
              </HolographicButton>

              <HolographicButton
                variant="outline"
                size="sm"
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
              </HolographicButton>

              <HolographicButton
                variant="primary"
                size="sm"
                onClick={handleExecute}
                disabled={isExecuting}
                glow
              >
                {isExecuting ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </HolographicButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Enhanced Left Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute left-4 top-24 bottom-4 w-72 z-40"
      >
        <GlassCard variant="medium" className="p-4 h-full">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">Node Palette</h4>
                <div className="flex items-center space-x-1">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 text-xs">AI Enhanced</span>
                </div>
              </div>
              <p className="text-gray-300 text-xs">
                Drag nodes to canvas or click to add intelligently
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {[
                {
                  type: 'agent',
                  icon: Bot,
                  label: 'AI Agent',
                  color: 'from-purple-500 to-pink-500',
                  description: 'Intelligent digital worker',
                  category: 'Core'
                },
                {
                  type: 'trigger',
                  icon: Zap,
                  label: 'Smart Trigger',
                  color: 'from-emerald-500 to-teal-500',
                  description: 'Workflow initiator',
                  category: 'Core'
                },
                {
                  type: 'action',
                  icon: Lightning,
                  label: 'Action Node',
                  color: 'from-blue-500 to-cyan-500',
                  description: 'Process executor',
                  category: 'Core'
                },
                {
                  type: 'condition',
                  icon: Target,
                  label: 'Logic Gate',
                  color: 'from-orange-500 to-red-500',
                  description: 'Decision branching',
                  category: 'Logic'
                },
                {
                  type: 'delay',
                  icon: Clock,
                  label: 'Time Control',
                  color: 'from-violet-500 to-purple-500',
                  description: 'Timing control',
                  category: 'Utility'
                },
              ].map((tool) => (
                <motion.div
                  key={tool.type}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer group"
                  onClick={() => addSmartNode(tool.type)}
                  draggable
                  onDragStart={(event) => {
                    const dragEvent = event as unknown as React.DragEvent<HTMLDivElement>;
                    dragEvent.dataTransfer.setData('application/reactflow', tool.type);
                    dragEvent.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <GlassCard variant="subtle" className="p-4 hover:bg-white/10 transition-all duration-200 group-hover:border-white/30">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center relative overflow-hidden`}
                        whileHover={{ rotate: 5 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />
                        <tool.icon className="w-6 h-6 text-white relative z-10" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-white font-medium">{tool.label}</div>
                          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">{tool.category}</span>
                        </div>
                        <div className="text-gray-300 text-xs mt-1">{tool.description}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Blueprint Info */}
            {blueprint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <h5 className="text-white font-medium mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-purple-400" />
                  Blueprint Analytics
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">AI Agents</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-purple-400 rounded-full" />
                      <span className="text-purple-400 font-semibold">{blueprint.suggested_structure.agents.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Workflows</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-blue-400 rounded-full" />
                      <span className="text-blue-400 font-semibold">{blueprint.suggested_structure.workflows.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Connections</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-green-400 rounded-full" />
                      <span className="text-green-400 font-semibold">{edges.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Complexity</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${i < Math.min(5, Math.floor(nodes.length / 2)) ? 'bg-orange-400' : 'bg-gray-600'
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-orange-400 text-xs">
                        {nodes.length < 5 ? 'Simple' : nodes.length < 10 ? 'Moderate' : 'Complex'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Canvas Area */}
      <div className="w-full h-full ml-80 mr-4">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={isAnyNodeDragging ? undefined : onNodeClick}
          onNodeDragStart={() => setIsAnyNodeDragging(true)}
          onNodeDragStop={() => setIsAnyNodeDragging(false)}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          proOptions={proOptions}
          className="bg-transparent"
          onInit={setReactFlowInstance}
        >
          <Background
            variant={isGridVisible ? BackgroundVariant.Dots : undefined}
            gap={20}
            size={1}
            color="#ffffff"
            style={{ opacity: isGridVisible ? 0.1 : 0 }}
          />

          <Controls
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />

          {/* Enhanced Execution Panel */}
          <ReactFlowPanel position="bottom-center">
            <AnimatePresence>
              {isExecuting && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <GlassCard variant="medium" className="px-8 py-4 min-w-[400px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <motion.div
                          className="w-3 h-3 bg-green-400 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <div>
                          <span className="text-white font-semibold text-lg">Executing Workflow</span>
                          <div className="text-gray-300 text-sm">
                            {executionMetrics.completedNodes} / {executionMetrics.totalNodes} nodes completed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-green-400 font-mono text-sm">
                            {executionMetrics.averageExecutionTime}ms avg
                          </div>
                          <div className="text-gray-400 text-xs">
                            {executionMetrics.failedNodes} errors
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className="h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${(executionMetrics.completedNodes / executionMetrics.totalNodes) * 100}%`
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </ReactFlowPanel>

          {/* Collaboration Indicators */}
          <ReactFlowPanel position="top-right">
            <AnimatePresence>
              {isCollaborative && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <GlassCard variant="subtle" className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium">Live Collaboration</span>
                      <div className="flex -space-x-2">
                        {collaborators.map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: user.color }}
                            title={user.name}
                          >
                            {user.name[0]}
                          </motion.div>
                        ))}
                        <div className="w-8 h-8 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs">
                          +2
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </ReactFlowPanel>

          {/* Keyboard Shortcuts Panel */}
          <ReactFlowPanel position="bottom-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <GlassCard variant="subtle" className="p-3">
                <div className="flex items-center space-x-2 text-gray-400 text-xs">
                  <Keyboard className="w-3 h-3" />
                  <span>⌘S Save</span>
                  <span>⌘Z Undo</span>
                  <span>⌘⇧R Run</span>
                </div>
              </GlassCard>
            </motion.div>
          </ReactFlowPanel>
        </ReactFlow>
        </div>

        {/* Node Configuration Panel */}
        {isNodeConfigOpen && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={closeNodeConfig}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
          />
        )}

        {/* Smart Suggestions */}
        <AnimatePresence>
          <SmartSuggestions
            selectedNode={selectedNode}
            onAddNode={addSmartNode}
          />
        </AnimatePresence>

        {/* Collaboration Cursors */}
        <AnimatePresence>
          {isCollaborative && collaborators.map((user) => (
            <CollaborationCursor key={user.id} user={user} />
          ))}
        </AnimatePresence>
    </div>
    </ReactFlowProvider>
  );
};