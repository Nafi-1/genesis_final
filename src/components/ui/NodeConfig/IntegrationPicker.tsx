import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Plus, ChevronRight } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { integrationService, Integration, IntegrationType } from '../../../services/integrationService';

interface IntegrationPickerProps {
  onSelect: (integration: Integration) => void;
  onClose: () => void;
  title?: string;
  filterType?: IntegrationType;
}

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({
  onSelect,
  onClose,
  title = 'Select Integration',
  filterType
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationType | 'all'>('all');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);

  // Initialize integrations
  useEffect(() => {
    const allIntegrations = integrationService.getAllIntegrations();
    setIntegrations(allIntegrations);

    // Apply initial filter if provided
    if (filterType) {
      setSelectedCategory(filterType);
      setFilteredIntegrations(allIntegrations.filter(i => i.type === filterType));
    } else {
      setFilteredIntegrations(allIntegrations);
    }
  }, [filterType]);

  // Filter integrations when search query or category changes
  useEffect(() => {
    let filtered = integrations;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(integration => integration.type === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(integration =>
        integration.name.toLowerCase().includes(query) ||
        integration.description.toLowerCase().includes(query)
      );
    }

    setFilteredIntegrations(filtered);
  }, [searchQuery, selectedCategory, integrations]);

  // Get all unique categories
  const categories = [
    { id: 'all', name: 'All Integrations' },
    ...Object.values(IntegrationType).map(type => ({
      id: type,
      name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }))
  ];

  // Group integrations by type
  const groupedIntegrations = filteredIntegrations.reduce((acc, integration) => {
    const type = integration.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-4xl max-h-[80vh]"
      >
        <GlassCard variant="medium" className="p-6 max-h-[80vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>

            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </HolographicButton>
          </div>

          {/* Search and Categories */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
            {/* Search */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="w-full p-3 pl-10 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as IntegrationType | 'all')}
                  className={`px-3 py-1.5 rounded-full text-sm ${selectedCategory === category.id
                    ? 'bg-purple-500/30 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/20 text-gray-300'
                    } border transition-colors`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Integrations List */}
          <div className="flex-grow overflow-y-auto pr-2">
            {filteredIntegrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No integrations found matching your criteria</p>
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </HolographicButton>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Group by category if viewing all */}
                {selectedCategory === 'all' ? (
                  Object.entries(groupedIntegrations).map(([type, integrations]) => (
                    <div key={type} className="space-y-3">
                      <h3 className="text-lg font-medium text-white/80 mb-3 capitalize">
                        {type.replace('_', ' ')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {integrations.map(integration => (
                          <IntegrationCard
                            key={integration.id}
                            integration={integration}
                            onSelect={onSelect}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredIntegrations.map(integration => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

// Helper component for integration cards
const IntegrationCard: React.FC<{
  integration: Integration;
  onSelect: (integration: Integration) => void;
}> = ({ integration, onSelect }) => {
  // Map icon string to component
  const getIconComponent = () => {
    // In a real implementation, you would dynamically import the icon
    // For now, we'll use a simple div with the first letter
    return (
      <div className={`w-10 h-10 rounded-lg ${getIconColor(integration.type)} flex items-center justify-center text-white font-semibold text-xl`}>
        {integration.name.charAt(0)}
      </div>
    );
  };

  // Get color based on integration type
  const getIconColor = (type: IntegrationType): string => {
    switch (type) {
      case IntegrationType.SLACK:
        return 'bg-purple-500';
      case IntegrationType.EMAIL:
        return 'bg-blue-500';
      case IntegrationType.GOOGLE_SHEETS:
        return 'bg-green-500';
      case IntegrationType.GOOGLE_DRIVE:
        return 'bg-yellow-500';
      case IntegrationType.API:
        return 'bg-red-500';
      case IntegrationType.DATABASE:
        return 'bg-cyan-500';
      case IntegrationType.WEBHOOK:
        return 'bg-orange-500';
      case IntegrationType.VOICE:
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-colors"
      onClick={() => onSelect(integration)}
    >
      <div className="flex items-start mb-3">
        {getIconComponent()}

        <div className="ml-3 flex-grow">
          <h3 className="text-white font-medium">{integration.name}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{integration.description}</p>
        </div>

        <ChevronRight className="text-gray-400 w-5 h-5 ml-2 mt-1" />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {integration.actions.length > 0 && (
          <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/20 rounded-full text-blue-300 text-xs">
            {integration.actions.length} Actions
          </span>
        )}

        {integration.triggers && integration.triggers.length > 0 && (
          <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/20 rounded-full text-orange-300 text-xs">
            {integration.triggers.length} Triggers
          </span>
        )}

        <span className="px-2 py-1 bg-white/10 border border-white/10 rounded-full text-gray-300 text-xs capitalize">
          {integration.type.replace('_', ' ')}
        </span>
      </div>
    </motion.div>
  );
};