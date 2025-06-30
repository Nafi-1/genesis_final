import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Globe, 
  Zap, 
  Clock, 
  Check, 
  Trash2, 
  PlusCircle, 
  Save,
  Activity,
  AlertTriangle,
  MessageSquare,
  Target,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { HolographicButton } from './HolographicButton';
import { triggerService, TriggerConditionType } from '../../services/triggerService';

interface TriggerSystemBuilderProps {
  guildId: string;
  agentId: string;
  agentName?: string;
  onTriggerCreated?: (trigger: any) => void;
  className?: string;
}

export const TriggerSystemBuilder: React.FC<TriggerSystemBuilderProps> = ({
  guildId,
  agentId,
  agentName = 'Agent',
  onTriggerCreated,
  className = ''
}) => {
  const [triggerType, setTriggerType] = useState<TriggerConditionType>('schedule');
  const [triggerName, setTriggerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Schedule-specific state
  const [scheduleFrequency, setScheduleFrequency] = useState<string>('hourly');
  const [scheduleCron, setScheduleCron] = useState<string>('0 * * * *'); // Default to hourly
  const [scheduleInput, setScheduleInput] = useState<string>('');
  
  // Webhook-specific state
  const [webhookPath, setWebhookPath] = useState<string>('');
  
  // Threshold-specific state
  const [metricName, setMetricName] = useState<string>('');
  const [thresholdValue, setThresholdValue] = useState<number>(90);
  const [thresholdOperator, setThresholdOperator] = useState<string>('>');
  
  // Event-specific state
  const [eventType, setEventType] = useState<string>('agent_response');
  
  // Slack-specific state
  const [slackWebhookUrl, setSlackWebhookUrl] = useState<string>('');

  // Handle creating a trigger
  const handleCreateTrigger = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      // Validate trigger name
      if (!triggerName) {
        setError('Please provide a name for the trigger');
        setIsCreating(false);
        return;
      }
      
      // Create different types of triggers based on selected type
      let trigger;
      
      switch (triggerType) {
        case 'schedule':
          // Validate schedule input
          if (!scheduleInput) {
            setError('Please provide an input message for the scheduled trigger');
            setIsCreating(false);
            return;
          }
          
          trigger = await triggerService.createScheduledTrigger(
            guildId,
            agentId,
            triggerName,
            scheduleFrequency === 'custom' ? scheduleCron : getScheduleFromFrequency(scheduleFrequency),
            scheduleInput
          );
          break;
          
        case 'webhook':
          // Validate webhook path
          if (!webhookPath) {
            setError('Please provide a path for the webhook');
            setIsCreating(false);
            return;
          }
          
          trigger = await triggerService.createWebhookTrigger(
            guildId,
            agentId,
            triggerName,
            webhookPath
          );
          break;
          
        case 'threshold':
          // Validate threshold inputs
          if (!metricName) {
            setError('Please provide a metric name');
            setIsCreating(false);
            return;
          }
          
          trigger = await triggerService.createThresholdTrigger(
            guildId,
            agentId,
            triggerName,
            metricName,
            thresholdValue,
            thresholdOperator
          );
          break;
          
        case 'event':
          if (eventType === 'slack_message') {
            // Validate Slack webhook URL
            if (!slackWebhookUrl) {
              setError('Please provide a Slack webhook URL');
              setIsCreating(false);
              return;
            }
            
            trigger = await triggerService.createSlackMessageTrigger(
              guildId,
              slackWebhookUrl,
              agentId,
              triggerName
            );
          } else {
            // Generic event trigger
            trigger = await triggerService.createTrigger({
              guildId,
              agentId,
              name: triggerName,
              description: `Event-based trigger for ${eventType} events`,
              condition: {
                type: 'event',
                config: {
                  eventType
                }
              },
              action: {
                type: 'agent_execute',
                target: agentId,
                payload: {
                  input: `Event ${eventType} has occurred`,
                  context: {
                    event_type: eventType,
                    trigger_id: crypto.randomUUID()
                  }
                }
              },
              status: 'active'
            });
          }
          break;
      }
      
      // Reset form
      setTriggerName('');
      setScheduleInput('');
      setWebhookPath('');
      setMetricName('');
      
      // Notify parent
      if (onTriggerCreated) {
        onTriggerCreated(trigger);
      }
      
    } catch (error: any) {
      console.error('Failed to create trigger:', error);
      setError(error.message || 'Failed to create trigger');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Get cron expression from frequency
  const getScheduleFromFrequency = (frequency: string): string => {
    switch (frequency) {
      case 'minutely':
        return '* * * * *';
      case 'hourly':
        return '0 * * * *';
      case 'daily':
        return '0 0 * * *';
      case 'weekly':
        return '0 0 * * 0';
      case 'monthly':
        return '0 0 1 * *';
      default:
        return '0 * * * *';
    }
  };
  
  // Get icon for trigger type
  const getTriggerIcon = (type: TriggerConditionType) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="w-5 h-5" />;
      case 'webhook':
        return <Globe className="w-5 h-5" />;
      case 'event':
        return <Zap className="w-5 h-5" />;
      case 'threshold':
        return <Activity className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <GlassCard variant="medium" className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Create Trigger</h3>
        <div className="text-sm text-gray-400">
          For agent: <span className="text-blue-400">{agentName}</span>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Trigger Type Selection */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Trigger Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['schedule', 'webhook', 'event', 'threshold'] as TriggerConditionType[]).map((type) => (
              <button
                key={type}
                onClick={() => setTriggerType(type)}
                className={`flex flex-col items-center p-4 rounded-lg border ${
                  triggerType === type 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                  triggerType === type ? 'bg-blue-500/30' : 'bg-white/10'
                }`}>
                  {getTriggerIcon(type)}
                </div>
                <span className="text-sm capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Trigger Name */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Trigger Name</label>
          <input
            type="text"
            value={triggerName}
            onChange={(e) => setTriggerName(e.target.value)}
            placeholder="My Trigger"
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        
        {/* Type-specific configuration */}
        {triggerType === 'schedule' && (
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Clock className="w-4 h-4 text-blue-400 mr-2" />
              Schedule Configuration
            </h4>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Frequency</label>
              <select
                value={scheduleFrequency}
                onChange={(e) => setScheduleFrequency(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="minutely">Every Minute</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom (Cron)</option>
              </select>
            </div>
            
            {scheduleFrequency === 'custom' && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Cron Expression</label>
                <input
                  type="text"
                  value={scheduleCron}
                  onChange={(e) => setScheduleCron(e.target.value)}
                  placeholder="* * * * *"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <div className="mt-1 text-xs text-gray-400">
                  Format: minute hour day-of-month month day-of-week
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Agent Input</label>
              <textarea
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                placeholder="What should the agent do when this schedule triggers?"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                rows={3}
              />
            </div>
          </div>
        )}
        
        {triggerType === 'webhook' && (
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Globe className="w-4 h-4 text-green-400 mr-2" />
              Webhook Configuration
            </h4>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Webhook Path</label>
              <div className="flex">
                <div className="bg-white/5 border-y border-l border-white/20 rounded-l-lg px-3 py-3 text-gray-400">
                  /webhooks/
                </div>
                <input
                  type="text"
                  value={webhookPath}
                  onChange={(e) => setWebhookPath(e.target.value)}
                  placeholder="my-trigger"
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-r-lg text-white"
                />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                This will create a webhook endpoint at /webhooks/{webhookPath || '[path]'}
              </div>
            </div>
            
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-blue-300 text-sm">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 mr-2" />
                <span className="font-medium">Webhook will send to agent:</span>
              </div>
              <div className="pl-6">
                The JSON payload of any POST request to this webhook will be passed directly to the agent as input.
              </div>
            </div>
          </div>
        )}
        
        {triggerType === 'threshold' && (
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Target className="w-4 h-4 text-orange-400 mr-2" />
              Threshold Configuration
            </h4>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Metric Name</label>
              <input
                type="text"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="e.g., cpu_usage, response_time, error_rate"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Operator</label>
                <select
                  value={thresholdOperator}
                  onChange={(e) => setThresholdOperator(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value=">">Greater than (&gt;)</option>
                  <option value=">=">Greater than or equal (&gt;=)</option>
                  <option value="<">Less than (&lt;)</option>
                  <option value="<=">Less than or equal (&lt;=)</option>
                  <option value="==">Equal to (==)</option>
                  <option value="!=">Not equal to (!=)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Threshold Value</label>
                <input
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(Number(e.target.value))}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>
            
            <div className="p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg text-orange-300 text-sm">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="font-medium">How this works:</span>
              </div>
              <div className="pl-6">
                When the metric {metricName || '[metric]'} {thresholdOperator} {thresholdValue}, the agent will be triggered with contextual information about the threshold breach.
              </div>
            </div>
          </div>
        )}
        
        {triggerType === 'event' && (
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Zap className="w-4 h-4 text-purple-400 mr-2" />
              Event Configuration
            </h4>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="agent_response">Agent Response</option>
                <option value="workflow_completed">Workflow Completed</option>
                <option value="data_updated">Data Updated</option>
                <option value="slack_message">Slack Message</option>
              </select>
            </div>
            
            {eventType === 'slack_message' && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Slack Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <div className="mt-1 text-xs text-gray-400">
                  Create a webhook URL in your Slack workspace to receive messages from this agent.
                </div>
              </div>
            )}
            
            <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg text-purple-300 text-sm">
              <div className="flex items-center mb-2">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="font-medium">Event Trigger:</span>
              </div>
              <div className="pl-6">
                When a {eventType.replace('_', ' ')} event occurs, this agent will be triggered with relevant context data.
              </div>
            </div>
          </div>
        )}
        
        {/* Create Trigger Button */}
        <div className="flex justify-end">
          <HolographicButton
            onClick={handleCreateTrigger}
            disabled={isCreating}
            glow
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating Trigger...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Trigger
              </>
            )}
          </HolographicButton>
        </div>
      </div>
    </GlassCard>
  );
};

export default TriggerSystemBuilder;