import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { 
  Home, 
  Users, 
  Layers, 
  Settings, 
  BarChart, 
  Bell, 
  Search,
  LogOut,
  Menu,
  X,
  User,
  UserCircle,
  Plus,
  LayersIcon,
  Bot,
  GitMerge
} from 'lucide-react';
import { GlassCard } from './GlassCard';

interface NavBarProps {
  className?: string;
}

export const NavBar: React.FC<NavBarProps> = ({
  className = ''
}) => {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Update active section based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('dashboard')) setActiveSection('dashboard');
    else if (path.includes('guild')) setActiveSection('guilds');
    else if (path.includes('agent')) setActiveSection('agents');
    else if (path.includes('analytics')) setActiveSection('analytics');
    else if (path.includes('settings')) setActiveSection('settings');
  }, [location]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'guilds', label: 'Guilds', icon: Layers, path: '/guilds' },
    { id: 'agents', label: 'Agents', icon: Users, path: '/agents' },
    { id: 'analytics', label: 'Analytics', icon: BarChart, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  return (
    <div className={`${className}`}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-col h-screen bg-white/10 backdrop-blur-md border-r border-white/10 p-4 w-64">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <span className="ml-3 text-xl font-semibold text-white">GenesisOS</span>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive || activeSection === item.id
                        ? 'bg-purple-500/20 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                  {item.id === activeSection && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="w-1 h-6 bg-purple-500 absolute right-0 rounded-l-full"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile */}
        <div className="mt-auto">
          <GlassCard variant="subtle" className="p-3">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-white">{user?.name || 'Guest User'}</div>
                <div className="text-xs text-gray-400">{user?.email || 'Guest Mode'}</div>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="ml-2 text-lg font-semibold text-white">GenesisOS</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-black/80 backdrop-blur-md"
            >
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map(item => (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => 
                          `flex items-center px-4 py-3 rounded-lg transition-colors ${
                            isActive || activeSection === item.id
                              ? 'bg-purple-500/20 text-white'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface AnimatePresenceProps {
  children: React.ReactNode;
  mode?: 'sync' | 'wait';
}

// This is a simple mock of AnimatePresence to avoid dependency issues
const AnimatePresence: React.FC<AnimatePresenceProps> = ({ children }) => {
  return <>{children}</>;
};