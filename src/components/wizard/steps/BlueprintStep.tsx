import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Edit3, RotateCcw, ArrowRight, Users, Workflow, Star, Clock, Target, Zap, Save, Pencil } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore'; 
import { Blueprint } from '../../../types';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';

export const BlueprintStep: React.FC = () => {
  const { blueprint, setStep, updateBlueprint } = useWizardStore();
  const [showDetails, setShowDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedBlueprint, setEditedBlueprint] = useState<Blueprint | null>(null); 
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);

  if (!blueprint) {
    return null;
  }

  // Initialize edited blueprint when entering edit mode
  const handleEnterEditMode = () => {
    setEditedBlueprint(JSON.parse(JSON.stringify(blueprint)));
    setEditMode(true);
  };

  // Save edited blueprint
  const handleSaveEdit = () => {
    if (editedBlueprint) {
      updateBlueprint(editedBlueprint);
      setEditMode(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedBlueprint(null);
    setEditMode(false);
  };

  // Update edited blueprint
  const handleUpdateBlueprint = (field: string, value: any) => {
    setEditedBlueprint((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Update agent in edited blueprint
  const handleUpdateAgent = (index: number, field: string, value: any) => {
    if (!editedBlueprint) return;
    const updatedAgents = [...editedBlueprint.suggested_structure.agents];
    updatedAgents[index] = {
      ...updatedAgents[index],
      [field]: value
    };
    setEditedBlueprint((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        suggested_structure: {
          ...prev.suggested_structure,
          agents: updatedAgents
        }
      };
    });
  };

  // Update workflow in edited blueprint
  const handleUpdateWorkflow = (index: number, field: string, value: any) => {
    if (!editedBlueprint) return;
    const updatedWorkflows = [...editedBlueprint.suggested_structure.workflows];
    updatedWorkflows[index] = {
      ...updatedWorkflows[index],
      [field]: value
    };
    setEditedBlueprint((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        suggested_structure: {
          ...prev.suggested_structure,
          workflows: updatedWorkflows
        }
      };
    });
  };

  const handleApprove = () => {
    setIsGeneratingCanvas(true);
    setStep('canvas');
  };

  const handleEdit = () => {
    setStep('intent');
  };

  const handleStartOver = () => {
    setStep('welcome');
  };

  const agentCount = blueprint.suggested_structure.agents.length;
  const workflowCount = blueprint.suggested_structure.workflows.length;
  const estimatedTime = Math.max(5, agentCount * 3 + workflowCount * 2);

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Your AI Blueprint
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
          {editMode 
            ? "Customize your blueprint by editing the fields below" 
            : "Our AI architect has analyzed your vision and created an intelligent blueprint for your autonomous digital workforce"}
        </p>
        
        {/* Edit mode toggle button */}
        {!editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <HolographicButton variant="outline" onClick={handleEnterEditMode}>
              <Pencil className="w-4 h-4 mr-2" />
              Customize Blueprint
            </HolographicButton>
          </motion.div>
        )}
      </motion.div>

      {/* Blueprint Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid md:grid-cols-4 gap-6 mb-12"
      >
        {[
          { icon: Users, label: "AI Agents", value: agentCount, color: "from-blue-500 to-cyan-500" },
          { icon: Workflow, label: "Workflows", value: workflowCount, color: "from-purple-500 to-pink-500" },
          { icon: Clock, label: "Setup Time", value: `${estimatedTime}m`, color: "from-green-500 to-emerald-500" },
          { icon: Star, label: "Confidence", value: "95%", color: "from-orange-500 to-yellow-500" }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <GlassCard variant="medium" className="p-6 text-center">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-300 text-sm">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Goal Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-12"
      >
        <GlassCard variant="medium" glow className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">AI Analysis & Interpretation</h3>
              <p className="text-gray-300">How our architect understood your vision</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="text-sm text-gray-400 mb-2 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Your Vision
              </div>
              <p className="text-white font-medium text-lg">"{blueprint.user_input}"</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/20">
              <div className="text-sm text-purple-300 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                AI Interpretation
              </div>
              <p className="text-white leading-relaxed">{blueprint.interpretation}</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Guild Structure */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-12"
      >
        <GlassCard variant="medium" className="p-8">
          <div className="text-center mb-8">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Guild Name</label>
                  <input
                    type="text"
                    value={editedBlueprint?.suggested_structure.guild_name ?? ""}
                    onChange={(e) => setEditedBlueprint((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        suggested_structure: {
                          ...prev.suggested_structure,
                          guild_name: e.target.value
                        }
                      };
                    })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Guild Purpose</label>
                  <textarea
                    value={editedBlueprint?.suggested_structure.guild_purpose ?? ""}
                    onChange={(e) => setEditedBlueprint((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        suggested_structure: {
                          ...prev.suggested_structure,
                          guild_purpose: e.target.value
                        }
                      };
                    })}
                    rows={3}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-bold text-white mb-3">
                  {blueprint.suggested_structure.guild_name}
                </h3>
                <p className="text-xl text-gray-300 leading-relaxed">
                  {blueprint.suggested_structure.guild_purpose}
                </p>
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Digital Workers */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Digital Workers</h4>
                  <p className="text-gray-300 text-sm">Intelligent AI agents with specific roles</p>
                </div>
              </div>

              <div className="space-y-4">
                {blueprint.suggested_structure.agents.map((agent, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <GlassCard variant="subtle" className="p-6">
                      {editMode ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Agent Name</label>
                            <input
                              type="text"
                              value={editedBlueprint?.suggested_structure.agents[index].name ?? ""}
                              onChange={(e) => handleUpdateAgent(index, 'name', e.target.value)}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Role</label>
                            <input
                              type="text"
                              value={editedBlueprint?.suggested_structure.agents[index].role ?? ""}
                              onChange={(e) => handleUpdateAgent(index, 'role', e.target.value)}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <textarea
                              value={editedBlueprint?.suggested_structure.agents[index].description ?? ""}
                              onChange={(e) => handleUpdateAgent(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Tools</label>
                            <div className="space-y-2">
                              {editedBlueprint &&
                                editedBlueprint.suggested_structure.agents[index].tools_needed.map((tool: string, toolIndex: number) => (
                                  <div key={toolIndex} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={tool}
                                      onChange={(e) => {
                                        const updatedTools = [...editedBlueprint.suggested_structure.agents[index].tools_needed];
                                        updatedTools[toolIndex] = e.target.value;
                                        handleUpdateAgent(index, 'tools_needed', updatedTools);
                                      }}
                                      className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                      onClick={() => {
                                        const updatedTools = editedBlueprint.suggested_structure.agents[index].tools_needed.filter((_: any, i: number) => i !== toolIndex);
                                        handleUpdateAgent(index, 'tools_needed', updatedTools);
                                      }}
                                      className="p-1 bg-red-500/20 rounded-full hover:bg-red-500/30"
                                    >
                                      <span className="text-red-400 text-xs">✕</span>
                                    </button>
                                  </div>
                                ))}
                              <button
                                onClick={() => {
                                  if (!editedBlueprint) return;
                                  const updatedTools = [...editedBlueprint.suggested_structure.agents[index].tools_needed, "New Tool"];
                                  handleUpdateAgent(index, 'tools_needed', updatedTools);
                                }}
                                className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                              >
                                <span className="mr-1">+</span> Add Tool
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">{agent.name[0]}</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-white mb-1">{agent.name}</h5>
                            <p className="text-purple-300 text-sm mb-2">{agent.role}</p>
                            <p className="text-gray-300 text-sm mb-3 leading-relaxed">{agent.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {agent.tools_needed.map((tool, toolIndex) => (
                                <span
                                  key={toolIndex}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
                {editMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <button
                      onClick={() => {
                        const newAgent = {
                          name: "New Agent",
                          role: "Define Role",
                          description: "Describe this agent's responsibilities and capabilities",
                          tools_needed: ["Tool 1", "Tool 2"]
                        };
                        setEditedBlueprint((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            suggested_structure: {
                              ...prev.suggested_structure,
                              agents: [...prev.suggested_structure.agents, newAgent]
                            }
                          };
                        });
                      }}
                      className="w-full p-3 border border-dashed border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors"
                    >
                      + Add New Agent
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Automation Workflows */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Automation Workflows</h4>
                  <p className="text-gray-300 text-sm">Intelligent business processes</p>
                </div>
              </div>

              <div className="space-y-4">
                {blueprint.suggested_structure.workflows.map((workflow, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    whileHover={{ x: -5 }}
                  >
                    <GlassCard variant="subtle" className="p-6">
                      {editMode ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Workflow Name</label>
                            <input
                              type="text"
                              value={editedBlueprint?.suggested_structure.workflows[index].name ?? ""}
                              onChange={(e) => handleUpdateWorkflow(index, 'name', e.target.value)}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <textarea
                              value={editedBlueprint?.suggested_structure.workflows[index].description ?? ""}
                              onChange={(e) => handleUpdateWorkflow(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Trigger Type</label>
                            <select
                              value={editedBlueprint?.suggested_structure.workflows[index].trigger_type ?? ""}
                              onChange={(e) => handleUpdateWorkflow(index, 'trigger_type', e.target.value)}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="manual">Manual</option>
                              <option value="schedule">Schedule</option>
                              <option value="webhook">Webhook</option>
                              <option value="event">Event</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-white mb-1">{workflow.name}</h5>
                            <p className="text-gray-300 text-sm mb-3 leading-relaxed">{workflow.description}</p>
                            <div className="flex items-center">
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                Trigger: {workflow.trigger_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
                {editMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <button
                      onClick={() => {
                        const newWorkflow = {
                          name: "New Workflow",
                          description: "Describe this workflow's function and purpose",
                          trigger_type: "manual"
                        };
                        setEditedBlueprint((prev) => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            suggested_structure: {
                              ...prev.suggested_structure,
                              workflows: [...prev.suggested_structure.workflows, newWorkflow]
                            }
                          };
                        });
                      }}
                      className="w-full p-3 border border-dashed border-emerald-500/50 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      + Add New Workflow
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        {editMode ? (
          <>
            <HolographicButton variant="outline" onClick={handleCancelEdit}>
              Cancel Editing
            </HolographicButton>
            
            <HolographicButton onClick={handleSaveEdit} glow>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </HolographicButton>
          </>
        ) : (
          <>
            <HolographicButton variant="outline" onClick={handleStartOver}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </HolographicButton>
            
            <HolographicButton variant="outline" onClick={handleEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Refine Vision
            </HolographicButton>
            
            <HolographicButton 
              onClick={handleApprove} 
              size="lg" 
              glow 
              className="group"
              disabled={isGeneratingCanvas}
            >
              <CheckCircle className="w-5 h-5 mr-2 group-hover:text-green-400 transition-colors" />
              {isGeneratingCanvas ? 'Generating Canvas...' : 'Approve Blueprint'}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="ml-2"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </HolographicButton>
          </>
        )}
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="mt-8 text-center"
      >
        <GlassCard variant="subtle" className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
            <h4 className="text-lg font-semibold text-white">
              Blueprint Ready for Canvas Generation!
            </h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Your blueprint has been crafted with enterprise-grade intelligence.
            Click "Approve Blueprint" to generate a visual workflow in the Canvas.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};