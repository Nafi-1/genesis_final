import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../stores/wizardStore';
import { MagicalBackground } from '../ui/MagicalBackground';
import { WelcomeStep } from './steps/WelcomeStep';
import { IntentStep } from './steps/IntentStep';
import { BlueprintStep } from './steps/BlueprintStep';
import { CanvasGenerationStep } from './steps/CanvasGenerationStep';
import { EnhancedCanvasStep } from './steps/EnhancedCanvasStep';
import { CredentialsStep } from './steps/CredentialsStep';
import { SimulationStep } from './steps/SimulationStep';
import { DeploymentStep } from './steps/DeploymentStep';

const stepComponents = {
  welcome: WelcomeStep,
  intent: IntentStep,
  blueprint: BlueprintStep,
  'canvas-generation': CanvasGenerationStep,
  canvas: EnhancedCanvasStep,
  credentials: CredentialsStep,
  simulation: SimulationStep,
  deployment: DeploymentStep,
};

const stepTitles = {
  welcome: "Welcome to Genesis",
  intent: "Share Your Vision",
  blueprint: "AI Blueprint",
  "canvas-generation": "Canvas Generation",
  canvas: "Visual Canvas",
  credentials: "Connect Your Tools",
  simulation: "Test Your Guild",
  deployment: "Deploy & Scale"
};

const stepDescriptions = {
  welcome: "Enter the AI-native workspace revolution",
  intent: "Transform your vision into intelligent architecture",
  blueprint: "Review your AI-generated business structure",
  "canvas-generation": "Visualize your workflow with AI",
  canvas: "Design and customize your workflow visually",
  credentials: "Connect the tools your agents will use",
  simulation: "Test your AI workforce in a safe environment",
  deployment: "Launch your autonomous digital workforce"
};

export const EnhancedWizardFlow: React.FC = () => {
  const { step } = useWizardStore();
  const CurrentStepComponent = stepComponents[step];

  const stepIndex = Object.keys(stepComponents).indexOf(step);
  const totalSteps = Object.keys(stepComponents).length;

  return (
    <MagicalBackground variant="quantum" intensity="medium">
      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 w-full z-50">
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {stepTitles[step]}
                </h1>
                <p className="text-sm text-gray-300">
                  {stepDescriptions[step]}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-300">
                  Phase 2: Canvas & Workflow Engine
                </span>
                <div className="text-xs text-purple-300">
                  Step {stepIndex + 1} of {totalSteps}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {Object.keys(stepComponents).map((stepKey, index) => (
                <motion.div
                  key={stepKey}
                  className={`relative flex flex-col items-center ${
                    index <= stepIndex ? 'opacity-100' : 'opacity-40'
                  } transition-opacity duration-300`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index < stepIndex 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : index === stepIndex
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 ring-2 ring-purple-400/50'
                      : 'bg-white/20'
                  }`} />
                  <span className="text-xs text-gray-300 mt-1 capitalize">
                    {stepKey}
                  </span>
                  
                  {/* Active step glow */}
                  {index === stepIndex && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-purple-400/30 blur-sm -z-10"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Animation */}
      <div className="pt-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -50, rotateY: 10 }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              type: "spring",
              stiffness: 100
            }}
            style={{
              perspective: "1000px",
              transformStyle: "preserve-3d"
            }}
          >
            <CurrentStepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phase 2 Badge */}
    </MagicalBackground>
  );
};