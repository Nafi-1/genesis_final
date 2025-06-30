import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

/**
 * Component to handle the OAuth callback after Google sign-in
 */
const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Process the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error);
          setStatus('error');
          setErrorMessage(error.message || 'Authentication failed');
          return;
        }
        
        if (data.session) {
          console.log('Auth callback successful, session created');
          setStatus('success');
          
          // Navigate back to the app after a short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          console.warn('Auth callback completed but no session found');
          setStatus('error');
          setErrorMessage('Sign in was completed but no session was created');
        }
      } catch (err: any) {
        console.error('Unexpected error in auth callback:', err);
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred');
      }
    };
    
    // Process the callback when the component mounts
    handleCallback();
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <GlassCard variant="medium" className="p-8 max-w-md w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-white mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold text-white mb-4">Completing Sign In</h1>
              <p className="text-gray-300">Please wait while we authenticate your account...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-4">Authentication Successful</h1>
              <p className="text-gray-300 mb-6">You have successfully signed in with Google.</p>
              <div className="flex justify-center">
                <HolographicButton
                  onClick={() => navigate('/')}
                  variant="primary"
                  glow
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </HolographicButton>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-4">Authentication Failed</h1>
              <p className="text-gray-300 mb-6">{errorMessage || 'An error occurred during authentication.'}</p>
              <div className="flex justify-center">
                <HolographicButton
                  onClick={() => navigate('/auth')}
                  variant="primary"
                >
                  Try Again
                </HolographicButton>
              </div>
            </>
          )}
        </motion.div>
      </GlassCard>
    </div>
  );
};

export default GoogleAuthCallback;