import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface HolographicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  children: React.ReactNode;
}

export const HolographicButton: React.FC<HolographicButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white border-transparent shadow-lg shadow-purple-500/25';
      case 'secondary':
        return 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20';
      case 'outline':
        return 'bg-transparent text-white border-white/40 hover:bg-white/10';
      case 'ghost':
        return 'bg-transparent text-white/80 border-transparent hover:bg-white/10 hover:text-white';
      default:
        return 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white border-transparent shadow-lg shadow-purple-500/25';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'md':
        return 'px-6 py-3 text-base';
      case 'lg':
        return 'px-8 py-4 text-lg';
      case 'xl':
        return 'px-10 py-5 text-xl';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  // Filter out React event handlers that conflict with Framer Motion
  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onTransitionEnd,
    onDrag,
    onDragEnd,
    onDragStart,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerEnter,
    onPointerLeave,
    onPointerOver,
    onPointerOut,
    ...buttonProps
  } = props;

  return (
    <motion.button
      className={clsx(
        'relative overflow-hidden rounded-xl border font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      disabled={disabled}
      initial={false}
      animate={{
        scale: isPressed ? 0.98 : 1,
      }}
      whileHover={{
        scale: disabled ? 1 : 1.02,
        transition: { duration: 0.1 }
      }}
      whileTap={{
        scale: disabled ? 1 : 0.98,
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      {...buttonProps}
    >
      {/* Glow Effect */}
      {glow && !disabled && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-30 blur-md -z-10" />
      )}
      
      {/* Holographic Shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner Highlight */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 via-transparent to-transparent" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};