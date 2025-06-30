import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface NeuralNetworkProps {
  nodes?: number;
  connections?: number;
  animate?: boolean;
  color?: string;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  nodes = 20,
  connections = 40,
  animate = true,
  color = 'purple'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !animate) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Generate random positions for nodes
    const nodePositions = Array.from({ length: nodes }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }));

    // Animation function
    const animateNodes = () => {
      nodePositions.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x < 0 || node.x > rect.width) node.vx *= -1;
        if (node.y < 0 || node.y > rect.height) node.vy *= -1;
        
        // Keep within bounds
        node.x = Math.max(0, Math.min(rect.width, node.x));
        node.y = Math.max(0, Math.min(rect.height, node.y));
      });
    };

    const interval = setInterval(animateNodes, 16);
    return () => clearInterval(interval);
  }, [nodes, animate]);

  const getColorClass = () => {
    switch (color) {
      case 'purple':
        return 'stroke-purple-400/30';
      case 'blue':
        return 'stroke-blue-400/30';
      case 'pink':
        return 'stroke-pink-400/30';
      default:
        return 'stroke-purple-400/30';
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ filter: 'blur(0.5px)' }}
      >
        {/* Generate network connections */}
        {Array.from({ length: connections }).map((_, i) => {
          const x1 = Math.random() * 100;
          const y1 = Math.random() * 100;
          const x2 = Math.random() * 100;
          const y2 = Math.random() * 100;
          
          return (
            <motion.line
              key={i}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              className={getColorClass()}
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 0.3, 0] 
              }}
              transition={{
                pathLength: { duration: 2 },
                opacity: { 
                  duration: 3, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }
              }}
            />
          );
        })}
        
        {/* Generate network nodes */}
        {Array.from({ length: nodes }).map((_, i) => {
          const cx = Math.random() * 100;
          const cy = Math.random() * 100;
          
          return (
            <motion.circle
              key={i}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r="2"
              className={`fill-current ${getColorClass().replace('stroke-', 'text-')}`}
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 1, 0.5, 1],
                opacity: [0, 1, 0.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};