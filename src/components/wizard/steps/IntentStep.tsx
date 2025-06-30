import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lightbulb, Sparkles, Wand2, Brain, Target } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { QuantumLoader } from '../../ui/QuantumLoader';

export const IntentStep: React.FC = () => {
  const { user_input, setUserInput, generateBlueprint, errors, isLoading, clearErrors } = useWizardStore();
  const [localInput, setLocalInput] = useState(user_input);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(localInput.length);
  }, [localInput]);

  const examples = [
    {
      icon: Target,
      title: "Customer Success Automation",
      description: "Intelligent support with human touch",
      prompt: "Send weekly investor updates with real growth metrics and polished tone",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Brain,
      title: "Sales Intelligence Engine",
      description: "AI-powered revenue optimization",
      prompt: "Automate customer support with intelligent responses and escalation",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Sparkles,
      title: "Marketing Orchestrator",
      description: "Multi-channel growth automation",
      prompt: "Manage my social media content calendar and posting schedule",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Wand2,
      title: "Business Analytics Hub",
      description: "Data-driven decision automation",
      prompt: "Track and analyze competitor pricing with automated alerts",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const handleSubmit = async () => {
    if (!localInput.trim()) {
      return;
    }
    
    clearErrors();
    setUserInput(localInput);
    await generateBlueprint();
  };

  const handleExampleClick = (example: any, index: number) => {
    setSelectedExample(index);
    setLocalInput(example.prompt);
    
    // Auto-trigger after a short delay for smooth UX
    setTimeout(() => {
      setSelectedExample(null);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Share Your Vision
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Describe your business goal in natural language. Our AI architect will understand your intent 
            and create a complete digital blueprint with intelligent agents and workflows.
          </p>
        </motion.div>
      </div>

      {/* Main Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <GlassCard variant="medium" glow className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Describe Your Business Goal</h3>
              <p className="text-gray-300 text-sm">Tell me what you want to achieve, and I'll build it for you</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="I want to..."
              className="w-full h-32 p-6 bg-white/5 border border-white/20 rounded-xl resize-none text-white placeholder-gray-400 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              disabled={isLoading}
            />
            
            {/* Character Counter */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
              {charCount}/2000
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <div className="text-red-300 text-sm font-medium">
                  {errors[0]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <div className="mt-6 flex justify-center">
            <HolographicButton
              onClick={handleSubmit}
              disabled={!localInput.trim() || isLoading}
              size="lg"
              glow
              className="group relative overflow-hidden min-w-[200px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <QuantumLoader size="sm" color="white" />
                  <span>Creating Blueprint...</span>
                </div>
              ) : (
                <span className="flex items-center gap-3">
                  <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Generate Blueprint
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </span>
              )}
            </HolographicButton>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 text-center text-sm text-gray-400">
            💡 <strong>Pro tip:</strong> Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl + Enter</kbd> to generate instantly
          </div>
        </GlassCard>
      </motion.div>

      {/* Example Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            Need Inspiration? Try These Examples
          </h3>
          <p className="text-gray-300">
            Click any example to see how our AI architect transforms business goals into digital reality
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {examples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5 }}
              className="group cursor-pointer"
              onClick={() => handleExampleClick(example, index)}
            >
              <GlassCard 
                variant="subtle" 
                className={`p-6 h-full transition-all duration-300 group-hover:bg-white/15 ${
                  selectedExample === index ? 'ring-2 ring-purple-500/50 bg-white/15' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${example.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 10 }}
                  >
                    <example.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                      {example.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-3">{example.description}</p>
                    <p className="text-gray-300 text-sm italic bg-white/5 p-3 rounded-lg border border-white/10">
                      "{example.prompt}"
                    </p>
                  </div>
                </div>

                {selectedExample === index && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                  >
                    <div className="text-white font-semibold">Selected ✨</div>
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Advanced Features Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-center"
      >
        <GlassCard variant="subtle" className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-400 mr-3" />
            <h4 className="text-lg font-semibold text-white">Powered by Advanced AI</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Our AI architect uses Gemini 1.5 Pro to understand complex business requirements and generate 
            production-ready blueprints with intelligent agents, workflows, and integrations. 
            The more specific you are, the more precise your blueprint will be.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};