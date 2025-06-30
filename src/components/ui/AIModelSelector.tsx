import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, BarChart, Zap, Clock, DollarSign, Cpu } from 'lucide-react';
import { aiService, AIModel } from '../../services/aiService';
import { GlassCard } from './GlassCard';

interface AIModelSelectorProps {
  onSelect: (modelId: string) => void;
  selectedModelId?: string;
  label?: string;
  className?: string;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  onSelect,
  selectedModelId = 'gemini-flash',
  label = 'AI Model',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get available models
  const models = aiService.getAvailableModels();
  
  // Get the currently selected model
  const selectedModel = models.find(model => model.id === selectedModelId) || models[0];
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm text-gray-300 mb-1">{label}</label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            selectedModel.provider === 'google' ? 'bg-blue-500/20 text-blue-400' :
            selectedModel.provider === 'openai' ? 'bg-green-500/20 text-green-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            <Brain className="w-4 h-4" />
          </div>
          
          <div className="text-left">
            <div className="text-sm font-medium">{selectedModel.name}</div>
            <div className="text-xs text-gray-400">
              {selectedModel.provider === 'google' ? 'Google AI' :
               selectedModel.provider === 'openai' ? 'OpenAI' :
               'Anthropic'}
            </div>
          </div>
        </div>
        
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-30 mt-1 w-full"
          >
            <GlassCard variant="medium" className="p-2">
              <div className="max-h-64 overflow-y-auto">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelect(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start space-x-3 p-3 rounded-lg ${
                      model.id === selectedModelId 
                        ? 'bg-purple-500/20 border border-purple-500/30' 
                        : 'hover:bg-white/10 border border-transparent'
                    } transition-colors mb-1 last:mb-0`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      model.provider === 'google' ? 'bg-blue-500/30 text-blue-300' :
                      model.provider === 'openai' ? 'bg-green-500/30 text-green-300' :
                      'bg-purple-500/30 text-purple-300'
                    }`}>
                      <Brain className="w-5 h-5" />
                    </div>
                    
                    <div className="text-left">
                      <div className="text-white font-medium flex items-center">
                        {model.name}
                        {model.id === 'gemini-flash' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 mt-1 mb-2">{model.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-full text-xs">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-gray-300">{model.contextWindow.toLocaleString()} tokens</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-full text-xs">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span className="text-gray-300">
                            {model.provider === 'google' ? 'Fast' :
                             model.provider === 'openai' ? 'Medium' :
                             'Standard'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-full text-xs">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          <span className="text-gray-300">
                            {model.pricing.output <= 2 ? '$' :
                             model.pricing.output <= 10 ? '$$' :
                             '$$$'}
                          </span>
                        </div>
                        
                        {model.status === 'coming_soon' && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                            Coming Soon
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};