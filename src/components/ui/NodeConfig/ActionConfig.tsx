import React, { useState } from 'react';
import { X, Save, Trash2, Mail, Database, Globe, Settings, Wand2, MessageSquare } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { apiService } from '../../../services/apiService';
import { ActionNodeData } from '../../../types/canvas';

interface ActionConfigProps {
  data: ActionNodeData;
  onUpdate: (nodeId: string, data: Partial<ActionNodeData>) => void;
  onDelete: (nodeId: string) => void;
  nodeId: string;
  onClose: () => void;
}

export function ActionConfig({ data, onUpdate, onDelete, nodeId, onClose }: ActionConfigProps) {
  const [formData, setFormData] = useState<{
    label: string;
    description: string;
    actionType: string;
    config: any;
    curlCommand: string;
    isGeneratingCurl: boolean;
    isTestingApi: boolean;
    testResult: any;
  }>({
    label: data.label,
    description: data.description,
    actionType: data.actionType,
    config: data.config || {},
    curlCommand: '',
    isGeneratingCurl: false,
    isTestingApi: false,
    testResult: null
  });

  const handleGenerateCurl = async () => {
    setFormData({
      ...formData,
      isGeneratingCurl: true
    });
    
    try {
      let curlCommand;

      if (formData.actionType === 'api' || formData.actionType === 'webhook') {
        // Generate curl command with AI assistance
        curlCommand = await apiService.generateCurlWithGemini(
          `Generate a curl command for ${formData.description || formData.label}`,
          {
            method: formData.config.method,
            endpoint: formData.config.url,
          }
        );
      } else if (formData.actionType === 'notification') {
        curlCommand = await apiService.generateCurlWithGemini(
          `Generate a curl command to send a ${formData.actionType} to ${formData.config.channel || '#general'}`,
          { 
            service: formData.config.service
          }
        );
      } else if (formData.actionType === 'email') {
        curlCommand = await apiService.generateCurlWithGemini(
          `Generate a curl command to send an email with subject "${formData.config.subject || 'Email Subject'}"`,
          { 
            service: 'sendgrid'
          }
        );
      } else {
        // Fallback to simple curl generation
        curlCommand = await apiService.generateCurlCommand({
          method: (formData.config.method as any) || 'POST',
          url: formData.config.url || 'https://api.example.com/endpoint',
          body: { message: formData.description || 'Test message' }
        });
      }

      setFormData({
        ...formData,
        curlCommand: typeof curlCommand === 'string' ? curlCommand : (curlCommand?.command || '# Error: Invalid cURL response'),
        isGeneratingCurl: false
      });
    } catch (error) {
      setFormData({
        ...formData,
        curlCommand: '# Error generating curl command',
        isGeneratingCurl: false
      });
    }
  };
  
  // Test the API call
  const handleTestApiCall = async () => {
    if (!formData.config.url && (formData.actionType === 'api' || formData.actionType === 'webhook')) {
      return; // Can't test without a URL
    }
    
    setFormData({
      ...formData,
      isTestingApi: true,
      testResult: null
    });
    
    try {
      // Prepare test config
      const testConfig: any = {
        method: formData.config.method || 'GET',
        url: formData.config.url || 'https://jsonplaceholder.typicode.com/posts/1', // Fallback to a test API
        body: formData.config.body || {}
      };
      
      // Execute test API call
      const result = await apiService.executeRequest(testConfig);
      
      setFormData({
        ...formData,
        isTestingApi: false,
        testResult: result
      });
    } catch (error: any) {
      setFormData({
        ...formData,
        isTestingApi: false,
        testResult: {
          error: true,
          message: error.message || 'Failed to execute API request'
        }
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [key]: value
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(nodeId, {
      label: formData.label,
      description: formData.description,
      actionType: formData.actionType as ActionNodeData['actionType'],
      config: formData.config
    });
    onClose();
  };

  return (
    <GlassCard variant="medium" className="w-96 p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Configure Action</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-white text-sm">Action Name</label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Action Type</label>
          <select
            name="actionType"
            value={formData.actionType}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="api">API Request</option>
            <option value="webhook">Webhook</option>
            <option value="database">Database Operation</option>
            <option value="email">Email</option>
            <option value="notification">Notification</option>
          </select>
        </div>

        {/* Action-specific configuration */}
        <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex items-center mb-2">
            {formData.actionType === 'api' && <Globe className="w-4 h-4 text-blue-400 mr-2" />}
            {formData.actionType === 'webhook' && <Globe className="w-4 h-4 text-green-400 mr-2" />}
            {formData.actionType === 'database' && <Database className="w-4 h-4 text-purple-400 mr-2" />}
            {formData.actionType === 'email' && <Mail className="w-4 h-4 text-orange-400 mr-2" />}
            {formData.actionType === 'notification' && <MessageSquare className="w-4 h-4 text-yellow-400 mr-2" />}
            <span className="text-white text-sm font-medium">{formData.actionType.charAt(0).toUpperCase() + formData.actionType.slice(1)} Configuration</span>
          </div>

          {/* API/Webhook Configuration */}
          {(formData.actionType === 'api' || formData.actionType === 'webhook') && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-white text-sm">Method</label>
                <select
                  value={formData.config.method || 'GET'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">URL</label>
                <input
                  type="text"
                  value={formData.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-400">API Tools</span>
                <div className="flex space-x-2">
                  <HolographicButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateCurl}
                    className="text-xs"
                    disabled={formData.isGeneratingCurl}
                  >
                    {formData.isGeneratingCurl ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3 mr-1" />
                        Generate cURL
                      </>
                    )}
                  </HolographicButton>
                  
                  <HolographicButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleTestApiCall}
                    className="text-xs"
                    disabled={formData.isTestingApi || !formData.config.url}
                  >
                    {formData.isTestingApi ? (
                      <>Testing...</>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        Test API
                      </>
                    )}
                  </HolographicButton>
                </div>
              </div>
              
              {formData.curlCommand && (
                <div className="mt-3 bg-black/30 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-gray-400 mb-2">Generated cURL Command:</div>
                  <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono overflow-x-auto p-2">
                    {formData.curlCommand}
                  </pre>
                </div>
              )}
              
              {/* Test Result Display */}
              {formData.testResult && (
                <div className={`mt-3 rounded-lg p-3 border ${formData.testResult.error ? 'bg-red-900/20 border-red-700/30' : 'bg-green-900/20 border-green-700/30'}`}>
                  <div className="text-xs mb-2 font-medium">
                    {formData.testResult.error ? (
                      <span className="text-red-400">API Test Failed</span>
                    ) : (
                      <span className="text-green-400">API Test Successful (Status: {formData.testResult.status})</span>
                    )}
                  </div>
                  
                  <div className="text-xs text-white/70 max-h-32 overflow-y-auto">
                    {formData.testResult.error ? (
                      formData.testResult.message
                    ) : (
                      JSON.stringify(formData.testResult.data, null, 2)
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Configuration */}
          {formData.actionType === 'database' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-white text-sm">Operation</label>
                <select
                  value={formData.config.operation || 'SELECT'}
                  onChange={(e) => handleConfigChange('operation', e.target.value)}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SELECT">SELECT</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Table</label>
                <input
                  type="text"
                  value={formData.config.table || ''}
                  onChange={(e) => handleConfigChange('table', e.target.value)}
                  placeholder="table_name"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Email Configuration */}
          {formData.actionType === 'email' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-white text-sm">Recipients</label>
                <input
                  type="text"
                  value={formData.config.recipients || ''}
                  onChange={(e) => handleConfigChange('recipients', e.target.value)}
                  placeholder="email@example.com, another@example.com"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Subject</label>
                <input
                  type="text"
                  value={formData.config.subject || ''}
                  onChange={(e) => handleConfigChange('subject', e.target.value)}
                  placeholder="Email Subject"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Template</label>
                <select
                  value={formData.config.template || 'default'}
                  onChange={(e) => handleConfigChange('template', e.target.value)}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default Template</option>
                  <option value="notification">Notification</option>
                  <option value="report">Weekly Report</option>
                  <option value="welcome">Welcome Email</option>
                </select>
              </div>
            </div>
          )}

          {/* Notification Configuration */}
          {formData.actionType === 'notification' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-white text-sm">Service</label>
                <select
                  value={formData.config.service || 'slack'}
                  onChange={(e) => handleConfigChange('service', e.target.value)}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="slack">Slack</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="discord">Discord</option>
                  <option value="custom">Custom Webhook</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-white text-sm">Channel</label>
                <input
                  type="text"
                  value={formData.config.channel || ''}
                  onChange={(e) => handleConfigChange('channel', e.target.value)}
                  placeholder="#general"
                  className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

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
}