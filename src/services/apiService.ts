import axios, { AxiosRequestConfig, Method } from 'axios';

/**
 * Service for executing API requests and managing API credentials
 */
export const apiService = {
  /**
   * Execute an API request
   */
  executeRequest: async (
    config: {
      method: Method;
      url: string;
      headers?: Record<string, string>;
      body?: any;
      credentials?: Record<string, string>;
    }
  ) => {
    try {
      // Create a unique request ID for tracking
      const requestId = crypto.randomUUID();
      console.log(`🚀 Executing API request ${requestId}: ${config.method} ${config.url}`);
      
      // Prepare headers with credentials if provided
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };
      
      // Add any auth headers from credentials
      if (config.credentials) {
        Object.entries(config.credentials).forEach(([key, value]) => {
          // Handle common auth patterns
          if (key.toLowerCase().includes('api_key') || key.toLowerCase().includes('apikey')) {
            headers['X-API-Key'] = value;
          } else if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
            headers['Authorization'] = value.startsWith('Bearer ') ? value : `Bearer ${value}`;
          }
        });
      }
      
      // Prepare request config
      const requestConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        headers,
        data: config.method !== 'GET' ? config.body : undefined,
        params: config.method === 'GET' ? config.body : undefined
      };
      
      // Execute the request
      const response = await axios(requestConfig);
      
      console.log(`✅ API request ${requestId} completed with status ${response.status}`);
      
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
        requestId
      };
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Return structured error response
      return {
        error: true,
        status: error.response?.status,
        message: error.message,
        details: error.response?.data
      };
    }
  },
  
  /**
   * Generate a curl command from API request config
   */
  generateCurlCommand: async (config: {
    method: Method;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    description?: string;
  }): Promise<string> => {
    try {
      // If Gemini API is available, we could use it to generate a more intelligent curl command
      // For now, we'll generate it programmatically
      
      // Prepare headers
      let headersString = '';
      if (config.headers) {
        headersString = Object.entries(config.headers)
          .map(([key, value]) => `\\\n  -H "${key}: ${value}"`)
          .join(' ');
      } else {
        headersString = '\\\n  -H "Content-Type: application/json"';
      }
      
      // Prepare body
      let bodyString = '';
      if (config.body && config.method !== 'GET') {
        const jsonBody = typeof config.body === 'string' 
          ? config.body 
          : JSON.stringify(config.body, null, 2);
        
        bodyString = ` \\\n  -d '${jsonBody.replace(/'/g, "\\'")}'`;
      }
      
      // Assemble the curl command
      const curlCommand = `curl -X ${config.method} "${config.url}"${headersString}${bodyString}`;
      
      return curlCommand;
    } catch (error: any) {
      console.error('Failed to generate curl command:', error);
      return `# Error generating curl command: ${error.message}`;
    }
  },
  
  /**
   * Generate a curl command with Gemini AI assistance
   */
  generateCurlWithGemini: async (description: string, apiInfo?: {
    endpoint?: string;
    method?: string;
    service?: string;
  }): Promise<{ command: string; error?: string }> => {
    try {
      // Gemini API configuration
      const GEMINI_API_KEY = 'AIzaSyA81SV6mvA9ShZasJgcVl4ps-YQm9DrKsc';
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
      const GEMINI_MODEL = 'gemini-1.5-flash'; // Using faster model with higher rate limits
      
      // Create a prompt for Gemini to generate a curl command
      const prompt = `Generate a curl command for the following API request:
      
Description: ${description}
${apiInfo?.endpoint ? `Endpoint: ${apiInfo.endpoint}` : ''}
${apiInfo?.method ? `Method: ${apiInfo.method}` : ''}
${apiInfo?.service ? `Service: ${apiInfo.service}` : ''}

Please provide a complete, working curl command with proper formatting, headers, and sample data.`;
      
      try {
        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Extract the curl command from the response
        const curlMatch = generatedText.match(/```(?:bash|sh)?\s*(curl .+?)```/s) || 
                         generatedText.match(/(curl .+?)(?:\n\n|$)/s);
        
        const curlCommand = curlMatch && curlMatch[1] ? curlMatch[1].trim() : generatedText.trim();
        console.log('✅ Generated curl command successfully');
        return { command: curlCommand };
      } catch (error) {
        console.error('Failed to generate curl with Gemini:', error);
        
        // Throw the error to enable proper fallback handling
        throw error;
      }
    } catch (e: any) {
      console.error('Failed to generate curl with Gemini:', e);
      
      // Try using fallback generation
      try {
        const method = apiInfo?.method || 'POST';
        const endpoint = apiInfo?.endpoint || 'https://api.example.com/endpoint';
        const service = apiInfo?.service || '';
        
        // Create service-specific curl commands
        let curlCommand = `curl -X ${method} "${endpoint}" \\\n  -H "Content-Type: application/json"`;
        
        if (service) {
          switch (service.toLowerCase()) {
            case 'slack':
              curlCommand = `curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text": "${description}"}'`;
              break;
            case 'sendgrid':
            case 'email':
              curlCommand = `curl -X POST "https://api.sendgrid.com/v3/mail/send" \\\n  -H "Authorization: Bearer YOUR_SENDGRID_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"personalizations": [{"to": [{"email": "recipient@example.com"}]}], "from": {"email": "sender@yourdomain.com"}, "subject": "${description}", "content": [{"type": "text/plain", "value": "Generated email content based on: ${description}"}]}'`;
              break;
            case 'sheets':
            case 'google sheets':
              curlCommand = `curl -X GET "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SPREADSHEET_ID/values/Sheet1!A1:Z100" \\\n  -H "Authorization: Bearer YOUR_GOOGLE_API_KEY"`;
              break;
            case 'airtable':
              curlCommand = `curl -X GET "https://api.airtable.com/v0/YOUR_BASE_ID/YOUR_TABLE_NAME" \\\n  -H "Authorization: Bearer YOUR_AIRTABLE_API_KEY"`;
              break;
            case 'database':
              curlCommand = `curl -X POST "https://your-database-api.example.com/query" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_DB_API_KEY" \\\n  -d '{"query": "SELECT * FROM your_table WHERE condition = true"}'`;
              break;
            case 'api':
              curlCommand = `curl -X GET "https://api.example.com/endpoint" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"`;
              break;
            default:
              // If no recognized service, create a generic REST API call
              curlCommand = `curl -X ${method} "${endpoint}" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "${description.replace(/"/g, '\\"')}"}'`;
          }
        } else {
          // Create a body based on description
          curlCommand += ` \\\n  -d '{"query": "${description.replace(/"/g, '\\"')}"}'`;
        }
        
        console.log('✅ Generated fallback curl command');
        return { command: curlCommand };
      } catch (innerError: any) {
        // Final fallback for any unexpected errors
        console.error('All curl generation methods failed:', innerError);
        return { 
          command: `# Error generating curl command\ncurl -X POST "https://api.example.com/endpoint" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "${description.replace(/"/g, '\\"')}"}'`, 
          error: e.message
        };
      }
    }
  }
};