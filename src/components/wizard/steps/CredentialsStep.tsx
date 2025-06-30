import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Code, 
  RefreshCw, 
  Volume2, 
  AlertTriangle, 
  Clipboard, 
  Edit3,
  Save,
  FileCode 
} from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { apiService } from '../../../services/apiService';
import { VoiceSelector } from '../../voice/VoiceSelector';

export const CredentialsStep: React.FC = () => {
  const { step, setStep, credentials: storeCredentials, setCredentials: setStoreCredentials } = useWizardStore();
  const [credentials, setCredentials] = useState<{[key: string]: string}>(storeCredentials || {});
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});
  const [curlCommands, setCurlCommands] = useState<{[key: string]: string}>({});
  const [editingCurl, setEditingCurl] = useState<{[key: string]: boolean}>({});
  const [validatedCredentials, setValidatedCredentials] = useState<{[key: string]: boolean}>({});
  const [isValidating, setIsValidating] = useState<{[key: string]: boolean}>({});
  const [generatingCurl, setGeneratingCurl] = useState<{[key: string]: boolean}>({});
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [userCurlInput, setUserCurlInput] = useState<{[key: string]: string}>({});
  const [showCurlInput, setShowCurlInput] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const requiredCredentials = [
    {
      name: 'Google Cloud API Key',
      key: 'google_cloud_api_key',
      tool: 'Google Cloud',
      placeholder: 'AIza...',
      description: 'For video generation, speech synthesis, and cloud services'
    },
    {
      name: 'OpenAI API Key',
      key: 'openai_api_key',
      tool: 'OpenAI',
      placeholder: 'sk-...',
      description: 'Required for AI agent interactions and natural language processing'
    },
    {
      name: 'Supabase URL',
      key: 'supabase_url',
      tool: 'Supabase',
      placeholder: 'https://...supabase.co',
      description: 'Your Supabase project URL for database operations'
    },
    {
      name: 'Supabase Anon Key',
      key: 'supabase_anon_key',
      tool: 'Supabase',
      placeholder: 'eyJ...',
      description: 'Public key for client-side Supabase operations'
    }
  ];

  // Load credentials from store if available
  useEffect(() => {
    if (storeCredentials && Object.keys(storeCredentials).length > 0) {
      setCredentials(storeCredentials);
      
      // Validate loaded credentials
      Object.entries(storeCredentials).forEach(([key, value]) => {
        if (value && value.trim()) {
          const credential = requiredCredentials.find(c => c.key === key);
          if (credential) {
            validateCredential(credential, value);
          }
        }
      });
    }
  }, [storeCredentials]);

  // Load ElevenLabs voice ID from credentials if available
  useEffect(() => {
    if (credentials.elevenlabs_voice_id) {
      setSelectedVoice(credentials.elevenlabs_voice_id);
    }
  }, [credentials.elevenlabs_voice_id]);

  const generateCurl = async (credential: any, key: string) => {
    setGeneratingCurl(prev => ({
      ...prev,
      [key]: true
    }));
    
    const existingValue = credentials[key] || '';
    try {
      const curlPrompt = `Generate a curl command to test the ${credential.name} for ${credential.tool}`;
      const serviceInfo = { 
        service: credential.tool,
        endpoint: getEndpointForService(credential.tool),
        method: getMethodForService(credential.tool),
        apiKey: existingValue && !existingValue.startsWith('your_') ? `{{${key.toUpperCase()}}}` : undefined 
      };

      console.log(`🔄 Generating curl command for ${credential.name} using template for ${credential.tool}`);
      
      const result = await apiService.generateCurlWithGemini(curlPrompt, serviceInfo);
      
      // Process the curl command to add placeholders if needed
      let curlCommand = result.command;
      
      // If the credential has a value, but it's not in the curl command, add it as a placeholder
      if (existingValue && !existingValue.startsWith('your_') && !curlCommand.includes(existingValue)) {
        curlCommand = curlCommand.replace(/(Bearer|token:|key:|apikey:|api_key:|password:|Authorization:.*Bearer\s+)[^\s"'\\]+/gi, 
          `$1{{${key.toUpperCase()}}}`);
      }
      
      console.log(`✅ Curl command generated for ${credential.name}`);

      setCurlCommands(prev => ({
        ...prev,
        [key]: curlCommand
      }));
      
      // Set editing mode true for the newly generated curl
      setEditingCurl(prev => ({
        ...prev,
        [key]: true
      }));
      
      // Set curl input for the user
      setUserCurlInput(prev => ({
        ...prev,
        [key]: curlCommand
      }));
    } catch (error) {
      console.error('Failed to generate curl command:', error);
      setCurlCommands(prev => ({
        ...prev,
        [key]: `# Error generating curl command: ${error}`
      }));
      setUserCurlInput(prev => ({
        ...prev,
        [key]: `# Error generating curl command: ${error}`
      }));
    } finally {
      setGeneratingCurl(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const validateCredential = async (credential: any, value: string) => {
    if (!value.trim()) return;

    setIsValidating(prev => ({ ...prev, [credential.key]: true }));

    try {
      // Simulate validation (in a real app, you'd do actual validation)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple pattern validation
      const isValid = validateByPattern(credential.key, value);
      
      setValidatedCredentials(prev => ({ ...prev, [credential.key]: isValid }));
      
      if (isValid) {
        console.log(`✅ Credential ${credential.key} validated successfully`);
      } else {
        console.warn(`⚠️ Credential ${credential.key} validation failed`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidatedCredentials(prev => ({ ...prev, [credential.key]: false }));
    } finally {
      setIsValidating(prev => ({ ...prev, [credential.key]: false }));
    }
  };

  const validateByPattern = (key: string, value: string): boolean => {
    // Simple validation based on credential key patterns
    if (key.includes('api_key') && key.includes('google')) {
      return value.startsWith('AIza');
    }
    if (key.includes('openai')) {
      return value.startsWith('sk-');
    }
    if (key.includes('supabase_url')) {
      return value.includes('supabase.co');
    }
    if (key.includes('supabase_anon_key')) {
      return value.startsWith('eyJ');
    }
    
    // Default validation - just ensure it's not empty
    return value.trim().length > 5;
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setValidatedCredentials(prev => ({ ...prev, [key]: false }));
  };
  
  const handleCurlInputChange = (key: string, value: string) => {
    setUserCurlInput(prev => ({ ...prev, [key]: value }));
  };
  
  // Toggle curl editing mode
  const toggleCurlEdit = (key: string) => {
    setEditingCurl(prev => ({ ...prev, [key]: !prev[key] }));
    
    // If we're ending editing, update the curl command
    if (editingCurl[key]) {
      setCurlCommands(prev => ({ ...prev, [key]: userCurlInput[key] || '' }));
    }
  };
  
  // Toggle showing curl input
  const toggleCurlInput = (key: string) => {
    const newState = !showCurlInput[key];
    setShowCurlInput(prev => ({ ...prev, [key]: newState }));
    
    // Generate a curl command if showing and none exists
    if (newState && !curlCommands[key] && !generatingCurl[key]) {
      const credential = requiredCredentials.find(c => c.key === key);
      if (credential) {
        generateCurl(credential, key);
      }
    }
  };
  
  // Extract credential from curl command
  const extractCredentialFromCurl = (key: string) => {
    const curl = userCurlInput[key] || curlCommands[key] || '';
    
    console.log(`🔍 Extracting credential from curl command for ${key}`);
    
    // Extract common authorization patterns
    const bearerMatch = curl.match(/Bearer\s+([A-Za-z0-9._~+/-]+)/);
    const apiKeyMatch = curl.match(/apikey[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i) || 
                       curl.match(/api[_-]?key[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i) || 
                       curl.match(/key[=:]\s*["']?([A-Za-z0-9._~+/-]+)["']?/i);
    
    // Also look for placeholder pattern like {{KEY}}
    const placeholderMatch = curl.match(/{{([A-Za-z0-9_]+)}}/);
    
    // Extract URL patterns
    const urlMatch = curl.match(/"(https:\/\/[^"]+)"/);
    
    // Process matches based on credential key
    if (key.includes('api_key')) {
      // For API keys, prioritize API key matches
      if (apiKeyMatch && apiKeyMatch[1]) {
        const value = apiKeyMatch[1];
        console.log(`✅ Extracted API key from curl: ${value.substring(0, 3)}...`);
        handleCredentialChange(key, value);
        return true;
      } else if (bearerMatch && bearerMatch[1]) {
        const value = bearerMatch[1];
        console.log(`✅ Extracted bearer token from curl: ${value.substring(0, 3)}...`);
        handleCredentialChange(key, value);
        return true;
      }
    } else if (key.includes('url')) {
      // For URL credentials
      if (urlMatch && urlMatch[1]) {
        const value = urlMatch[1];
        console.log(`✅ Extracted URL from curl: ${value}`);
        handleCredentialChange(key, value);
        return true;
      }
    }
    
    // If no specific patterns matched, look for placeholders
    if (placeholderMatch && placeholderMatch[1]) {
      const placeholderKey = placeholderMatch[1].toLowerCase();
      if (placeholderKey.includes(key.replace(/_/g, ''))) {
        // Placeholder matches this credential key pattern
        console.log(`✅ Found placeholder for ${key}: {{${placeholderMatch[1]}}}`);
        // Don't update the credential value, just note that we found it
        return true;
      }
    }
    
    console.warn(`⚠️ Could not extract credential for ${key} from curl command`);
    return false;
  };

  const toggleVisibility = (key: string) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    // Save credentials to store
    setStoreCredentials(credentials);
    
    // Save selected voice to credentials
    if (selectedVoice) {
      setStoreCredentials({
        ...credentials,
        elevenlabs_voice_id: selectedVoice
      });
    }
    
    // Navigate to next step
    setStep('simulation');
  };

  const hasValidCredentials = Object.keys(credentials).some(key => 
    credentials[key] && credentials[key].trim() && validatedCredentials[key]
  );

  // Helper functions for curl command generation
  const getEndpointForService = (service: string): string => {
    switch (service.toLowerCase()) {
      case 'google cloud': return 'https://language.googleapis.com/v1/documents:analyzeEntities';
      case 'openai': return 'https://api.openai.com/v1/chat/completions';
      case 'supabase': return 'https://your-project.supabase.co/rest/v1/users';
      default: return 'https://api.example.com/v1/endpoint';
    }
  };

  const getMethodForService = (service: string): string => {
    switch (service.toLowerCase()) {
      case 'google cloud': return 'POST';
      case 'openai': return 'POST';
      case 'supabase': return 'GET';
      default: return 'POST';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Key className="w-16 h-16 text-emerald-400" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-black" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Configure API Credentials
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Secure your agent ecosystem with the necessary API keys and credentials for seamless integration.
          </p>
        </div>

        <div className="space-y-8">
          {requiredCredentials.map((credential, index) => (
            <motion.div
              key={credential.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                      {credential.name}
                      {validatedCredentials[credential.key] && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-2" />
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm">{credential.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleCurlInput(credential.key)}
                      className={`p-2 rounded-lg ${showCurlInput[credential.key] 
                        ? 'bg-purple-600/30 text-purple-300' 
                        : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400'} 
                        transition-colors`}
                      title={showCurlInput[credential.key] ? "Hide curl editor" : "Use curl command"}
                    >
                      <FileCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (showCurlInput[credential.key]) {
                          // If curl input is already shown, generate a new curl
                          generateCurl(credential, credential.key);
                        } else {
                          // Otherwise, show the curl input first
                          toggleCurlInput(credential.key);
                          
                          // Then generate a curl if none exists
                          if (!curlCommands[credential.key]) {
                            generateCurl(credential, credential.key);
                          }
                        }
                      }}
                      disabled={generatingCurl[credential.key]}
                      className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors"
                      title="Generate test curl command"
                    >
                      {generatingCurl[credential.key] ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Code className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://docs.${credential.tool.toLowerCase().replace(' ', '')}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                      title="Open documentation"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* API Key/Credential Input Field */}
                  <div className="relative">
                    <input
                      type={showCredentials[credential.key] ? 'text' : 'password'}
                      value={credentials[credential.key] || ''}
                      onChange={(e) => handleCredentialChange(credential.key, e.target.value)}
                      onBlur={() => validateCredential(credential, credentials[credential.key] || '')}
                      placeholder={credential.placeholder}
                      className="w-full px-4 py-3 pr-24 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                      <button
                        onClick={() => toggleVisibility(credential.key)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showCredentials[credential.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {isValidating[credential.key] ? (
                        <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin mt-2" />
                      ) : validatedCredentials[credential.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-2" />
                      ) : credentials[credential.key] ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-2" />
                      ) : null}
                    </div>
                  </div>
                  
                  {/* CURL Command Entry/Editor */}
                  <AnimatePresence>
                    {showCurlInput[credential.key] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Code className="w-4 h-4 text-purple-400 mr-2" />
                              <span className="text-sm text-gray-300 font-medium">cURL Command</span>
                            </div>
                            
                            <div className="flex space-x-2">
                              {!generatingCurl[credential.key] && (
                                <HolographicButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => generateCurl(credential, credential.key)}
                                  className="text-xs"
                                >
                                  <RefreshCw className={`w-3 h-3 mr-1 ${generatingCurl[credential.key] ? 'animate-spin' : ''}`} />
                                  Generate
                                </HolographicButton>
                              )}
                              
                              {(userCurlInput[credential.key] || curlCommands[credential.key]) && (
                                <HolographicButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCurlEdit(credential.key)}
                                  className="text-xs"
                                >
                                  {editingCurl[credential.key] ? (
                                    <>
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </>
                                  ) : (
                                    <>
                                      <Edit3 className="w-3 h-3 mr-1" />
                                      Edit
                                    </>
                                  )}
                                </HolographicButton>
                              )}
                            </div>
                          </div>
                          
                          {editingCurl[credential.key] || !curlCommands[credential.key] ? (
                            <textarea
                              value={userCurlInput[credential.key] || curlCommands[credential.key] || ''}
                              onChange={(e) => handleCurlInputChange(credential.key, e.target.value)}
                              placeholder="Paste your curl command here or generate one automatically"
                              rows={5}
                              className="w-full p-3 bg-black/30 border border-white/10 rounded text-xs font-mono text-green-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          ) : (
                            <pre className="p-3 bg-black/30 border border-white/10 rounded overflow-x-auto text-xs font-mono text-green-400">
                              {curlCommands[credential.key]}
                            </pre>
                          )}
                          
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Paste your own curl or generate it</span>
                            
                            {(userCurlInput[credential.key] || curlCommands[credential.key]) && (
                              <button
                                onClick={() => {
                                  const curl = userCurlInput[credential.key] || curlCommands[credential.key] || '';
                                  navigator.clipboard.writeText(curl);
                                  extractCredentialFromCurl(credential.key);
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                              >
                                <Clipboard className="w-3 h-3 mr-1" />
                                Copy & Extract Key
                              </button>
                            )}
                          </div>
                          
                          {generatingCurl[credential.key] && (
                            <div className="flex items-center justify-center mt-2">
                              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin mr-2" />
                              <span className="text-xs text-purple-400">Generating curl command...</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Error Display */}
                  {curlCommands[credential.key] && curlCommands[credential.key].includes('Error generating curl command') && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs text-red-300 bg-red-900/20 border border-red-900/30 p-2 rounded"
                    >
                      Failed to generate curl command. Please try again or paste your own.
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Voice Configuration Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    <Volume2 className="w-6 h-6 mr-2" />
                    Voice Configuration
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">Select the voice profile for your AI agents</p>
                </div>
              </div>

              <VoiceSelector
                selectedVoiceId={selectedVoice}
                onSelect={setSelectedVoice}
              />
            </GlassCard>
          </motion.div>

          {/* Error display */}
          {errors.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-lg text-red-300">
              {errors.map((error, i) => (
                <div key={i} className="flex items-start mb-1 last:mb-0">
                  <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-center pt-8">
            <HolographicButton
              onClick={handleNext}
              disabled={isLoading}
              className="px-8 py-4 text-lg"
            >
              <span className="flex items-center">
                {isLoading ? 'Saving Credentials...' : 'Continue to Simulation'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
            </HolographicButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};