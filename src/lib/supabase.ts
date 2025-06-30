import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for placeholder values
const hasPlaceholderValues = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'your_supabase_project_url' ||
  supabaseAnonKey === 'your_supabase_anon_key' ||
  supabaseUrl.includes('your_') ||
  supabaseAnonKey.includes('your_');

// Enhanced validation and error handling
if (hasPlaceholderValues) {
  console.info('ℹ️ Supabase not configured - guest mode available');
  console.info('To enable full authentication features:');
  console.info('1. Create a Supabase project at https://supabase.com');
  console.info('2. Get your project URL and anon key from Settings > API');
  console.info('3. Update your .env file with actual Supabase credentials');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.info('ℹ️ Supabase environment variables not configured');
  console.info('App will run in guest mode with full functionality');
}

// Validate URL format only if not using placeholder values
if (supabaseUrl && !hasPlaceholderValues) {
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    throw new Error('Invalid Supabase URL format');
  }
}

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:');
  if (hasPlaceholderValues) {
    console.log('Status: ⚠️ Using placeholder values - Supabase features disabled');
    console.log('URL: 🔄 Placeholder detected');
    console.log('Key: 🔄 Placeholder detected');
  } else {
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');
  }
}

// Create a fallback client for placeholder values
const createSupabaseClient = () => {
  if (hasPlaceholderValues) {
    // Create a mock client that won't crash but will log warnings
    const mockClient = {
      auth: {
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: { message: 'Supabase not configured' } }),
        getUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        getSession: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
        resend: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ error: { message: 'Supabase not configured' } }),
        insert: () => ({ error: { message: 'Supabase not configured' } }),
        update: () => ({ error: { message: 'Supabase not configured' } }),
        upsert: () => ({ error: { message: 'Supabase not configured' } }),
        delete: () => ({ error: { message: 'Supabase not configured' } }),
        eq: function() { return this; },
        single: function() { return this; },
        limit: function() { return this; }
      })
    };
    return mockClient as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: import.meta.env.DEV
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
    },
  });
};

export const supabase = createSupabaseClient();

// Enhanced function to get the current domain for redirects
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    // Get the full origin including protocol, hostname, and port
    const origin = window.location.origin;
    
    // Check if we're running on a development server with a port
    if (window.location.port) {
      console.log(`🔗 Using redirect domain with port: ${origin}`);
    }
    
    // Log the redirect URL for debugging
    console.log(`🔗 Auth redirect URL: ${origin}/auth/callback`);
    
    return origin;
  }
  return 'http://localhost:5173'; // fallback for SSR
};

