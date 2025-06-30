import { useState, useEffect, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState, Connection, addEdge, MarkerType, Position } from '@xyflow/react';
import { useCanvasStore } from '../stores/canvasStore';
import { useWizardStore } from '../stores/wizardStore';
import { canvasService } from '../services/canvasService';
import { NodeData, CanvasEdge, AgentNodeData, TriggerNodeData, ActionNodeData } from '../types/canvas';

/**
 * Hook for managing canvas operations
 */
export function useCanvas() {
  const { 
    blueprint,
    setStep
  } = useWizardStore();
  
  const {
    addToHistory,
    workflowNodes,
    workflowEdges,
    setWorkflowNodes,
    setWorkflowEdges
  } = useCanvasStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(workflowNodes as Node<NodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(workflowEdges as CanvasEdge[]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load nodes and edges from blueprint
  useEffect(() => {
    if (blueprint && nodes.length === 0 && edges.length === 0) {
      console.log("Loading canvas from blueprint");
      try {
        loadCanvasFromBlueprint();
      } catch (error) {
        console.error("Error loading canvas:", error);
        setError("Failed to load canvas from blueprint");
      }
    }
  }, [blueprint]);
  
  // Update canvas store whenever nodes or edges change
  useEffect(() => {
    setWorkflowNodes(nodes);
    setWorkflowEdges(edges);
  }, [nodes, edges, setWorkflowNodes, setWorkflowEdges]);
  
  // Load canvas from blueprint
  const loadCanvasFromBlueprint = useCallback(async () => {
    if (!blueprint) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎨 Loading canvas from blueprint:', blueprint.id);
      
      const { nodes: blueprintNodes, edges: blueprintEdges } = await canvasService.generateCanvasFromBlueprint(blueprint);
      
      console.log("Canvas generated successfully:", { 
        nodes: blueprintNodes.length, 
        edges: blueprintEdges.length 
      });
      
      setNodes(blueprintNodes);
      setEdges(blueprintEdges);
      addToHistory(blueprintNodes, blueprintEdges);
      
      console.log('✅ Canvas loaded from blueprint:', blueprint.id);
      return { nodes: blueprintNodes, edges: blueprintEdges };
    } catch (err) {
      console.error('Failed to load canvas from blueprint:', err);
      setError('Failed to generate canvas from blueprint');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [blueprint, setNodes, setEdges, addToHistory]);
  
  // Handle connecting nodes
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
  
  // Add a new node
  const addNode = useCallback((type: string, position?: { x: number; y: number }, data?: Partial<NodeData>) => {
    // Implementation would be similar to the addSmartNode function in EnhancedQuantumCanvas
    // Not implementing fully here to avoid duplication
    console.log('Adding node of type:', type, 'at position:', position);
  }, [nodes, edges, addToHistory]);
  
  // Save canvas
  const saveCanvas = useCallback(() => {
    addToHistory(nodes, edges);
    console.log('Canvas saved with', nodes.length, 'nodes and', edges.length, 'edges');
  }, [nodes, edges, addToHistory]);
  
  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (!nodes.length) return;
    
    console.log("Executing workflow with", nodes.length, "nodes");
    
    try {
      const result = await canvasService.executeWorkflow(
        'flow-1',
        nodes,
        edges,
        { userId: 'user-123' }
      );
      
      console.log('Workflow execution initiated:', result.executionId);
      return result;
    } catch (err) {
      console.error('Failed to execute workflow:', err);
      throw err;
    }
  }, [nodes, edges]);
  
  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    saveCanvas,
    executeWorkflow,
    isLoading,
    error,
    loadCanvasFromBlueprint
  };
}