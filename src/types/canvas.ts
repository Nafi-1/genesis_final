// Canvas-specific types for @xyflow/react compatibility
import type { Node, Edge } from '@xyflow/react';
import type { ComponentType } from 'react';

// Base node data interface that satisfies Record<string, unknown> constraint
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  icon?: ComponentType<any>;
  color: string;
  status: string;
  metadata?: Record<string, any>;
}

// Specific node data interfaces extending the base
export interface AgentNodeData extends BaseNodeData {
  role: string;
  tools: string[];
  personality?: string;
  status: 'ready' | 'executing' | 'paused' | 'error' | 'completed';
  performance?: {
    averageResponseTime: number;
    successRate: number;
    lastExecution?: string;
  };
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event';
  config?: Record<string, any>;
  status: 'ready' | 'active' | 'triggered' | 'error';
  schedule?: {
    frequency?: string;
    nextRun?: string;
    timezone?: string;
  };
  webhook?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

export interface ActionNodeData extends BaseNodeData {
  actionType: 'api' | 'email' | 'database' | 'webhook' | 'notification';
  config?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  validation?: {
    isValid: boolean;
    errors: string[];
  } | null;
  metrics?: {
    executionCount: number;
    averageTime: number;
    lastRun?: string;
  } | null;
}

export interface ConditionNodeData extends BaseNodeData {
  conditionType: 'if' | 'switch' | 'filter' | 'gate';
  condition: string;
  status: 'ready' | 'evaluating' | 'true' | 'false' | 'error';
}

export interface DelayNodeData extends BaseNodeData {
  delayType: 'fixed' | 'dynamic' | 'conditional';
  duration: string;
  status: 'ready' | 'waiting' | 'paused' | 'completed' | 'error';
}

// Enhanced Edge type that handles sourceHandle/targetHandle properly
export interface CanvasEdge extends Omit<Edge, 'sourceHandle' | 'targetHandle'> {
  sourceHandle: string | null;
  targetHandle: string | null;
}

// Union type for all node data
export type NodeData = AgentNodeData | TriggerNodeData | ActionNodeData | ConditionNodeData | DelayNodeData;

// Typed node definitions for @xyflow/react
export type CanvasNode = Node<NodeData>;

// Specific typed nodes for better type inference
export type ActionCanvasNode = Node<ActionNodeData>;
export type AgentCanvasNode = Node<AgentNodeData>;
export type TriggerCanvasNode = Node<TriggerNodeData>;
export type ConditionCanvasNode = Node<ConditionNodeData>;
export type DelayCanvasNode = Node<DelayNodeData>;