import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Bot, Brain, Zap, Shield, Rocket, Play, Star, ChevronDown } from 'lucide-react';
import { MagicalBackground } from '../ui/MagicalBackground';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { NeuralNetwork } from '../ui/NeuralNetwork';

interface RevolutionaryLandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const RevolutionaryLanding: React.FC<RevolutionaryLandingProps> = ({ 
  onGetStarted, 
  onSignIn 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Bot,
      title: "Sentient Digital Workers",
      description: "AI agents with genuine personality, memory, and emotional intelligence that work like your best team members",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Brain,
      title: "Quantum Memory Systems",
      description: "Advanced neural networks that remember every interaction and evolve based on your business patterns",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Lightning Automation",
      description: "Deploy complex business processes in seconds, not weeks, with our intent-driven architecture",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Shield,
      title: "Fort Knox Security",
      description: "Enterprise-grade encryption with zero-trust architecture protecting your most sensitive data",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Rocket,
      title: "Infinite Scalability",
      description: "From startup to Fortune 500, our AI-native infrastructure grows with your ambitions",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: Star,
      title: "Prophetic Analytics",
      description: "Predictive intelligence that sees around corners and optimizes your business before you know you need it",
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  const testimonials = [
    {
      quote: "GenesisOS didn't just automate our business—it gave us superpowers. Our AI agents understand context better than most humans.",
      author: "Sarah Chen",
      role: "Founder, QuantumEdge",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      company: "QuantumEdge"
    },
    {
      quote: "I thought I understood AI until I met GenesisOS. This isn't automation—this is digital consciousness at work.",
      author: "Marcus Rodriguez",
      role: "CTO, FutureFlow",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      company: "FutureFlow"
    },
    {
      quote: "We deployed a complete sales pipeline in 10 minutes. Our revenue tripled in 30 days. This is magic.",
      author: "Emily Watson",
      role: "CEO, GrowthLabs",
      avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2",
      company: "GrowthLabs"
    }
  ];

  return (
    <MagicalBackground variant="aurora" intensity="intense">
      {/* Neural Network Overlay */}
      <NeuralNetwork nodes={30} connections={50} animate color="purple" />
      
      {/* Mouse Follower */}
      <motion.div
        className="fixed w-96 h-96 pointer-events-none z-0 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center space-x-4"
        >
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-white font-bold text-xl relative z-10">G</span>
            </div>
          </motion.div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              GenesisOS
            </span>
            <div className="text-xs text-purple-300/70 font-medium">AI-Native Operating System</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex items-center space-x-4"
        >
          <HolographicButton variant="ghost" onClick={onSignIn}>
            Sign In
          </HolographicButton>
          <HolographicButton variant="primary" glow onClick={onGetStarted}>
            Enter as Guest
          </HolographicButton>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          >
            {/* Status Badge */}
            <motion.div 
              className="inline-flex items-center px-6 py-3 mb-8"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <GlassCard variant="subtle" className="px-6 py-3">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="w-3 h-3 bg-emerald-400 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">The Future of Business is Here</span>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          >
            <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block">Build</span>
              <motion.span 
                className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                Godlike
              </motion.span>
              <span className="block">Companies</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
            className="text-xl lg:text-3xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto"
          >
            Where visionary founders create <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold">autonomous empires</span> with 
            AI workers that think, learn, and execute at superhuman scale
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <HolographicButton 
              onClick={onGetStarted} 
              size="xl" 
              glow
              className="group relative overflow-hidden"
            >
              <span className="flex items-center gap-3">
                Start Your Genesis
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </span>
            </HolographicButton>
            
            <HolographicButton 
              variant="outline" 
              size="xl"
              className="group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:text-purple-400 transition-colors" />
              Watch the Magic
            </HolographicButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 1.1 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { label: "AI Agents Deployed", value: "10,000+", suffix: "" },
              { label: "Avg Revenue Increase", value: "340", suffix: "%" },
              { label: "Setup Time", value: "< 3", suffix: "min" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {stat.value}<span className="text-purple-400">{stat.suffix}</span>
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-white/60"
            >
              <span className="text-sm mb-2">Discover the Power</span>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        style={{ y: y1 }}
        className="py-32 px-6 lg:px-12 relative"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Superhuman Capabilities
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Experience the convergence of artificial intelligence, quantum computing concepts, and human intuition 
              in one transcendent platform
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <GlassCard variant="medium" glow className="p-8 h-full">
                  <div className="flex flex-col h-full">
                    <motion.div 
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: 5 }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-300 leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        style={{ y: y2 }}
        className="py-32 px-6 lg:px-12 relative"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Legendary Founders
            </h2>
            <p className="text-xl text-gray-300">
              Join the visionaries who've already transcended traditional business limitations
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <GlassCard variant="medium" className="p-8 h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className="text-gray-300 text-lg leading-relaxed flex-grow mb-6">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="flex items-center">
                      <motion.img 
                        src={testimonial.avatar} 
                        alt={testimonial.author}
                        className="w-14 h-14 rounded-full mr-4 ring-2 ring-purple-400/50"
                        whileHover={{ scale: 1.1 }}
                      />
                      <div>
                        <div className="font-semibold text-white">{testimonial.author}</div>
                        <div className="text-purple-300 text-sm">{testimonial.role}</div>
                        <div className="text-gray-400 text-xs">{testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 lg:px-12 relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Ready to Ascend?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join the AI-native revolution. Create your first Guild and experience the power of 
              autonomous digital consciousness working for your vision.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HolographicButton 
                onClick={onGetStarted} 
                size="xl" 
                glow
                className="text-xl px-12 py-6"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Try GenesisOS Now
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="ml-3"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </HolographicButton>
            </motion.div>

            <p className="mt-8 text-sm text-gray-400">
              🚀 No signup required • 🧠 AI-powered experience • ⚡ Try all features instantly
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 lg:px-12 relative">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <span className="text-xl font-semibold text-white">GenesisOS</span>
              <div className="text-xs text-gray-400">The Future of Autonomous Business</div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 GenesisOS. Crafting divine-level business automation.
          </p>
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Built with Bolt.new
          </a>
        </div>
      </footer>
    </MagicalBackground>
  );
};