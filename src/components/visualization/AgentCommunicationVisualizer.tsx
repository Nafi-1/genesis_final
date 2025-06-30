import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Zap, 
  Settings, 
  RefreshCw, 
  Clock, 
  Brain,
  Database,
  Activity,
  BarChart,
  EyeOff,
  Eye,
  Search,
  Maximize2,
  Minimize2,
  Filter,
  HelpCircle,
  Play,
  Pause,
  ArrowRight,
  X
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { ReactFlowProvider } from '@xyflow/react';

interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  status: 'active' | 'paused' | 'error' | 'idle';
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'request' | 'response' | 'broadcast' | 'system';
  metadata?: Record<string, any>;
}

interface ConnectionStats {
  from: string;
  to: string;
  messageCount: number;
  averageResponseTime: number;
  lastMessageTime: Date;
}

interface AgentCommunicationVisualizerProps {
  agents: Agent[];
  className?: string;
  onAgentClick?: (agentId: string) => void;
  onMessageClick?: (message: Message) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AgentCommunicationVisualizer: React.FC<AgentCommunicationVisualizerProps> = ({
  agents,
  className = '',
  onAgentClick,
  onMessageClick,
  autoRefresh = false,
  refreshInterval = 5000
}) => {
  // Visualization state
  const [messages, setMessages] = useState<Message[]>([]);
  const [connections, setConnections] = useState<ConnectionStats[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [visMode, setVisMode] = useState<'network' | 'timeline'>('network');
  const [showLabels, setShowLabels] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // SVG Container ref
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Layout state
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});
  
