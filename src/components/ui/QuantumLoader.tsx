import React from 'react';
import { motion } from 'framer-motion';

interface QuantumLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const QuantumLoader: React.FC<QuantumLoaderProps> = ({ 
  size = 'md',
  color = 'purple' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      default:
        return 'w-12 h-12';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'purple':
        return 'border-purple-500';
      case 'blue':
        return 'border-blue-500';
      case 'pink':
        return 'border-pink-500';
      default:
        return 'border-purple-500';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`relative ${getSizeClasses()}`}>
        {/* Outer Ring */}
        <motion.div
          className={`absolute inset-0 rounded-full border-2 border-t-transparent ${getColorClasses()}`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Middle Ring */}
        <motion.div
          className={`absolute inset-1 rounded-full border-2 border-b-transparent ${getColorClasses()} opacity-60`}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Inner Ring */}
        <motion.div
          className={`absolute inset-2 rounded-full border-2 border-l-transparent ${getColorClasses()} opacity-30`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Center Pulse */}
        <motion.div
          className={`absolute inset-4 rounded-full bg-current opacity-20`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};