// Enhanced connection test
const testConnection = async () => {
  if (hasPlaceholderValues) {
    console.log('⚠️ Skipping Supabase connection test - placeholder values detected');
    return false;
  }

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation not found" which is expected
      console.warn('⚠️ Supabase connection test warning:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// Test connection on initialization
if (import.meta.env.DEV) {
  testConnection();
}

// Enhanced auth helpers with better error handling
export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    if (hasPlaceholderValues) {
      return { 
        data: null, 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      console.log('🔄 Attempting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${getCurrentDomain()}/auth/callback`
        }
      });
      
      if (error) {
        console.error('❌ Signup error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Signup successful:', data.user?.id);
      
      // Create user profile if signup successful and user exists
      if (data.user && !error) {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              name: name,
              avatar_url: data.user.user_metadata?.avatar_url || null,
              email_confirmed: !!data.user.email_confirmed_at
            });
          
          if (profileError) {
            console.warn('⚠️ Profile creation warning:', profileError);
          }
        } catch (profileError) {
          console.warn('⚠️ Profile creation failed:', profileError);
        }
      }
      
      return { data, error };
    } catch (error: any) {
      console.error('❌ Network/Connection error in signup:', error);
      
      // Enhanced network error detection
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Network connection failed. Please check your internet connection and try again.',
            code: 'network_error'
          }
        };
      }
      
      return { 
        data: null, 
        error: { 
          message: error.message || 'An unexpected error occurred during signup.',
          code: 'unknown_error'
        }
      };
    }
  },

  signIn: async (email: string, password: string) => {
    if (hasPlaceholderValues) {
      return { 
        data: null, 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      console.log('🔄 Attempting signin for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Signin error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Signin successful:', data.user?.id);
      
      if (data.user && !error) {
        // Update user profile with latest info
        try {
          await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url || null,
              email_confirmed: !!data.user.email_confirmed_at
            });
        } catch (profileError) {
          console.warn('⚠️ Profile update failed:', profileError);
        }
      }
      
      return { data, error };
    } catch (error: any) {
      console.error('❌ Network/Connection error in signin:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Connection to authentication server failed. Please check your internet connection.',
            code: 'network_error'
          }
        };
      }
      
      return { 
        data: null, 
        error: { 
          message: error.message || 'Sign in failed. Please try again.',
          code: 'signin_error'
        }
      };
    }
  },

  signInWithGoogle: async () => {
    if (hasPlaceholderValues) {
      return { 
        data: null, 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      console.log('🔄 Attempting Google OAuth signin');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getCurrentDomain()}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        
        // Handle specific Google OAuth errors
        if (error.message?.includes('provider is not enabled')) {
          return { error: { ...error, message: 'Google sign-in is not enabled. Please configure Google OAuth in your Supabase project.' } };
        }
        
        if (error.message?.includes('invalid configuration')) {
          return { error: { ...error, message: 'Google OAuth configuration is invalid. Please check your redirect URLs in both Google Cloud Console and Supabase.' } };
        }
        
        if (error.message?.includes('redirect_uri_mismatch')) {
          return { error: { ...error, message: 'Redirect URI mismatch. Please ensure the redirect URI in Google Cloud Console matches the one in Supabase.' } };
        }
        
        return { data: null, error };
      }
      
      console.log('✅ Google OAuth initiated successfully');
      return { data, error };
    } catch (error: any) {
      console.error('❌ Google OAuth network error:', error);
      
      // Enhanced error handling for network issues
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Connection to Google failed. Please check your internet connection and try again.',
            code: 'network_error'
          }
        };
      }
      
      if (error.message?.includes('popup closed')) {
        return { 
          data: null, 
          error: { 
            message: 'Google sign-in was canceled. Please try again.',
            code: 'popup_closed'
          }
        };
      }
      
      return { 
        data: null, 
        error: { 
          message: 'Failed to connect to Google. Please check your connection and try again.',
          code: 'google_oauth_error'
        }
      };
    }
  },

  signOut: async () => {
    if (hasPlaceholderValues) {
      return { 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      console.log('🔄 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Signout error:', error);
      } else {
        console.log('✅ Signout successful');
      }
      
      return { error };
    } catch (error: any) {
      console.error('❌ Signout network error:', error);
      return { error: { message: 'Failed to sign out. Please try again.' } };
    }
  },

  getCurrentUser: async () => {
    if (hasPlaceholderValues) {
      return { 
        user: null, 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Get user error:', error);
      }
      
      return { user, error };
    } catch (error: any) {
      console.error('❌ Get user network error:', error);
      return { user: null, error };
    }
  },

  getCurrentSession: async () => {
    if (hasPlaceholderValues) {
      return { 
        session: null, 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Get session error:', error);
      }
      
      return { session, error };
    } catch (error: any) {
      console.error('❌ Get session network error:', error);
      return { session: null, error };
    }
  },

  resendConfirmation: async (email: string) => {
    if (hasPlaceholderValues) {
      return { 
        data: null, 
        error: { 
          message: 'Supabase not configured. Please set up your Supabase credentials in the .env file.',
          code: 'supabase_not_configured'
        }
      };
    }

    try {
      console.log('🔄 Resending confirmation for:', email);
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${getCurrentDomain()}/auth/callback`
        }
      });
      
      if (error) {
        console.error('❌ Resend confirmation error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Confirmation email resent successfully');
      return { data, error };
    } catch (error: any) {
      console.error('❌ Resend confirmation network error:', error);
      return { 
        data: null, 
        error: { 
          message: 'Failed to resend confirmation email. Please check your connection.',
          code: 'resend_error'
        }
      };
    }
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    if (hasPlaceholderValues) {
      // Return a mock subscription for placeholder values
      callback(null);
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }

    return supabase.auth.onAuthStateChange(async (event: any, session: { user: { id: any; email: any; user_metadata: { name: any; avatar_url: any; }; email_confirmed_at: any; }; }) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        try {
          // Ensure user profile exists or update it
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!profile) {
            // Create profile if it doesn't exist
            await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
                avatar_url: session.user.user_metadata?.avatar_url || null,
                email_confirmed: !!session.user.email_confirmed_at
              });
          } else {
            // Update email confirmation status
            await supabase
              .from('users')
              .update({
                email_confirmed: !!session.user.email_confirmed_at,
                name: session.user.user_metadata?.name || profile.name,
                avatar_url: session.user.user_metadata?.avatar_url || profile.avatar_url
              })
              .eq('id', session.user.id);
          }
        } catch (error) {
          console.warn('⚠️ Profile sync error:', error);
        }
      }
      
      callback(session?.user || null);
    });
  }
};