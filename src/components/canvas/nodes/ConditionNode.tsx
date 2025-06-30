import React, { memo, useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { GitBranch, Target, MoreHorizontal, Check, X, AlertCircle, Clock } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import type { ConditionNodeData } from '../../../types/canvas';

// Component with proper typing matching ActionNode pattern
interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
  id: string;
  dragging?: boolean;
  type?: string;
  xPos: number;
  yPos: number;
  zIndex: number;
  isConnectable?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

export const ConditionNode = memo<ConditionNodeProps>(({ data, selected = false }) => {
  // Null check and proper typing for data
  if (!data) {
    return (
      <GlassCard variant="medium" className="w-72 border-2 border-red-400">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">Invalid Condition Node</p>
        </div>
      </GlassCard>
    );
  }

  const [showDetails, setShowDetails] = useState(false);

  // Type assertion to ensure TypeScript knows the correct type
  const nodeData = data as ConditionNodeData;

  // Safe destructuring with proper typing and defaults
  const {
    label = 'Untitled Condition',
    description = 'No description available',
    conditionType = 'if',
    condition = 'value > threshold',
    status = 'ready',
    color = 'from-orange-500 to-red-600',
    icon: ConditionIcon
  } = nodeData;

  const getStatusColor = useCallback((status: ConditionNodeData['status']) => {
    switch (status) {
      case 'ready': return 'border-orange-400 shadow-orange-400/30';
      case 'evaluating': return 'border-yellow-400 shadow-yellow-400/30 animate-pulse';
      case 'true': return 'border-green-400 shadow-green-400/30';
      case 'false': return 'border-red-400 shadow-red-400/30';
      case 'error': return 'border-red-500 shadow-red-500/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  }, []);

  const getConditionIcon = useCallback((conditionType: ConditionNodeData['conditionType']) => {
    switch (conditionType) {
      case 'if': return GitBranch;
      case 'switch': return Target;
      case 'filter': return GitBranch;
      case 'gate': return Target;
      default: return GitBranch;
    }
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  }, [showDetails]);

  const IconComponent = ConditionIcon || getConditionIcon(conditionType);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${selected ? 'z-10' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-72 border-2 ${getStatusColor(status)} ${
          selected ? 'ring-2 ring-orange-400/50' : ''
        } transition-all duration-200`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center relative overflow-hidden`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  animate={{ rotate: status === 'evaluating' ? 360 : 0 }}
                  transition={{ 
                    duration: 7, 
                    repeat: status === 'evaluating' ? Infinity : 0, 
                    ease: "linear" 
                  }}
                />
                <IconComponent className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {label}
                </h3>
                <p className="text-orange-300 text-xs capitalize">
                  {conditionType} condition
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {status === 'true' && <Check className="w-3 h-3 text-green-400" />}
                {status === 'false' && <X className="w-3 h-3 text-red-400" />}
                {status === 'evaluating' && <Clock className="w-3 h-3 text-yellow-400 animate-spin" />}
                {status === 'ready' && <div className="w-2 h-2 bg-orange-400 rounded-full" />}
                {status === 'error' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                <span className="text-xs text-white capitalize">{status}</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMoreClick}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-3 h-3 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-xs mb-3 leading-relaxed">
            {description}
          </p>

          {/* Condition Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Condition Details</span>
              <span className="text-orange-400 text-xs">
                {conditionType.toUpperCase()} Logic
              </span>
            </div>

            {/* Condition Preview */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Expression</span>
                  <span className="text-xs text-white font-mono">{condition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Type</span>
                  <span className="text-xs text-white">{conditionType}</span>
                </div>
              </div>

              {/* Visual representation of branching */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    status === 'true' ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-300">True path</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    status === 'false' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-300">False path</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {status === 'evaluating' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <div className="w-full bg-white/10 rounded-full h-1">
                <motion.div
                  className="h-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Evaluating...</span>
                <span>Processing</span>
              </div>
            </motion.div>
          )}

          {/* Success Indicator */}
          {(status === 'true' || status === 'false') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className={`flex items-center justify-center space-x-2 ${
                status === 'true' ? 'text-green-400' : 'text-red-400'
              }`}>
                {status === 'true' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  Condition evaluated: {status}
                </span>
              </div>
            </motion.div>
          )}

          {/* Error Indicator */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Condition evaluation failed</span>
              </div>
            </motion.div>
          )}

          {/* Details Panel */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center hover:bg-orange-500/30 transition-colors"
                    aria-label="Test condition"
                  >
                    <Target className="w-3 h-3 text-orange-400" />
                  </motion.button>
                </div>
                
                <span className="text-xs text-gray-400">
                  Condition ID: {label.toLowerCase().replace(/\s+/g, '-')}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl opacity-20 blur-lg -z-10"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </GlassCard>

      {/* Output Handles - True and False paths */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 bg-green-400 border-2 border-white shadow-lg"
        style={{ 
          right: -6, 
          top: '35%',
          zIndex: 10
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 bg-red-400 border-2 border-white shadow-lg"
        style={{ 
          right: -6, 
          top: '65%',
          zIndex: 10
        }}
      />

      {/* Handle Labels */}
      <div className="absolute right-2 top-[30%] text-xs text-green-300 pointer-events-none">
        T
      </div>
      <div className="absolute right-2 top-[60%] text-xs text-red-300 pointer-events-none">
        F
      </div>
    </motion.div>
  );
});

ConditionNode.displayName = 'ConditionNode';