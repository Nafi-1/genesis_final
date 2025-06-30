import React, { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Play, Calendar, Globe, Zap, MoreHorizontal, AlertCircle, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import type { TriggerNodeData } from '../../../types/canvas';

// Component with proper typing matching ActionNode pattern
interface TriggerNodeProps {
  data: TriggerNodeData;
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

export const TriggerNode = memo<TriggerNodeProps>(({ data, selected = false }) => {
  // Null check and proper typing for data
  if (!data) {
    return (
      <GlassCard variant="medium" className="w-72 border-2 border-red-400">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">Invalid Trigger Node</p>
        </div>
      </GlassCard>
    );
  }

  const [isValidated, setIsValidated] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Type assertion to ensure TypeScript knows the correct type
  const nodeData = data as TriggerNodeData;

  // Safe destructuring with proper typing and defaults
  const {
    label = 'Untitled Trigger',
    description = 'No description available',
    triggerType = 'manual',
    status = 'ready',
    color = 'from-emerald-500 to-green-600',
    icon: TriggerIcon,
    config = {},
    schedule,
    webhook
  } = nodeData;

  const getStatusColor = useCallback((status: TriggerNodeData['status']) => {
    switch (status) {
      case 'ready': return 'border-emerald-400 shadow-emerald-400/30';
      case 'active': return 'border-green-400 shadow-green-400/30 animate-pulse';
      case 'triggered': return 'border-yellow-400 shadow-yellow-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  }, []);

  const getTriggerIcon = useCallback((type: TriggerNodeData['triggerType']) => {
    switch (type) {
      case 'manual': return Play;
      case 'schedule': return Calendar;
      case 'webhook': return Globe;
      case 'event': return Zap;
      default: return Play;
    }
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfig(!showConfig);
  }, [showConfig]);

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (triggerType === 'manual' && status === 'ready') {
      // Simulate trigger activation
      console.log(`Manual trigger activated: ${label}`);
    }
  }, [triggerType, status, label]);

  // Validate trigger configuration
  useEffect(() => {
    const validate = () => {
      switch (triggerType) {
        case 'webhook':
          return !!(webhook?.url && webhook?.method);
        case 'schedule':
          return !!(schedule?.frequency);
        case 'event':
          return !!(config?.event);
        case 'manual':
        default:
          return true;
      }
    };
    setIsValidated(validate());
  }, [triggerType, webhook, schedule, config]);

  const IconComponent = TriggerIcon || getTriggerIcon(triggerType);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${selected ? 'z-10' : ''}`}
    >
      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-72 border-2 ${getStatusColor(status)} ${
          selected ? 'ring-2 ring-emerald-400/50' : ''
        } ${!isValidated ? 'border-yellow-400/50' : ''} transition-all duration-200`}
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
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                />
                <IconComponent className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {label}
                </h3>
                <p className="text-emerald-300 text-xs capitalize">
                  {triggerType} trigger
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-400 animate-pulse' :
                  status === 'triggered' ? 'bg-yellow-400' :
                  status === 'error' ? 'bg-red-400' : 'bg-emerald-400'
                }`} />
                <span className="text-xs text-white capitalize">{status}</span>
              </div>
              
              {/* Validation indicator */}
              {!isValidated && (
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                </div>
              )}
              
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

          {/* Trigger Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Trigger Details</span>
              <span className="text-emerald-400 text-xs">
                {triggerType === 'schedule' ? 'Schedule Active' :
                 triggerType === 'webhook' ? 'Endpoint Ready' :
                 triggerType === 'event' ? 'Event Listener' :
                 'Manual Control'}
              </span>
            </div>

            {/* Configuration Preview */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              {triggerType === 'schedule' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Frequency</span>
                    <span className="text-xs text-white">
                      {schedule?.frequency || 'Weekly'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Next Run</span>
                    <span className="text-xs text-white">
                      {schedule?.nextRun || 'Today 9:00 AM'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Timezone</span>
                    <span className="text-xs text-white">
                      {schedule?.timezone || 'UTC'}
                    </span>
                  </div>
                </div>
              )}

              {triggerType === 'webhook' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Method</span>
                    <span className="text-xs text-white">
                      {webhook?.method || 'POST'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">URL</span>
                    <span className="text-xs text-white">
                      {webhook?.url || '/webhook/trigger'}
                    </span>
                  </div>
                  {webhook?.headers && Object.keys(webhook.headers).length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Headers</span>
                      <span className="text-xs text-white">
                        {Object.keys(webhook.headers).length} configured
                      </span>
                    </div>
                  )}
                </div>
              )}

              {triggerType === 'event' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Event Type</span>
                    <span className="text-xs text-white">
                      {config?.eventType || 'Data Change'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Source</span>
                    <span className="text-xs text-white">
                      {config?.source || 'Database'}
                    </span>
                  </div>
                </div>
              )}

              {triggerType === 'manual' && (
                <div className="flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTriggerClick}
                    className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                    disabled={status === 'active' || status === 'triggered'}
                  >
                    <Play className="w-3 h-3" />
                    <span className="text-xs">
                      {status === 'active' ? 'Running...' : 
                       status === 'triggered' ? 'Triggered' : 'Trigger Now'}
                    </span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Indicator */}
          {status === 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Activity</span>
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-green-400">Active & Listening</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Indicator */}
          {status === 'triggered' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-xs font-medium">Trigger activated successfully</span>
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
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-xs font-medium">
                  {config?.errorMessage || 'Trigger failed'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Configuration Panel */}
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-emerald-400" />
                Configuration Details
              </h5>
              <div className="space-y-2 text-xs">
                <div className="bg-white/5 rounded p-2">
                  <div className="text-gray-400">Type</div>
                  <div className="text-emerald-400 font-medium capitalize">{triggerType}</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-gray-400">Status</div>
                  <div className="text-white font-medium capitalize">{status}</div>
                </div>
                {triggerType === 'schedule' && schedule?.nextRun && (
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-gray-400">Next Execution</div>
                    <div className="text-blue-400 font-medium">{schedule.nextRun}</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Validation Errors */}
          {!isValidated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-yellow-500/20"
            >
              <div className="flex items-center text-xs text-yellow-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Configuration required for {triggerType} trigger
              </div>
            </motion.div>
          )}
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 rounded-2xl opacity-20 blur-lg -z-10"
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

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />
    </motion.div>
  );
});

TriggerNode.displayName = 'TriggerNode';