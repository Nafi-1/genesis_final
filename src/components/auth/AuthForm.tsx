import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, CheckCircle, Clock, RefreshCw, AlertCircle, Wifi } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface AuthFormProps {
  onBack: () => void;
  initialMode?: 'signin' | 'signup';
  initialError?: string | null;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  onBack, 
  initialMode = 'signin',
  initialError = null 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>(
    initialError ? { submit: initialError } : {}
  );
  
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    resendConfirmation,
    loading, 
    emailConfirmationRequired,
    rateLimitRemaining,
    clearEmailConfirmationState
  } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!formData.email.trim()) {
      setErrors({ submit: 'Email is required' });
      return;
    }
    if (!formData.password.trim()) {
      setErrors({ submit: 'Password is required' });
      return;
    }
    if (mode === 'signup' && !formData.name.trim()) {
      setErrors({ submit: 'Full name is required' });
      return;
    }

    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.name);
      }

      if (result.error) {
        setErrors({ submit: result.error.message });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'An unexpected error occurred' });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setErrors({ submit: result.error.message });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Google sign-in failed' });
    }
  };

  const handleResendConfirmation = async () => {
    setErrors({});
    if (!formData.email.trim()) {
      setErrors({ submit: 'Please enter your email address' });
      return;
    }

    try {
      const result = await resendConfirmation(formData.email);
      if (result.error) {
        setErrors({ submit: result.error.message });
      } else {
        setErrors({ submit: 'Confirmation email sent! Please check your inbox.' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to resend confirmation email' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleModeSwitch = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
    clearEmailConfirmationState();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={onBack}
          className="flex items-center text-white/70 hover:text-white mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </motion.button>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">G</span>
              </div>
              <CardTitle className="text-2xl text-white">
                {emailConfirmationRequired 
                  ? 'Check Your Email' 
                  : mode === 'signin' ? 'Welcome back' : 'Join GenesisOS'
                }
              </CardTitle>
              <p className="text-gray-300 mt-2">
                {emailConfirmationRequired
                  ? 'We sent you a confirmation link'
                  : mode === 'signin' 
                    ? 'Sign in to your AI-native workspace' 
                    : 'Start building your autonomous business'
                }
              </p>
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {emailConfirmationRequired ? (
                /* Email Confirmation Required View - Enhanced with better contrast */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Confirm your email address
                    </h3>
                    <p className="text-gray-300 text-sm">
                      We sent a confirmation link to:
                    </p>
                    <p className="text-blue-400 font-medium mt-1">
                      {formData.email}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-center text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Click the link in your email to verify your account
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <div className="flex items-center text-yellow-300 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="font-medium text-white">
                          Confirmation links expire in 24 hours
                        </span>
                      </div>
                      <p className="text-yellow-200 text-xs mt-1">
                        If you don't see the email, check your spam folder
                      </p>
                    </div>

                    {rateLimitRemaining > 0 ? (
                      <div className="flex items-center justify-center text-gray-300 text-sm">
                        <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                        <span className="text-white font-medium">
                          Resend available in {rateLimitRemaining}s
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={handleResendConfirmation}
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10 font-medium"
                        isLoading={loading}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend confirmation email
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        clearEmailConfirmationState();
                        setMode('signin');
                      }}
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white font-medium"
                    >
                      Back to sign in
                    </Button>
                  </div>
                </div>
              ) : (
                /* Normal Auth Form */
                <>
                  {/* Google Sign-In - Maximum Contrast */}
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full mb-6 bg-white text-gray-900 border-white hover:bg-gray-100 font-semibold shadow-lg"
                    isLoading={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative flex items-center justify-center mb-6">
                    <div className="border-t border-white/20 w-full"></div>
                    <span className="bg-transparent px-3 text-gray-400 text-sm">or</span>
                    <div className="border-t border-white/20 w-full"></div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Full name"
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Email address"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Password"
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {mode === 'signup' && (
                      <p className="text-xs text-gray-400">
                        Password must be at least 6 characters long
                      </p>
                    )}

                    {errors.submit && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`text-sm p-3 rounded-lg flex items-start ${
                          errors.submit.includes('sent') || errors.submit.includes('check')
                            ? 'text-green-200 bg-green-500/20 border border-green-500/30'
                            : errors.submit.includes('Network')
                            ? 'text-orange-200 bg-orange-500/20 border border-orange-500/30'
                            : 'text-red-200 bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        {errors.submit.includes('Network') ? (
                          <Wifi className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        ) : errors.submit.includes('sent') ? (
                          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="font-medium">{errors.submit}</span>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 font-semibold"
                      isLoading={loading}
                    >
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={handleModeSwitch}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                    >
                      {mode === 'signin' 
                        ? "Don't have an account? Sign up" 
                        : "Already have an account? Sign in"
                      }
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};