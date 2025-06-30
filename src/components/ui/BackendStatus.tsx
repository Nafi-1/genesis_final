import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Zap, AlertCircle, CheckCircle, Code, Wrench, Globe, X, Brain } from 'lucide-react';
import { testBackendConnection, apiMethods } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface BackendStatusProps {
  className?: string;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'testing' | 'connected' | 'failed' | 'development' | 'mixed-content'>('testing');
  const [latency, setLatency] = useState<number>(0);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [mode, setMode] = useState<string>('');
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [activeService, setActiveService] = useState<string>('');
  const [suggestedUrl, setSuggestedUrl] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
  const [showDetails, setShowDetails] = useState(false);
  const [phase, setPhase] = useState<string>('1');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const checkConnection = async () => {
    setStatus('testing');
    setConnectionAttempts(prev => prev + 1);
    console.log("Checking backend connection...");

    try {
      const result = await testBackendConnection();
      
      if (result.connected) {
        // Phase 3: Enhanced status detection
        setAvailableServices(result.status.availableServices || []);
        setActiveService(result.status.activeService || '');
        
        if (result.status.phase === "3" || 
            result.status.phase === "3 - Backend Integration" ||
            result.status.phase === "4" ||
            result.status.phase === "4 - AI & Automation Core") {
          setPhase('3');
        }
        
        if (result.status.mode === 'development' || result.status.status === 'development_fallback') {
          setStatus('development');
          setMode(result.status.phase || 'Development Mode');
          if (result.status.availableServices?.length > 0) {
            setAvailableServices(result.status.availableServices);
          }
          if (result.status.activeService) {
            setActiveService(result.status.activeService);
          }
        } else {
          setStatus('connected');
          setMode('Production');
        }
        setLatency(result.latency);
        setSuggestedUrl(''); // Clear any previous suggestion
      } else {
        // Check for mixed content error in the status
        if (result.status.isMixedContent || result.status.error?.includes('Mixed Content Error')) {
          setStatus('mixed-content');
          setMode('Protocol Mismatch');
          
          // Extract suggested URL from either the status or error message
          let url = result.status.suggestedUrl || '';
          if (!url && result.status.error) {
            const urlMatch = result.status.error.match(/Navigate to: (.+)$/);
            if (urlMatch) {
              url = urlMatch[1];
            }
          }
          setSuggestedUrl(url);
          
          console.log('🔧 Mixed content detected:', {
            error: result.status.error,
            suggestedUrl: url,
            isMixedContent: result.status.isMixedContent
          });
        } else {
          setStatus('failed');
          setMode('Offline');
        }
      }
    } catch (error: any) {
      console.error('Connection check error:', error);
      
      // Enhanced error handling for connection issues
      if (error.message?.includes('Mixed Content Error') || error.isMixedContent) {
        setStatus('mixed-content');
        setMode('Protocol Mismatch');
        
        let url = error.suggestedUrl || '';
        if (!url) {
          const urlMatch = error.message?.match(/Navigate to: (.+)$/);
          if (urlMatch) {
            url = urlMatch[1];
          }
        }
        setSuggestedUrl(url);
        
        console.log('🔧 Mixed content error caught:', {
          error: error.message,
          suggestedUrl: url,
          isMixedContent: error.isMixedContent
        });
      } else {
        setStatus('failed');
        setMode('Error');
      }
      console.log("Backend connection failed:", error);
    }
    
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkConnection();
    console.log("Initial backend check complete.");
    
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          text: phase === '3' ? 'Phase 3 Connected' : 'Backend Online',
          detail: `${latency}ms • ${mode}`
        };
      case 'development':
        return {
          icon: Brain,
          color: 'text-blue-500',
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: `Phase ${phase} Active`,
          detail: `${latency}ms • Smart Fallbacks`
        };
      case 'mixed-content':
        return {
          icon: Globe,
          color: 'text-orange-500',
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'Protocol Issue',
          detail: 'HTTPS → HTTP blocked'
        };
      case 'failed':
        return {
          icon: WifiOff,
          color: 'text-orange-500',
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'Using Fallbacks',
          detail: 'Mock data active'
        };
      default:
        return {
          icon: Zap,
          color: 'text-blue-500',
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'Connecting...',
          detail: 'Testing...'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  // Always show the component in development or when there are issues
  const shouldShow = import.meta.env.DEV || status !== 'connected';

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm border backdrop-blur-sm ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} shadow-lg max-w-xs`}
          >
            <Icon className={`w-5 h-5 ${status === 'testing' ? 'animate-pulse' : ''}`} />
            
            <div className="flex flex-col min-w-0">
              <span className="font-semibold leading-tight truncate">{statusInfo.text}</span>
              <span className="text-xs opacity-80 truncate">{statusInfo.detail}</span>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={checkConnection}
                className="p-1 hover:opacity-70 transition-opacity rounded"
                title="Test connection"
              >
                <Wifi className="w-4 h-4" />
                <span className="sr-only">Check connection</span>
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 hover:opacity-70 transition-opacity rounded"
                title="Show details"
              >
                <Wrench className="w-4 h-4" />
                <span className="sr-only">Backend info</span>
              </button>
              
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:opacity-70 transition-opacity rounded"
                title="Minimize"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Minimized state */}
      {isMinimized && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsMinimized(false)}
          className={`w-12 h-12 rounded-full ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
        >
          <Icon className="w-5 h-5" />
          <span className="sr-only">Show backend status</span>
        </motion.button>
      )}
      
      {/* Mixed content error guidance */}
      <AnimatePresence>
        {status === 'mixed-content' && suggestedUrl && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs max-w-xs"
          >
            <div className="font-semibold text-orange-600 mb-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Mixed Content Error
            </div>
            <div className="text-gray-600 mb-2">
              Frontend is HTTPS, backend is HTTP. Click below to switch to HTTP:
            </div>
            <button
              onClick={() => {
                console.log('🔄 Redirecting to HTTP:', suggestedUrl);
                window.location.href = suggestedUrl;
              }}
              className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-xs font-medium"
            >
              Switch to HTTP
            </button>
            <div className="mt-1 text-xs text-gray-500 break-all">
              {suggestedUrl}
            </div>
            {connectionAttempts > 3 && (
              <div className="mt-2 text-sm font-medium">
                Try starting the Orchestrator service with: <code className="bg-gray-100 px-1 py-0.5 rounded">npm run orchestrator:dev</code>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Details panel */}
      <AnimatePresence>
        {showDetails && !isMinimized && import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 p-3 bg-black/20 border border-white/10 rounded-lg text-xs max-w-xs backdrop-blur-sm"
          >
            <div className="text-white/80 space-y-1">
              <div>Last check: {lastCheck.toLocaleTimeString()}</div>
              <div>Phase: {phase} {phase === '3' ? '(Backend Integration)' : '(Intent Engine)'}</div>
              <div>Connection attempts: {connectionAttempts}</div>
              <div>Protocol: {window.location.protocol}</div>
              <div>Host: {window.location.host}</div>
              {availableServices.length > 0 && (
                <div className="mt-2">
                  <div className="text-blue-400">Available Services:</div>
                  <ul className="list-disc list-inside text-xs">
                    {availableServices.map((service, index) => (
                      <li key={index} className={activeService === service ? "text-green-400" : ""}>
                        {service} {activeService === service && "(active)"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {status === 'development' && (
                <div className="text-blue-400 mt-2 flex items-center">
                  <Wrench className="w-3 h-3 inline mr-1" />
                  Smart fallbacks active
                </div>
              )}
              {status === 'mixed-content' && (
                <div className="text-orange-400 mt-2 flex items-center">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Protocol mismatch detected
                </div>
              )}
              <div className="text-gray-400 mt-2 text-xs">
                Phase 3 Services: Supabase ✅ • Gemini ✅ • Redis ⏳ • Pinecone ⏳
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};