import React, { useState } from 'react';
import { X, Save, Trash2, Calendar, Globe, Zap, Play } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { TriggerNodeData } from '../../../types/canvas';

interface TriggerConfigProps {
  data: TriggerNodeData;
  onUpdate: (nodeId: string, data: Partial<TriggerNodeData>) => void;
  onDelete: (nodeId: string) => void;
  nodeId: string;
  onClose: () => void;
}

export const TriggerConfig: React.FC<TriggerConfigProps> = ({
  data,
  onUpdate,
  onDelete,
  nodeId,
  onClose
}) => {
  const [formData, setFormData] = useState<{
    label: string;
    description: string;
    triggerType: TriggerNodeData['triggerType'];
    config?: Record<string, any>;
    schedule?: {
      frequency?: string;
      nextRun?: string;
      timezone?: string;
    };
    webhook?: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    };
  }>({
    label: data.label,
    description: data.description,
    triggerType: data.triggerType,
    config: data.config || {},
    schedule: data.schedule,
    webhook: data.webhook,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTriggerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTriggerType = e.target.value as TriggerNodeData['triggerType'];
    setFormData({
      ...formData,
      triggerType: newTriggerType,
      // Initialize appropriate fields for the selected trigger type
      ...(newTriggerType === 'schedule' ? { 
        schedule: { 
          frequency: formData.schedule?.frequency || 'daily', 
          nextRun: formData.schedule?.nextRun || new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T09:00', 
          timezone: formData.schedule?.timezone || 'UTC' 
        } 
      } : {}),
      ...(newTriggerType === 'webhook' ? { 
        webhook: { 
          url: formData.webhook?.url || '/api/webhook', 
          method: formData.webhook?.method || 'POST', 
          headers: formData.webhook?.headers || {} 
        } 
      } : {}),
      ...(newTriggerType === 'event' ? { 
        config: { 
          ...formData.config, 
          event: formData.config?.event || 'data_updated', 
          source: formData.config?.source || 'database' 
        } 
      } : {})
    });
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleWebhookChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      webhook: {
        ...formData.webhook,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleEventConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(nodeId, {
      label: formData.label,
      description: formData.description,
      triggerType: formData.triggerType,
      schedule: formData.schedule,
      webhook: formData.webhook,
      config: formData.config
    });
    onClose();
  };

  return (
    <GlassCard variant="medium" className="w-96 p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Configure Trigger</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-white text-sm">Trigger Name</label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Trigger Type</label>
          <select
            name="triggerType"
            value={formData.triggerType}
            onChange={handleTriggerTypeChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="manual">Manual (User-initiated)</option>
            <option value="schedule">Schedule (Time-based)</option>
            <option value="webhook">Webhook (HTTP endpoint)</option>
            <option value="event">Event (System event)</option>
          </select>
        </div>

        {/* Schedule-specific fields */}
        {formData.triggerType === 'schedule' && (
          <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center mb-2">
              <Calendar className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-white text-sm font-medium">Schedule Settings</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-white text-sm">Frequency</label>
              <select
                name="frequency"
                value={formData.schedule?.frequency}
                onChange={handleScheduleChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom (cron)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-white text-sm">Timezone</label>
              <select
                name="timezone"
                value={formData.schedule?.timezone}
                onChange={handleScheduleChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
                <option value="Asia/Tokyo">Japan (JST)</option>
              </select>
            </div>
          </div>
        )}

        {/* Webhook-specific fields */}
        {formData.triggerType === 'webhook' && (
          <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center mb-2">
              <Globe className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-white text-sm font-medium">Webhook Settings</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-white text-sm">HTTP Method</label>
              <select
                name="method"
                value={formData.webhook?.method}
                onChange={handleWebhookChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-white text-sm">Webhook URL</label>
              <input
                type="text"
                name="url"
                value={formData.webhook?.url}
                onChange={handleWebhookChange}
                placeholder="/webhook/trigger"
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Event-specific fields */}
        {formData.triggerType === 'event' && (
          <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center mb-2">
              <Zap className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-white text-sm font-medium">Event Settings</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-white text-sm">Event Type</label>
              <select
                name="eventType"
                value={formData.config?.eventType}
                onChange={handleEventConfigChange}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="data_change">Data Change</option>
                <option value="user_action">User Action</option>
                <option value="system_event">System Event</option>
                <option value="external_event">External Event</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-white text-sm">Source</label>
              <input
                type="text"
                name="source"
                value={formData.config?.source}
                onChange={handleEventConfigChange}
                placeholder="Database, API, etc."
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Manual-specific fields */}
        {formData.triggerType === 'manual' && (
          <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center mb-2">
              <Play className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-white text-sm font-medium">Manual Trigger Settings</span>
            </div>
            
            <div className="text-gray-300 text-sm">
              This trigger will be activated manually by users through the interface.
              <br />
              No additional configuration is required.
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-white/10">
          <HolographicButton
            type="button"
            onClick={() => onDelete(nodeId)}
            variant="outline"
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </HolographicButton>
          
          <HolographicButton type="submit" variant="primary" glow>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </HolographicButton>
        </div>
      </form>
    </GlassCard>
  );
};