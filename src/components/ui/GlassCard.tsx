import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'subtle' | 'medium' | 'intense';
  hover?: boolean;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'medium',
  hover = true,
  glow = false
}) => {
  const getGlassClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-2xl border";
    
    switch (variant) {
      case 'subtle':
        return `${baseClasses} bg-white/5 backdrop-blur-sm border-white/10`;
      case 'medium':
        return `${baseClasses} bg-white/10 backdrop-blur-md border-white/20`;
      case 'intense':
        return `${baseClasses} bg-white/15 backdrop-blur-lg border-white/30`;
      default:
        return `${baseClasses} bg-white/10 backdrop-blur-md border-white/20`;
    }
  };

  return (
    <motion.div
      className={clsx(getGlassClasses(), className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={hover ? {
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
    >
      {/* Glow Effect */}
      {glow && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-20 blur-lg" />
      )}
      
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};