  // Initialize visualization
  useEffect(() => {
    fetchCommunicationData();
    calculateInitialPositions();
    
    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(fetchCommunicationData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [agents]);
  
  // Recalculate dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        calculateInitialPositions();
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [svgRef.current]);
  
  // Fetch communication data
  const fetchCommunicationData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock messages
      const mockMessages = generateMockMessages(agents, 20);
      setMessages(mockMessages);
      
      // Generate connection statistics
      const connectionStats = calculateConnectionStats(mockMessages);
      setConnections(connectionStats);
    } catch (error) {
      console.error('Failed to fetch communication data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate initial agent positions
  const calculateInitialPositions = () => {
    const positions: Record<string, { x: number, y: number }> = {};
    
    // Calculate positions in a circle
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.4;
    
    agents.forEach((agent, index) => {
      const angle = (index * 2 * Math.PI) / agents.length;
      
      positions[agent.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    setPositions(positions);
  };
  
  // Calculate connection statistics
  const calculateConnectionStats = (messages: Message[]): ConnectionStats[] => {
    const connectionMap = new Map<string, {
      count: number;
      responseTimes: number[];
      lastTime: Date;
    }>();
    
    // Analyze messages to build connection stats
    messages.forEach(message => {
      const key = `${message.from}-${message.to}`;
      
      if (!connectionMap.has(key)) {
        connectionMap.set(key, {
          count: 0,
          responseTimes: [],
          lastTime: message.timestamp
        });
      }
      
      const connection = connectionMap.get(key)!;
      connection.count += 1;
      connection.lastTime = message.timestamp;
      
      // Calculate response time for responses
      if (message.type === 'response') {
        const requestKey = `${message.to}-${message.from}`;
        const request = connectionMap.get(requestKey);
        
        if (request) {
          const responseTime = message.timestamp.getTime() - request.lastTime.getTime();
          connection.responseTimes.push(responseTime);
        }
      }
    });
    
    // Convert map to array
    return Array.from(connectionMap.entries()).map(([key, data]) => {
      const [from, to] = key.split('-');
      
      const avgResponseTime = data.responseTimes.length > 0
        ? data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length
        : 0;
      
      return {
        from,
        to,
        messageCount: data.count,
        averageResponseTime: avgResponseTime,
        lastMessageTime: data.lastTime
      };
    });
  };
  
  // Generate mock messages for testing
  const generateMockMessages = (agents: Agent[], count: number): Message[] => {
    const messages: Message[] = [];
    let timestamp = new Date(Date.now() - count * 60000); // Start from 'count' minutes ago
    
    for (let i = 0; i < count; i++) {
      // Advance time by 1-3 minutes
      timestamp = new Date(timestamp.getTime() + (Math.random() * 120000 + 60000));
      
      // Select random agents for communication
      const fromIndex = Math.floor(Math.random() * agents.length);
      let toIndex = Math.floor(Math.random() * agents.length);
      while (toIndex === fromIndex) {
        toIndex = Math.floor(Math.random() * agents.length);
      }
      
      const fromAgent = agents[fromIndex];
      const toAgent = agents[toIndex];
      
      // Message types
      const messageTypes: ('request' | 'response' | 'broadcast' | 'system')[] = 
        ['request', 'response', 'broadcast', 'system'];
      const type = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      
      // Generate message content based on type
      let content = '';
      if (type === 'request') {
        content = `Requesting data about ${Math.random() > 0.5 ? 'customer analytics' : 'product information'}`;
      } else if (type === 'response') {
        content = `Here's the ${Math.random() > 0.5 ? 'customer data' : 'product details'} you requested`;
      } else if (type === 'broadcast') {
        content = `Alert: ${Math.random() > 0.5 ? 'New data available' : 'System update completed'}`;
      } else {
        content = `System notification: ${Math.random() > 0.5 ? 'Memory optimized' : 'Performance metrics updated'}`;
      }
      
      messages.push({
        id: `msg-${i}`,
        from: type === 'system' ? 'system' : fromAgent.id,
        to: type === 'broadcast' ? 'broadcast' : toAgent.id,
        content,
        timestamp,
        type,
        metadata: {
          size: Math.floor(Math.random() * 1000) + 100,
          priority: Math.random() > 0.8 ? 'high' : 'normal'
        }
      });
    }
    
    // Sort by timestamp
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };
  
  // Handle agent selection
  const handleAgentClick = (agentId: string) => {
    setSelectedAgent(selectedAgent === agentId ? null : agentId);
    if (onAgentClick) {
      onAgentClick(agentId);
    }
  };
  
  // Handle message selection
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(selectedMessage === message.id ? null : message.id);
    if (onMessageClick) {
      onMessageClick(message);
    }
  };
  
  // Toggle auto-play
  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Get connection line style based on connection stats
  const getConnectionStyle = (from: string, to: string) => {
    const connection = connections.find(c => c.from === from && c.to === to);
    
    if (!connection) return { stroke: '#4B5563', strokeWidth: 1, opacity: 0.3 };
    
    // Scale stroke width based on message count
    const maxMessages = Math.max(...connections.map(c => c.messageCount));
    const strokeWidth = 1 + (connection.messageCount / maxMessages) * 3;
    
    // Scale opacity based on recency
    const mostRecent = new Date(Math.max(...connections.map(c => c.lastMessageTime.getTime())));
    const timeDiff = mostRecent.getTime() - connection.lastMessageTime.getTime();
    const maxDiff = 3600000; // 1 hour
    const opacity = Math.max(0.3, 1 - (timeDiff / maxDiff));
    
    // Color based on average response time
    // Lower is better (green), higher is worse (red)
    let stroke = '#10B981'; // Green for fast
    if (connection.averageResponseTime > 5000) {
      stroke = '#EF4444'; // Red for slow
    } else if (connection.averageResponseTime > 1000) {
      stroke = '#F59E0B'; // Yellow for moderate
    }
    
    return { stroke, strokeWidth, opacity };
  };
  
  // Render network visualization
  const renderNetworkVisualization = () => {
    return (
      <svg
        ref={svgRef}
        width="100%"
        height="500"
        className="rounded-lg bg-gray-900/50 border border-white/5"
      >
        {/* Grid Background */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path 
            d="M 20 0 L 0 0 0 20" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Connections */}
        {connections.map((connection) => {
          // Skip if either agent is not shown
          if (!showInactive) {
            const fromAgent = agents.find(a => a.id === connection.from);
            const toAgent = agents.find(a => a.id === connection.to);
            
            if ((fromAgent && fromAgent.status === 'idle') || 
                (toAgent && toAgent.status === 'idle')) {
              return null;
            }
          }
          
          // Skip system/broadcast connections in some cases
          if (connection.from === 'system' || connection.to === 'broadcast') {
            if (!positions[connection.from]) return null;
          }
          
          // Get positions
          const fromPos = positions[connection.from];
          const toPos = positions[connection.to];
          
          if (!fromPos || !toPos) return null;
          
          // Get connection style
          const { stroke, strokeWidth, opacity } = getConnectionStyle(connection.from, connection.to);
          
          // Calculate control points for curved lines
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // More curved for longer distances
          const curvature = 0.2 + (distance / 500) * 0.3;
          
          // Control point offset perpendicular to the line
          const mx = fromPos.x + dx * 0.5;
          const my = fromPos.y + dy * 0.5;
          const ux = -dy / distance;
          const uy = dx / distance;
          
          const controlX = mx + ux * curvature * distance;
          const controlY = my + uy * curvature * distance;
          
          // Path and animation
          return (
            <g key={`${connection.from}-${connection.to}`}>
              {/* Base connection line */}
              <path
                d={`M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeLinecap="round"
              />
              
              {/* Message animation particle */}
              <motion.circle
                cx={fromPos.x}
                cy={fromPos.y}
                r={3}
                fill="white"
                initial={{ offset: 0 }}
                animate={{ offset: 1 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "linear"
                }}
                style={{
                  offsetPath: `path("M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}")`,
                  offsetRotate: "0deg"
                }}
              />
              
              {/* Message count label */}
              {connection.messageCount > 1 && (
                <text
                  x={controlX}
                  y={controlY}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  dy="-5"
                >
                  {connection.messageCount}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Agents */}
        {agents.map((agent) => {
          // Skip inactive agents if not showing them
          if (!showInactive && agent.status === 'idle') {
            return null;
          }
          
          const pos = positions[agent.id];
          if (!pos) return null;
          
          const isSelected = selectedAgent === agent.id;
          
          return (
            <g 
              key={agent.id}
              onClick={() => handleAgentClick(agent.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Selection highlight */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={35}
                  fill="rgba(79, 70, 229, 0.2)"
                  stroke="#4F46E5"
                  strokeWidth={1.5}
                />
              )}
              
              {/* Agent circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={25}
                fill={
                  agent.status === 'active' ? 'rgba(16, 185, 129, 0.2)' :
                  agent.status === 'paused' ? 'rgba(245, 158, 11, 0.2)' :
                  agent.status === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                  'rgba(107, 114, 128, 0.2)'
                }
                stroke={
                  agent.status === 'active' ? '#10B981' :
                  agent.status === 'paused' ? '#F59E0B' :
                  agent.status === 'error' ? '#EF4444' :
                  '#6B7280'
                }
                strokeWidth={2}
              />
              
              {/* Agent icon */}
              <foreignObject
                x={pos.x - 12.5}
                y={pos.y - 12.5}
                width={25}
                height={25}
                style={{ pointerEvents: 'none' }}
              >
                <div className="flex items-center justify-center w-full h-full">
                  <Bot className={`w-5 h-5 ${
                    agent.status === 'active' ? 'text-green-400' :
                    agent.status === 'paused' ? 'text-yellow-400' :
                    agent.status === 'error' ? 'text-red-400' :
                    'text-gray-400'
                  }`} />
                </div>
              </foreignObject>
              
              {/* Agent label */}
              {showLabels && (
                <text
                  x={pos.x}
                  y={pos.y + 40}
                  fontSize="12"
                  fill="white"
                  textAnchor="middle"
                >
                  {agent.name}
                </text>
              )}
              
              {/* Status indicator */}
              <circle
                cx={pos.x + 20}
                cy={pos.y - 20}
                r={5}
                fill={
                  agent.status === 'active' ? '#10B981' :
                  agent.status === 'paused' ? '#F59E0B' :
                  agent.status === 'error' ? '#EF4444' :
                  '#6B7280'
                }
                stroke="white"
                strokeWidth={1}
              />
            </g>
          );
        })}
        
        {/* System node */}
        <g>
          <circle
            cx={dimensions.width / 2}
            cy={50}
            r={20}
            fill="rgba(139, 92, 246, 0.2)"
            stroke="#8B5CF6"
            strokeWidth={2}
          />
          <foreignObject
            x={dimensions.width / 2 - 10}
            y={50 - 10}
            width={20}
            height={20}
          >
            <div className="flex items-center justify-center w-full h-full">
              <Settings className="w-4 h-4 text-purple-400" />
            </div>
          </foreignObject>
          {showLabels && (
            <text
              x={dimensions.width / 2}
              y={50 + 35}
              fontSize="12"
              fill="white"
              textAnchor="middle"
            >
              System
            </text>
          )}
        </g>
        
        {/* Broadcast node */}
        <g>
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height - 50}
            r={20}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3B82F6"
            strokeWidth={2}
          />
          <foreignObject
            x={dimensions.width / 2 - 10}
            y={dimensions.height - 50 - 10}
            width={20}
            height={20}
          >
            <div className="flex items-center justify-center w-full h-full">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
          </foreignObject>
          {showLabels && (
            <text
              x={dimensions.width / 2}
              y={dimensions.height - 50 + 35}
              fontSize="12"
              fill="white"
              textAnchor="middle"
            >
              Broadcast
            </text>
          )}
        </g>
      </svg>
    );
  };
  
  // Render timeline visualization
  const renderTimelineVisualization = () => {
    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Filter inactive agents if needed
    const visibleAgents = showInactive 
      ? agents 
      : agents.filter(agent => agent.status !== 'idle');
    
    // Calculate rows for each agent
    const agentRows: Record<string, number> = {};
    visibleAgents.forEach((agent, index) => {
      agentRows[agent.id] = index;
    });
    
    // Add system and broadcast rows
    const rowHeight = 60;
    agentRows['system'] = visibleAgents.length;
    agentRows['broadcast'] = visibleAgents.length + 1;
    
    // Calculate timeline dimensions
    const timelineStart = sortedMessages.length > 0 
      ? sortedMessages[0].timestamp.getTime()
      : Date.now() - 3600000; // Default to 1 hour ago
      
    const timelineEnd = Date.now();
    const timelineWidth = dimensions.width - 160; // Leave space for agent labels
    
    // Convert timestamp to x position
    const timeToX = (time: number) => {
      return 130 + (time - timelineStart) / (timelineEnd - timelineStart) * timelineWidth;
    };
    
    return (
      <svg
        ref={svgRef}
        width="100%"
        height={Math.max(300, (visibleAgents.length + 2) * rowHeight + 50)} // +2 for system and broadcast
        className="rounded-lg bg-gray-900/50 border border-white/5"
      >
        {/* Background grid */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path 
            d="M 20 0 L 0 0 0 20" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth="1"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Agent lanes */}
        {Object.entries(agentRows).map(([agentId, rowIndex]) => {
          const y = rowIndex * rowHeight + 30;
          const agent = agents.find(a => a.id === agentId);
          const isSystem = agentId === 'system';
          const isBroadcast = agentId === 'broadcast';
          
          return (
            <g key={agentId}>
              {/* Lane background */}
              <rect
                x={0}
                y={y - rowHeight/2}
                width="100%"
                height={rowHeight}
                fill={rowIndex % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}
              />
              
              {/* Agent label */}
              <foreignObject
                x={5}
                y={y - 15}
                width={110}
                height={30}
              >
                <div className="flex items-center">
                  {isSystem ? (
                    <Settings className="w-5 h-5 text-purple-400 mr-2" />
                  ) : isBroadcast ? (
                    <Zap className="w-5 h-5 text-blue-400 mr-2" />
                  ) : (
                    <Bot className={`w-5 h-5 mr-2 ${
                      agent?.status === 'active' ? 'text-green-400' :
                      agent?.status === 'paused' ? 'text-yellow-400' :
                      agent?.status === 'error' ? 'text-red-400' :
                      'text-gray-400'
                    }`} />
                  )}
                  <span className="text-white text-xs truncate max-w-[80px]">
                    {isSystem ? 'System' : 
                     isBroadcast ? 'Broadcast' : 
                     agent?.name || agentId}
                  </span>
                </div>
              </foreignObject>
              
              {/* Timeline axis */}
              <line
                x1={130}
                y1={y}
                x2={dimensions.width - 10}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4 2"
                strokeWidth="1"
              />
            </g>
          );
        })}
        
        {/* Time axis markers - every 5 minutes */}
        {(() => {
          const markers = [];
          const interval = 5 * 60 * 1000; // 5 minutes
          let time = Math.floor(timelineStart / interval) * interval;
          
          while (time <= timelineEnd) {
            const x = timeToX(time);
            
            markers.push(
              <g key={`marker-${time}`}>
                <line
                  x1={x}
                  y1={20}
                  x2={x}
                  y2={(visibleAgents.length + 2) * rowHeight + 10}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={15}
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {new Date(time).toLocaleTimeString()}
                </text>
              </g>
            );
            
            time += interval;
          }
          
          return markers;
        })()}
        
        {/* Messages */}
        {sortedMessages.map(message => {
          // Skip if agent is not visible
          if (!showInactive) {
            const fromAgent = agents.find(a => a.id === message.from);
            const toAgent = agents.find(a => a.id === message.to);
            
            if ((fromAgent && fromAgent.status === 'idle') || 
                (toAgent && toAgent.status === 'idle')) {
              return null;
            }
          }
          
          const fromRow = agentRows[message.from];
          const toRow = agentRows[message.to === 'broadcast' ? 'broadcast' : message.to];
          
          if (fromRow === undefined || toRow === undefined) return null;
          
          const fromY = fromRow * rowHeight + 30;
          const toY = toRow * rowHeight + 30;
          const x = timeToX(message.timestamp.getTime());
          
          const isSelected = selectedMessage === message.id;
          
          return (
            <g
              key={message.id}
              onClick={() => handleMessageClick(message)}
              style={{ cursor: 'pointer' }}
            >
              {/* Message line */}
              <line
                x1={x}
                y1={fromY}
                x2={x}
                y2={toY}
                stroke={
                  message.type === 'request' ? '#3B82F6' :
                  message.type === 'response' ? '#10B981' :
                  message.type === 'broadcast' ? '#8B5CF6' :
                  '#6B7280'
                }
                strokeWidth={isSelected ? 2 : 1}
                opacity={isSelected ? 1 : 0.6}
              />
              
              {/* Message dot */}
              <circle
                cx={x}
                cy={toY}
                r={isSelected ? 5 : 3}
                fill={
                  message.type === 'request' ? '#3B82F6' :
                  message.type === 'response' ? '#10B981' :
                  message.type === 'broadcast' ? '#8B5CF6' :
                  '#6B7280'
                }
                stroke="white"
                strokeWidth={isSelected ? 1.5 : 0}
              />
              
              {/* Message tooltip */}
              {isSelected && (
                <>
                  <rect
                    x={x + 10}
                    y={Math.min(fromY, toY) + (Math.abs(toY - fromY) / 2) - 30}
                    width={150}
                    height={60}
                    rx={4}
                    fill="rgba(0,0,0,0.8)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                  />
                  <foreignObject
                    x={x + 10}
                    y={Math.min(fromY, toY) + (Math.abs(toY - fromY) / 2) - 30}
                    width={150}
                    height={60}
                  >
                    <div className="p-2">
                      <div className="text-xs font-medium text-white truncate">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Type: <span className={
                          message.type === 'request' ? 'text-blue-400' :
                          message.type === 'response' ? 'text-green-400' :
                          message.type === 'broadcast' ? 'text-purple-400' :
                          'text-gray-400'
                        }>{message.type}</span>
                      </div>
                    </div>
                  </foreignObject>
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  };
  
  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : ''}`}>
      <ReactFlowProvider>
      <GlassCard variant="medium" className={`${isFullscreen ? 'h-full' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Agent Communication</h3>
              <p className="text-gray-400 text-sm">
                Visualize inter-agent messaging patterns
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading && (
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin mr-2" />
            )}
            
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={fetchCommunicationData}
            >
              <RefreshCw className="w-4 h-4" />
            </HolographicButton>
            
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </HolographicButton>
          </div>
        </div>
        
        {/* Visualization Controls */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <HolographicButton
              variant={visMode === 'network' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setVisMode('network')}
            >
              <Brain className="w-4 h-4 mr-2" />
              Network
            </HolographicButton>
            
            <HolographicButton
              variant={visMode === 'timeline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setVisMode('timeline')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </HolographicButton>
          </div>
          
          <div className="flex items-center space-x-2">
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Labels
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Labels
                </>
              )}
            </HolographicButton>
            
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Inactive
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show All
                </>
              )}
            </HolographicButton>
            
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={toggleAutoPlay}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Auto-Play
                </>
              )}
            </HolographicButton>
          </div>
        </div>
        
        {/* Visualization Area */}
        <div className={`p-4 ${isFullscreen ? 'flex-grow overflow-y-auto' : ''}`}>
          {visMode === 'network' ? renderNetworkVisualization() : renderTimelineVisualization()}
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-300">Active Agent</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-300">Paused Agent</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-300">Error State</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-300">System</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-300">Broadcast</span>
            </div>
          </div>
        </div>
        
        {/* Agent Details Panel */}
        {selectedAgent && (
          <div className="bg-white/5 border-t border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Agent Details</h4>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setSelectedAgent(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {(() => {
              const agent = agents.find(a => a.id === selectedAgent);
              if (!agent) return null;
              
              // Calculate agent stats
              const sentMessages = messages.filter(m => m.from === agent.id).length;
              const receivedMessages = messages.filter(m => m.to === agent.id).length;
              const connectedAgents = new Set(
                [...messages.filter(m => m.from === agent.id).map(m => m.to),
                 ...messages.filter(m => m.to === agent.id).map(m => m.from)]
              ).size;
              
              return (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 mb-1">Role</div>
                    <div className="text-white">{agent.role}</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 mb-1">Status</div>
                    <div className={`flex items-center ${
                      agent.status === 'active' ? 'text-green-400' :
                      agent.status === 'paused' ? 'text-yellow-400' :
                      agent.status === 'error' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        agent.status === 'active' ? 'bg-green-400' :
                        agent.status === 'paused' ? 'bg-yellow-400' :
                        agent.status === 'error' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="capitalize">{agent.status}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 mb-1">Connections</div>
                    <div className="text-white">{connectedAgents} agents</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 mb-1">Messages Sent</div>
                    <div className="text-blue-400">{sentMessages}</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 mb-1">Messages Received</div>
                    <div className="text-purple-400">{receivedMessages}</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 mb-1">Last Active</div>
                    <div className="text-white">
                      {(() => {
                        const lastMessage = [...messages]
                          .filter(m => m.from === agent.id || m.to === agent.id)
                          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
                          
                        return lastMessage
                          ? lastMessage.timestamp.toLocaleTimeString()
                          : 'Never';
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Agent Actions */}
            <div className="mt-4 flex justify-end">
              <HolographicButton
                variant="outline"
                size="sm"
              >
                <Brain className="w-4 h-4 mr-2" />
                View Agent Debug
              </HolographicButton>
            </div>
          </div>
        )}
        
        {/* Selected Message Details */}
        {selectedMessage && (
          <div className="bg-white/5 border-t border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Message Details</h4>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setSelectedMessage(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {(() => {
              const message = messages.find(m => m.id === selectedMessage);
              if (!message) return null;
              
              const fromAgent = message.from === 'system' 
                ? { name: 'System', role: 'System' } 
                : agents.find(a => a.id === message.from) || { name: 'Unknown', role: 'Unknown' };
                
              const toAgent = message.to === 'broadcast'
                ? { name: 'Broadcast', role: 'All Agents' }
                : agents.find(a => a.id === message.to) || { name: 'Unknown', role: 'Unknown' };
              
              return (
                <div className="space-y-4">
                  {/* Message content */}
                  <div>
                    <h6 className="text-gray-400 text-sm mb-1">Content</h6>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-white">
                      {message.content}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-gray-400 text-sm mb-1">From</h6>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center">
                        {message.from === 'system' ? (
                          <Settings className="w-4 h-4 text-purple-400 mr-2" />
                        ) : (
                          <Bot className="w-4 h-4 text-blue-400 mr-2" />
                        )}
                        <div>
                          <div className="text-white text-sm">{fromAgent.name}</div>
                          <div className="text-gray-400 text-xs">{fromAgent.role}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-gray-400 text-sm mb-1">To</h6>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center">
                        {message.to === 'broadcast' ? (
                          <Zap className="w-4 h-4 text-blue-400 mr-2" />
                        ) : (
                          <Bot className="w-4 h-4 text-green-400 mr-2" />
                        )}
                        <div>
                          <div className="text-white text-sm">{toAgent.name}</div>
                          <div className="text-gray-400 text-xs">{toAgent.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h6 className="text-gray-400 text-sm mb-1">Type</h6>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-white capitalize">
                        {message.type}
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-gray-400 text-sm mb-1">Timestamp</h6>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-white">
                        {message.timestamp.toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-gray-400 text-sm mb-1">Size</h6>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-white">
                        {message.metadata?.size || '?'} bytes
                      </div>
                    </div>
                  </div>
                  
                  {/* Message Actions */}
                  <div className="flex justify-end mt-2">
                    <HolographicButton
                      variant="outline"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Trace Message Flow
                    </HolographicButton>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </GlassCard>
      </ReactFlowProvider>
    </div>
  );
};