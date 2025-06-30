import React, { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Clock, Timer, MoreHorizontal, Pause, CheckCircle, Settings, Play, AlertCircle } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import type { DelayNodeData } from '../../../types/canvas';

// Component with proper typing
interface DelayNodeProps {
  data: DelayNodeData;
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

export const DelayNode = memo<DelayNodeProps>(({ data, selected = false }) => {
  // Null check and proper typing for data
  if (!data) {
    return (
      <GlassCard variant="medium" className="w-64 border-2 border-red-400">
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300">Invalid Delay Node</p>
        </div>
      </GlassCard>
    );
  }

  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState('');

  // Type assertion to ensure TypeScript knows the correct type
  const nodeData = data as DelayNodeData;

  // Safe destructuring with proper typing and defaults
  const {
    label = 'Untitled Delay',
    description = 'No description available',
    delayType = 'fixed',
    duration = '5s',
    status = 'ready',
    color = 'from-violet-500 to-purple-600',
    icon: DelayIcon
  } = nodeData;

  // Calculate remaining time and progress when waiting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'waiting') {
      // Parse duration string (e.g., "5s", "2m", "1h")
      const durationMatch = duration.match(/(\d+)([smh])/);
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        
        let totalSeconds = 0;
        switch (unit) {
          case 's': totalSeconds = value; break;
          case 'm': totalSeconds = value * 60; break;
          case 'h': totalSeconds = value * 3600; break;
        }

        let elapsedSeconds = 0;
        interval = setInterval(() => {
          elapsedSeconds++;
          const progressPercent = (elapsedSeconds / totalSeconds) * 100;
          setProgress(Math.min(progressPercent, 100));

          const remaining = Math.max(totalSeconds - elapsedSeconds, 0);
          const minutes = Math.floor(remaining / 60);
          const seconds = remaining % 60;
          setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);

          if (elapsedSeconds >= totalSeconds) {
            clearInterval(interval);
            setProgress(100);
            setRemainingTime('0:00');
          }
        }, 1000);
      }
    } else {
      setProgress(0);
      setRemainingTime('');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, duration]);

  const getStatusColor = useCallback((status: DelayNodeData['status']) => {
    switch (status) {
      case 'ready': return 'border-violet-400 shadow-violet-400/30';
      case 'waiting': return 'border-yellow-400 shadow-yellow-400/30 animate-pulse';
      case 'paused': return 'border-gray-400 shadow-gray-400/30';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  }, []);

  const getDelayIcon = useCallback((type: DelayNodeData['delayType']) => {
    switch (type) {
      case 'fixed': return Clock;
      case 'dynamic': return Timer;
      case 'conditional': return Settings;
      default: return Clock;
    }
  }, []);

  const getStatusIcon = useCallback((status: DelayNodeData['status']) => {
    switch (status) {
      case 'waiting': return <Timer className="w-3 h-3 text-yellow-400" />;
      case 'paused': return <Pause className="w-3 h-3 text-gray-400" />;
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'ready': return <div className="w-2 h-2 bg-violet-400 rounded-full" />;
      case 'error': return <div className="w-2 h-2 bg-red-400 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  }, []);

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Add your more actions logic here
  }, []);

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'ready') {
      console.log(`Delay started: ${label}`);
    }
  }, [status, label]);

  const IconComponent = DelayIcon || getDelayIcon(delayType);

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
        className="w-3 h-3 bg-violet-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />

      {/* Main Node */}
      <GlassCard 
        variant="medium" 
        className={`w-64 border-2 ${getStatusColor(status)} ${
          selected ? 'ring-2 ring-violet-400/50' : ''
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
                  animate={{ rotate: status === 'waiting' ? 360 : 0 }}
                  transition={{ 
                    duration: 7, 
                    repeat: status === 'waiting' ? Infinity : 0, 
                    ease: "linear" 
                  }}
                />
                <IconComponent className="w-6 h-6 text-white relative z-10" />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  {label}
                </h3>
                <p className="text-violet-300 text-xs capitalize">
                  {delayType} delay
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full">
                {getStatusIcon(status)}
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

          {/* Delay Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-medium">Delay Details</span>
              <span className="text-violet-400 text-xs">
                {delayType === 'fixed' ? 'Fixed Duration' :
                 delayType === 'dynamic' ? 'Dynamic Duration' :
                 delayType === 'conditional' ? 'Conditional Delay' :
                 'Standard Delay'}
              </span>
            </div>

            {/* Configuration Preview */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span className="text-white text-sm font-medium">{duration}</span>
              </div>
              
              {status === 'waiting' && (
                <div className="space-y-2">
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <motion.div
                      className="h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Waiting...</span>
                    <span>{remainingTime || 'Calculating...'} remaining</span>
                  </div>
                </div>
              )}

              {delayType === 'dynamic' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Min Duration</span>
                    <span className="text-xs text-white">1s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Max Duration</span>
                    <span className="text-xs text-white">30s</span>
                  </div>
                </div>
              )}

              {delayType === 'conditional' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Condition</span>
                    <span className="text-xs text-white">When ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Timeout</span>
                    <span className="text-xs text-white">60s</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Animation */}
          {status === 'waiting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  className="w-2 h-2 bg-violet-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-violet-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-violet-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}

          {/* Completed State */}
          {status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Delay completed</span>
              </div>
            </motion.div>
          )}

          {/* Paused State */}
          {status === 'paused' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <Pause className="w-4 h-4" />
                <span className="text-xs font-medium">Delay paused</span>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-center space-x-2 text-red-400">
                <Timer className="w-4 h-4" />
                <span className="text-xs font-medium">Delay execution failed</span>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: selected ? 1 : 0, 
              height: selected ? 'auto' : 0 
            }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleTriggerClick}
                  className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center hover:bg-violet-500/30 transition-colors"
                  aria-label="Start delay"
                  disabled={status === 'waiting' || status === 'completed'}
                >
                  <Play className="w-3 h-3 text-violet-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-3 h-3 text-blue-400" />
                </motion.button>
              </div>
              
              <span className="text-xs text-gray-400">
                Delay ID: {label.toLowerCase().replace(/\s+/g, '-')}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Glow Effect */}
        {selected && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl opacity-20 blur-lg -z-10"
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
        className="w-3 h-3 bg-violet-400 border-2 border-white shadow-lg"
        style={{ zIndex: 10 }}
      />
    </motion.div>
  );
});

DelayNode.displayName = 'DelayNode';