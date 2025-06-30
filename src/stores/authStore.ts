import { create } from 'zustand';
import { auth } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  emailConfirmationRequired: boolean;
  lastEmailSent: number | null;
  rateLimitRemaining: number;
  connectionError: boolean;
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  resendConfirmation: (email: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  clearEmailConfirmationState: () => void;
  clearConnectionError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  emailConfirmationRequired: false,
  lastEmailSent: null,
  rateLimitRemaining: 0,
  connectionError: false,

  initialize: async () => {
    try {
      set({ connectionError: false });
      
      // Check for existing session first
      const { session } = await auth.getCurrentSession();
      if (session?.user) {
        set({ user: session.user as User, loading: false });
      } else {
        set({ loading: false });
      }

      // Listen for auth changes
      auth.onAuthStateChange((user) => {
        set({ user: user as User | null, loading: false });
        if (user) {
          set({ emailConfirmationRequired: false });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Don't block the app if auth fails - allow guest mode
      console.warn('⚠️ Authentication unavailable - enabling guest mode fallback');
      set({ loading: false, connectionError: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, emailConfirmationRequired: false, connectionError: false });
    const { data, error } = await auth.signIn(email, password);
    
    if (error) {
      set({ loading: false });
      
      // Handle network errors
      if (error.message?.includes('Network')) {
        set({ connectionError: true });
        return { error: { ...error, message: 'Connection failed. Please check your internet and try again.' } };
      }
      
      // Handle specific auth errors
      if (error.message?.includes('email_not_confirmed') || error.message?.includes('Email not confirmed')) {
        set({ emailConfirmationRequired: true });
        return { error: { ...error, message: 'Please check your email and click the confirmation link before signing in.' } };
      }
      
      if (error.message?.includes('Invalid login credentials')) {
        return { error: { ...error, message: 'Invalid email or password. Please check your credentials and try again.' } };
      }
      
      return { error };
    }

    set({ user: data.user as User, loading: false, connectionError: false });
    return {};
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ loading: true, connectionError: false });
    const { data, error } = await auth.signUp(email, password, name);
    
    if (error) {
      set({ loading: false });
      
      // Handle network errors
      if (error.message?.includes('Network')) {
        set({ connectionError: true });
        return { error: { ...error, message: 'Connection failed. Please check your internet and try again.' } };
      }
      
      // Handle rate limiting
      if (error.message?.includes('email_send_rate_limit') || error.message?.includes('rate_limit')) {
        const now = Date.now();
        set({ 
          lastEmailSent: now,
          rateLimitRemaining: 20
        });
        
        // Start countdown
        const countdown = setInterval(() => {
          const remaining = 20 - Math.floor((Date.now() - now) / 1000);
          if (remaining <= 0) {
            clearInterval(countdown);
            set({ rateLimitRemaining: 0, lastEmailSent: null });
          } else {
            set({ rateLimitRemaining: remaining });
          }
        }, 1000);
        
        return { error: { ...error, message: `Please wait 20 seconds before requesting another confirmation email.` } };
      }
      
      if (error.message?.includes('already registered')) {
        return { error: { ...error, message: 'An account with this email already exists. Please sign in instead.' } };
      }
      
      return { error };
    }

    // If user needs email confirmation
    if (data.user && !data.session) {
      set({ 
        emailConfirmationRequired: true,
        lastEmailSent: Date.now(),
        loading: false 
      });
      return { error: { message: 'Please check your email and click the confirmation link to complete your account setup.' } };
    }

    set({ user: data.user as User, loading: false, connectionError: false });
    return {};
  },

  signInWithGoogle: async () => {
    set({ loading: true, connectionError: false });
    const { data, error } = await auth.signInWithGoogle();

    console.log('🔍 Google OAuth flow initiated:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message || 'No error'
    });
    
    if (error) {
      set({ loading: false });
      
      // Handle specific Google OAuth errors
      if (error.message?.includes('provider is not enabled') || error.message?.includes('validation_failed')) {
        return { error: { ...error, message: 'Google sign-in is not enabled. Please use email/password or contact support.' } };
      }
      
      if (error.message?.includes('Network') || error.message?.includes('Failed to initiate')) {
        set({ connectionError: true });
        return { error: { ...error, message: 'Failed to connect to Google. Please check your internet and try again.' } };
      }
      
      // Handle popup issues
      if (error.message?.includes('popup') || error.code === 'popup_closed') {
        return { error: { ...error, message: 'Google sign-in popup was closed. Please try again and complete the sign-in process.' } };
      }
      
      return { error };
    }

    // User will be set via onAuthStateChange callback after redirect
    set({ loading: false, connectionError: false });
    return {};
  },

  resendConfirmation: async (email: string) => {
    const { lastEmailSent } = get();
    const now = Date.now();
    
    // Check rate limit
    if (lastEmailSent && (now - lastEmailSent) < 20000) {
      const remaining = Math.ceil((20000 - (now - lastEmailSent)) / 1000);
      set({ rateLimitRemaining: remaining });
      return { error: { message: `Please wait ${remaining} seconds before requesting another email.` } };
    }

    set({ connectionError: false });
    const { data, error } = await auth.resendConfirmation(email);
    
    if (error) {
      if (error.message?.includes('email_send_rate_limit') || error.message?.includes('rate_limit')) {
        set({ 
          lastEmailSent: now,
          rateLimitRemaining: 20
        });
        
        // Start countdown
        const countdown = setInterval(() => {
          const remaining = 20 - Math.floor((Date.now() - now) / 1000);
          if (remaining <= 0) {
            clearInterval(countdown);
            set({ rateLimitRemaining: 0, lastEmailSent: null });
          } else {
            set({ rateLimitRemaining: remaining });
          }
        }, 1000);
      }
      
      if (error.message?.includes('Network') || error.message?.includes('Failed to resend')) {
        set({ connectionError: true });
      }
      
      return { error };
    }

    set({ lastEmailSent: now });
    return {};
  },

  clearEmailConfirmationState: () => {
    set({ 
      emailConfirmationRequired: false,
      lastEmailSent: null,
      rateLimitRemaining: 0
    });
  },

  clearConnectionError: () => {
    set({ connectionError: false });
  },

  signOut: async () => {
    set({ loading: true });
    await auth.signOut();
    set({ 
      user: null, 
      loading: false, 
      emailConfirmationRequired: false,
      lastEmailSent: null,
      rateLimitRemaining: 0,
      connectionError: false
    });
  }
}));