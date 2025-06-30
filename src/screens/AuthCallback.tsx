import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { processAuthCallback } from '../lib/auth-utils';
import { QuantumLoader } from '../components/ui/QuantumLoader';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Process the auth callback
        const result = await processAuthCallback();
        
        if (result.error) {
          setError(result.error);
          // Redirect to auth page with error after a short delay
          setTimeout(() => {
            navigate(`/auth?error=${encodeURIComponent(result.error || 'Authentication failed')}`);
          }, 2000);
        } else {
          // Redirect to the app after a short delay
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        // Redirect to auth page with error after a short delay
        setTimeout(() => {
          navigate(`/auth?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
        }, 2000);
      }
    };
    
    handleCallback();
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <QuantumLoader size="lg" color="purple" />
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-4">
        {error ? 'Authentication Error' : 'Completing Authentication...'}
      </h1>
      
      {error ? (
        <p className="text-red-300 bg-red-900/30 border border-red-500/30 p-4 rounded-lg max-w-md text-center">
          {error}
        </p>
      ) : (
        <p className="text-gray-300">
          Please wait while we complete your sign-in...
        </p>
      )}
    </div>
  );
};

export default AuthCallback;