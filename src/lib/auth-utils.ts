import { supabase } from './supabase';

/**
 * Gets the URL parameters from the current location
 */
export const getURLParams = (): URLSearchParams => {
  return new URLSearchParams(window.location.search);
};

/**
 * Check if the current session has an active error
 */
export const checkForAuthError = (): string | null => {
  const params = getURLParams();
  return params.get('error_description') || params.get('error') || null;
};

/**
 * Extract and format an error message from the URL params
 */
export const getAuthErrorFromURL = (): string | null => {
  const error = checkForAuthError();
  if (!error) return null;
  
  // Common OAuth errors and their user-friendly messages
  if (error.includes('provider is not enabled')) {
    return 'Google sign-in is not properly configured. Please try another sign-in method.';
  }
  
  if (error.includes('popup closed')) {
    return 'The sign-in window was closed. Please try again and complete the sign-in process.';
  }
  
  if (error.includes('redirect_uri_mismatch')) {
    return 'Authentication configuration error. Please contact support.';
  }
  
  // Return the original error if no specific handling
  return error;
};

/**
 * Processes the auth callback
 */
export const processAuthCallback = async (): Promise<{ error?: string }> => {
  try {
    const params = getURLParams();
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    
    if (!accessToken) {
      // Check for errors in the URL
      const error = getAuthErrorFromURL();
      if (error) {
        return { error };
      }
      return {};
    }
    
    // Exchange the tokens
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });
    
    if (error) {
      return { error: error.message };
    }
    
    return {};
  } catch (err: any) {
    console.error('Error processing auth callback:', err);
    return { error: err.message || 'Failed to complete authentication' };
  }
};