import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { AgentConfig } from './AgentConfig';
import { TriggerConfig } from './TriggerConfig';
import { ActionConfig } from './ActionConfig';
import { Node } from '@xyflow/react';
import { NodeData, AgentNodeData, TriggerNodeData, ActionNodeData, ConditionNodeData, DelayNodeData } from '../../../types/canvas';

interface NodeConfigPanelProps {
  node: Node<NodeData> | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ 
  node, 
  onClose,
  onUpdate,
  onDelete
}) => {
  if (!node) return null;

  // Render different config panels based on node type
  const renderConfigPanel = () => {
    switch (node.type) {
      case 'agent':
        return (
          <AgentConfig
            nodeId={node.id}
            data={node.data as AgentNodeData}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={onClose}
          />
        );
      case 'trigger':
        return (
          <TriggerConfig
            nodeId={node.id}
            data={node.data as TriggerNodeData}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={onClose}
          />
        );
      case 'action':
        return (
          <ActionConfig
            nodeId={node.id}
            data={node.data as ActionNodeData}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={onClose}
          />
        );
      // Add condition and delay configs when needed
      default:
        return (
          <div className="text-white p-4">
            No configuration panel available for this node type.
          </div>
        );
    }
  };

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative"
      >
        {renderConfigPanel()}
      </motion.div>
    </motion.div>,
    document.body
  );
};