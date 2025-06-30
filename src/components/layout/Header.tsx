import React from 'react';
import { UserCircle, LogOut, Settings, Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';

interface HeaderProps {
  isGuest?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isGuest = false }) => {
  const { user, signOut } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">GenesisOS</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
              Dashboard
            </a>
            <a href="/guilds" className="text-gray-600 hover:text-gray-900 font-medium">
              Guilds
            </a>
            <a href="/agents" className="text-gray-600 hover:text-gray-900 font-medium">
              Agents
            </a>
            <a href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">
              Marketplace
            </a>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="primary" size="sm" className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            Create Guild
          </Button>

          <div className="relative">
            <div className="flex items-center space-x-3">
              <UserCircle className="w-8 h-8 text-gray-600" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {isGuest ? 'Guest User' : user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {isGuest ? 'Guest Mode' : user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={isGuest ? () => window.location.reload() : signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};