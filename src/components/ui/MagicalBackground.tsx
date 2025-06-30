import React from 'react';
import { motion } from 'framer-motion';

interface MagicalBackgroundProps {
  children: React.ReactNode;
  variant?: 'aurora' | 'nebula' | 'quantum' | 'cosmic';
  intensity?: 'subtle' | 'medium' | 'intense';
}

export const MagicalBackground: React.FC<MagicalBackgroundProps> = ({ 
  children, 
  variant = 'aurora',
  intensity = 'medium'
}) => {
  const getBackgroundClass = () => {
    const baseClasses = "relative min-h-screen overflow-hidden";
    
    switch (variant) {
      case 'aurora':
        return `${baseClasses} bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900`;
      case 'nebula':
        return `${baseClasses} bg-gradient-to-br from-violet-950 via-blue-900 to-cyan-900`;
      case 'quantum':
        return `${baseClasses} bg-gradient-to-br from-emerald-950 via-teal-900 to-blue-900`;
      case 'cosmic':
        return `${baseClasses} bg-gradient-to-br from-purple-950 via-pink-900 to-rose-900`;
      default:
        return `${baseClasses} bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900`;
    }
  };

  const particleCount = intensity === 'subtle' ? 20 : intensity === 'medium' ? 40 : 60;

  return (
    <div className={getBackgroundClass()}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: particleCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Aurora Effect */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/5 to-blue-400/10"
          animate={{
            background: [
              "linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(59, 130, 246, 0.1) 100%)",
              "linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(236, 72, 153, 0.1) 100%)",
              "linear-gradient(45deg, rgba(236, 72, 153, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(168, 85, 247, 0.1) 100%)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating Orbs */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-32 h-32 rounded-full blur-xl opacity-20"
          style={{
            background: i === 0 ? 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' :
                       i === 1 ? 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' :
                                'radial-gradient(circle, #ec4899 0%, transparent 70%)'
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "reverse"
          }}
        />
      ))}

      {/* Neural Network Grid */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};