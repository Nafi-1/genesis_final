import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  BarChart3, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Network,
  TrendingUp,
  Settings,
  Eye,
  Download,
  RefreshCw,
  Mic,
  Volume2,
  MessageSquare
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { simulationService } from '../../services/simulationService';
import { SimulationLab } from './SimulationLab';
import { ReactFlowProvider } from '@xyflow/react';

interface EnhancedSimulationLabProps {
  guildId: string;
  agents: any[];
  onResults?: (results: any) => void;
  advanced?: boolean;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({
  guildId,
  agents,
  onResults,
  advanced = false
}) => {
  // Use the SimulationLab component with ReactFlowProvider
  return (
    <ReactFlowProvider>
      <SimulationLab 
        guildId={guildId} 
        agents={agents} 
        onResults={onResults} 
      />
    </ReactFlowProvider>
  );
};