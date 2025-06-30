import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Bot, 
  ArrowRight, 
  Sparkles, 
  Save, 
  Wand2, 
  RotateCw,
  Zap,
  Code,
  Settings,
  PanelRight,
  AlertCircle
} from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { useCanvasStore } from '../../../stores/canvasStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { useCanvas } from '../../../hooks/useCanvas';
import { QuantumLoader } from '../../ui/QuantumLoader';

export const CanvasGenerationStep: React.FC = () => {
  const { blueprint, setStep } = useWizardStore();
  const { workflowNodes, workflowEdges } = useCanvasStore();
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [regenerationCount, setRegenerationCount] = useState(0);
  
  const {
    loadCanvasFromBlueprint,
    isLoading,
    error: canvasError
  } = useCanvas();

  // Generate canvas when component mounts
  useEffect(() => {
    if (blueprint && generationStatus === 'idle') {
      generateCanvas();
    }
  }, [blueprint]);

  const generateCanvas = async () => {
    if (!blueprint) return;
    
    setGenerationStatus('loading');
    
    try {
      await loadCanvasFromBlueprint();
      setGenerationStatus('success');
    } catch (error) {
      console.error('Failed to generate canvas:', error);
      setGenerationStatus('error');
    }
  };

  const regenerateCanvas = async () => {
    setRegenerationCount(prev => prev + 1);
    setGenerationStatus('loading');
    
    try {
      await loadCanvasFromBlueprint();
      setGenerationStatus('success');
    } catch (error) {
      console.error('Failed to regenerate canvas:', error);
      setGenerationStatus('error');
    }
  };

  const handleContinue = () => {
    setStep('canvas');
  };

  const handleCustomize = () => {
    setStep('canvas');
  };

  if (!blueprint) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Workflow className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Blueprint Required</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            We need your AI blueprint to create intelligent workflows. 
            Let's generate your architectural foundation first.
          </p>
          <HolographicButton onClick={() => setStep('intent')} glow>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Blueprint
          </HolographicButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.div
          className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <Workflow className="w-10 h-10 text-white relative z-10" />
        </motion.div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          {generationStatus === 'loading' ? 'Generating Visual Canvas' :
           generationStatus === 'success' ? 'Canvas Generated Successfully' :
           generationStatus === 'error' ? 'Canvas Generation Issue' :
           'Creating Your Workflow Canvas'}
        </h1>
        
        <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
          {generationStatus === 'loading' ? 'Transforming your blueprint into a visual, interactive workflow' :
           generationStatus === 'success' ? `Your workflow has been visualized with ${workflowNodes.length} nodes and ${workflowEdges.length} connections` :
           generationStatus === 'error' ? 'We encountered an issue while generating your canvas' :
           'Your blueprint is being transformed into an interactive visual workflow'}
        </p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <GlassCard variant="medium" glow className="p-8 mb-12">
          <div className="flex flex-col items-center">
            {generationStatus === 'loading' && (
              <div className="text-center mb-8">
                <QuantumLoader size="lg" color="purple" />
                
                <div className="mt-8 space-y-4 max-w-lg mx-auto">
                  <h3 className="text-white text-xl font-semibold">
                    Blueprint to Canvas Transformation
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: regenerationCount > 0 ? 0 : 1 }}
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                      <div className="text-left">
                        <p className="text-white font-medium">Blueprint Analysis</p>
                        <p className="text-gray-400 text-sm">Analyzing blueprint structure and components</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, delay: 1, repeat: regenerationCount > 0 ? 0 : 1 }}
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                      <div className="text-left">
                        <p className="text-white font-medium">Node Creation</p>
                        <p className="text-gray-400 text-sm">Generating agents, triggers, and workflow nodes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white"
                        animate={regenerationCount > 0 ? { scale: 1 } : { scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, delay: 2, repeat: 0 }}
                      >
                        {regenerationCount > 0 ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <RotateCw className="w-3 h-3 animate-spin" />
                        )}
                      </motion.div>
                      <div className="text-left">
                        <p className="text-white font-medium">Intelligent Layout</p>
                        <p className="text-gray-400 text-sm">Optimizing node positions and connections</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {generationStatus === 'success' && (
              <div className="text-center mb-8 w-full">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-6">
                  Canvas Ready for Customization
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <Bot className="w-8 h-8 text-purple-400 mb-3" />
                    <h4 className="text-lg font-medium text-white mb-2">AI Agents</h4>
                    <p className="text-gray-300 text-sm mb-3">Intelligent digital workers with specialized roles</p>
                    <div className="text-2xl font-bold text-purple-400">
                      {blueprint.suggested_structure.agents.length}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <Zap className="w-8 h-8 text-blue-400 mb-3" />
                    <h4 className="text-lg font-medium text-white mb-2">Workflow Steps</h4>
                    <p className="text-gray-300 text-sm mb-3">Automated actions and processes</p>
                    <div className="text-2xl font-bold text-blue-400">
                      {blueprint.suggested_structure.workflows.length}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <Code className="w-8 h-8 text-emerald-400 mb-3" />
                    <h4 className="text-lg font-medium text-white mb-2">Tool Integrations</h4>
                    <p className="text-gray-300 text-sm mb-3">Connected external services and APIs</p>
                    <div className="text-2xl font-bold text-emerald-400">
                      {blueprint.suggested_structure.agents.reduce(
                        (total, agent) => total + (agent.tools_needed?.length || 0), 
                        0
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 text-left">
                  <div className="flex items-center space-x-2 mb-4">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <h4 className="text-lg font-medium text-white">Canvas Features</h4>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">Drag-and-drop node positioning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">Real-time connection creation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">Node configuration panels</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">Workflow simulation capabilities</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <HolographicButton
                    onClick={regenerateCanvas}
                    variant="outline"
                    className="group"
                  >
                    <RotateCw className="w-4 h-4 mr-2 group-hover:text-purple-400 transition-colors" />
                    Regenerate Canvas
                  </HolographicButton>
                  
                  <HolographicButton
                    onClick={handleCustomize}
                    variant="primary"
                    glow
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Customize Canvas
                  </HolographicButton>
                </div>
              </div>
            )}

            {generationStatus === 'error' && (
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-3">
                  Canvas Generation Issue
                </h3>
                
                <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                  We encountered an issue while generating your canvas. This might be due to a complex blueprint structure or a temporary service interruption.
                </p>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <HolographicButton
                    onClick={regenerateCanvas}
                    variant="primary"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Retry Generation
                  </HolographicButton>
                  
                  <HolographicButton
                    onClick={handleCustomize}
                    variant="outline"
                    glow
                  >
                    <PanelRight className="w-4 h-4 mr-2" />
                    Continue to Canvas
                  </HolographicButton>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex justify-center"
      >
        {generationStatus === 'success' && (
          <HolographicButton 
            onClick={handleContinue} 
            size="xl" 
            glow
            className="group"
          >
            <Save className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" />
            <span className="text-xl">Continue to Canvas</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-3"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </HolographicButton>
        )}
      </motion.div>
    </div>
  );
};

// Helper components
const Check = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);