import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Users, Workflow, Brain, Rocket } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { NeuralNetwork } from '../../ui/NeuralNetwork';

export const WelcomeStep: React.FC = () => {
  const { setStep } = useWizardStore();

  const features = [
    {
      icon: Brain,
      title: 'Neural Blueprint Engine',
      description: 'Transform natural language into intelligent system architectures',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Sentient AI Workers',
      description: 'Deploy digital team members with personality and memory',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Workflow,
      title: 'Quantum Workflows',
      description: 'Create self-optimizing business processes that evolve',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Zap,
      title: 'Lightning Deployment',
      description: 'Go from idea to autonomous operation in minutes',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6">
      {/* Neural Network Background */}
      <NeuralNetwork nodes={25} connections={40} animate color="purple" />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100
          }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-3xl flex items-center justify-center mx-auto relative overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {/* Rotating inner glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-3xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Pulsing core */}
              <motion.div
                className="absolute inset-2 bg-white/10 rounded-2xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <span className="text-white font-bold text-4xl relative z-10">G</span>
            </motion.div>
            
            {/* Orbiting particles */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-purple-400 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  marginTop: "-6px",
                  marginLeft: "-6px"
                }}
                animate={{
                  rotate: 360,
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  rotate: { duration: 3 + i, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, delay: i * 0.5 }
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Main Headlines */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="block text-white">Welcome to</span>
            <motion.span 
              className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                backgroundSize: "200% 200%"
              }}
            >
              GenesisOS
            </motion.span>
          </h1>
          
          <motion.p 
            className="text-2xl md:text-3xl text-gray-300 mb-8 leading-relaxed max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            The world's first <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold">AI-native operating system</span> where 
            visionary founders build autonomous empires through pure intention
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <GlassCard variant="medium" className="p-6 h-full text-center group-hover:bg-white/15 transition-all duration-300">
                <motion.div 
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 10 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <GlassCard variant="medium" glow className="max-w-2xl mx-auto p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Build Your Digital Empire?
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Transform your business vision into an autonomous reality. Create your first Guild and experience 
                the power of AI workers that think, learn, and execute beyond human capability.
              </p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HolographicButton 
                  onClick={() => setStep('intent')} 
                  size="xl" 
                  glow
                  className="group relative overflow-hidden"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    Start Building
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Rocket className="w-6 h-6" />
                    </motion.div>
                  </span>
                </HolographicButton>
              </motion.div>
              
              <motion.p 
                className="mt-6 text-sm text-gray-400"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨ No signup required • 🚀 Deploy in minutes • 🧠 Infinite intelligence
              </motion.p>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};