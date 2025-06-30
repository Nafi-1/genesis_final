import { supabase } from '../lib/supabase';

/**
 * Service for managing API credentials
 */
export const credentialService = {
  /**
   * Get all credentials for a user
   */
  getUserCredentials: async (userId: string): Promise<Record<string, any>> => {
    try {
      // Return mock credentials if Supabase is not configured or in development mode
      if (import.meta.env.DEV || !supabase) {
        return getMockCredentials();
      }
      
      // Query credentials from Supabase
      const { data, error } = await supabase
        .from('credentials')
        .select('id, service_name, credential_type, is_active, metadata')
        .eq('user_id', userId)
        .eq('is_active', true);
        
      if (error) {
        console.error('Failed to fetch credentials:', error);
        return {};
      }
      
      // Transform credential data into a more usable format
      return transformCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return getMockCredentials();
    }
  },
  
  /**
   * Save a credential
   */
  saveCredential: async (
    userId: string, 
    serviceName: string, 
    credentialType: string, 
    value: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> => {
    try {
      // If Supabase is not configured, just log and return success
      if (import.meta.env.DEV || !supabase) {
        console.log(`[MOCK] Saved credential for ${serviceName}`);
        return true;
      }
      
      // In a real implementation, we would encrypt the credential value
      // before storing it in the database
      
      // Check if the credential already exists
      const { data: existing } = await supabase
        .from('credentials')
        .select('id')
        .eq('user_id', userId)
        .eq('service_name', serviceName)
        .eq('credential_type', credentialType)
        .single();
      
      let result;
      if (existing) {
        // Update existing credential
        result = await supabase
          .from('credentials')
          .update({
            encrypted_value: value, // In a real implementation, this would be encrypted
            metadata,
            is_active: true,
            updated_at: new Date()
          })
          .eq('id', existing.id);
      } else {
        // Insert new credential
        result = await supabase
          .from('credentials')
          .insert({
            user_id: userId,
            service_name: serviceName,
            credential_type: credentialType,
            encrypted_value: value, // In a real implementation, this would be encrypted
            metadata,
            is_active: true
          });
      }
      
      if (result.error) {
        console.error('Failed to save credential:', result.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving credential:', error);
      return false;
    }
  },
  
  /**
   * Delete a credential
   */
  deleteCredential: async (credentialId: string): Promise<boolean> => {
    try {
      // If Supabase is not configured, just log and return success
      if (import.meta.env.DEV || !supabase) {
        console.log(`[MOCK] Deleted credential ${credentialId}`);
        return true;
      }
      
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', credentialId);
      
      if (error) {
        console.error('Failed to delete credential:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting credential:', error);
      return false;
    }
  },
  
  /**
   * Get credentials required for a specific tool/service
   */
  getRequiredCredentialsForService: (serviceName: string): { key: string; name: string; description: string }[] => {
    // Define required credentials for different services
    const credentialMappings: Record<string, { key: string; name: string; description: string }[]> = {
      'slack': [
        { 
          key: 'slack_api_key', 
          name: 'Slack API Key', 
          description: 'Bot User OAuth Token from the Slack API dashboard' 
        }
      ],
      'slack api': [
        { 
          key: 'slack_api_key', 
          name: 'Slack API Key', 
          description: 'Bot User OAuth Token from the Slack API dashboard' 
        }
      ],
      'slack webhook': [
        {
          key: 'slack_webhook_url',
          name: 'Slack Webhook URL',
          description: 'Webhook URL for posting messages to Slack'
        }
      ],
      'gmail': [
        { 
          key: 'gmail_api_key', 
          name: 'Gmail API Key', 
          description: 'API Key from Google Cloud Console with Gmail API enabled' 
        }
      ],
      'email': [
        { 
          key: 'email_api_key', 
          name: 'Email API Key',
          description: 'API Key for email service' 
        }
      ],
      'google_sheets': [
        { 
          key: 'google_sheets_api_key', 
          name: 'Google Sheets API Key', 
          description: 'API Key from Google Cloud Console with Sheets API enabled' 
        }
      ],
      'google sheets': [
        { 
          key: 'google_sheets_api_key', 
          name: 'Google Sheets API Key', 
          description: 'API Key from Google Cloud Console with Sheets API enabled' 
        }
      ],
      'elevenlabs': [
        { 
          key: 'elevenlabs_api_key', 
          name: 'ElevenLabs API Key', 
          description: 'API Key from ElevenLabs dashboard' 
        },
        {
          key: 'elevenlabs_voice_id',
          name: 'ElevenLabs Voice ID',
          description: 'Voice ID from ElevenLabs voice library'
        }
      ],
      'voice': [
        { 
          key: 'elevenlabs_api_key', 
          name: 'ElevenLabs API Key', 
          description: 'API Key from ElevenLabs dashboard' 
        }
      ],
      'gemini': [
        { 
          key: 'gemini_api_key', 
          name: 'Gemini API Key', 
          description: 'API Key from Google AI Studio' 
        }
      ],
      'ai': [
        { 
          key: 'gemini_api_key', 
          name: 'Gemini API Key', 
          description: 'API Key from Google AI Studio' 
        }
      ],
      'openai': [
        { 
          key: 'openai_api_key', 
          name: 'OpenAI API Key', 
          description: 'API Key from OpenAI dashboard' 
        }
      ]
    };
    
    // Find exact match
    if (credentialMappings[serviceName.toLowerCase()]) {
      return credentialMappings[serviceName.toLowerCase()];
    }
    
    // Try to find partial match
    const serviceKey = Object.keys(credentialMappings).find(key => 
      serviceName.toLowerCase().includes(key) || key.includes(serviceName.toLowerCase())
    );
    
    if (serviceKey) {
      return credentialMappings[serviceKey];
    }
    
    // Default credential if no match found
    return [
      { 
        key: `${serviceName.toLowerCase().replace(/\s+/g, '_')}_api_key`,
        name: `${serviceName} API Key`,
        description: `API Key for ${serviceName} service`
      }
    ];
  }
};

/**
 * Transform credential data from Supabase format to a more usable format
 */
function transformCredentials(credentials: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  credentials.forEach(cred => {
    // Generate a key based on service name and credential type
    const key = `${cred.service_name.toLowerCase().replace(/\s+/g, '_')}_${cred.credential_type.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Store the credential value (in a real implementation, this would be decrypted)
    result[key] = cred.encrypted_value;
    
    // Store additional metadata if needed
    if (cred.metadata && Object.keys(cred.metadata).length > 0) {
      result[`${key}_metadata`] = cred.metadata;
    }
  });
  
  return result;
}

/**
 * Get mock credentials for development
 */
function getMockCredentials(): Record<string, any> {
  return {
    slack_api_key: 'xoxb-mock-slack-api-key',
    gmail_api_key: 'AIza-mock-gmail-api-key',
    google_sheets_api_key: 'AIza-mock-google-sheets-api-key',
    elevenlabs_api_key: 'mock-elevenlabs-api-key',
    elevenlabs_voice_id: 'mock-elevenlabs-voice-id',
    gemini_api_key: 'AIza-mock-gemini-api-key',
    openai_api_key: 'sk-mock-openai-api-key'
  };
}