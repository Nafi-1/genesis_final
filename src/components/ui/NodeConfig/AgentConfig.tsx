import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';
import { AgentNodeData } from '../../../types/canvas';

interface AgentConfigProps {
  data: AgentNodeData;
  onUpdate: (nodeId: string, data: Partial<AgentNodeData>) => void;
  onDelete: (nodeId: string) => void;
  nodeId: string;
  onClose: () => void;
}

export const AgentConfig: React.FC<AgentConfigProps> = ({
  data,
  onUpdate,
  onDelete,
  nodeId,
  onClose
}) => {
  const [formData, setFormData] = useState<{
    label: string;
    role: string;
    description: string;
    tools: string[];
    newTool: string;
  }>({
    label: data.label,
    role: data.role,
    description: data.description,
    tools: data.tools || [],
    newTool: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTool = () => {
    if (formData.newTool.trim()) {
      setFormData({
        ...formData,
        tools: [...formData.tools, formData.newTool.trim()],
        newTool: ''
      });
    }
  };

  const handleRemoveTool = (index: number) => {
    setFormData({
      ...formData,
      tools: formData.tools.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(nodeId, {
      label: formData.label,
      role: formData.role,
      description: formData.description,
      tools: formData.tools
    });
    onClose();
  };

  return (
    <GlassCard variant="medium" className="w-96 p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Configure Agent</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-white text-sm">Agent Name</label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm">Tools</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tools.map((tool, index) => (
              <div key={index} className="flex items-center bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30">
                <span className="text-xs text-blue-300 mr-1">{tool}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(index)}
                  className="text-blue-300 hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              name="newTool"
              value={formData.newTool}
              onChange={handleChange}
              placeholder="Add a tool..."
              className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleAddTool}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30"
            >
              Add
            </button>
          </div>
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
};