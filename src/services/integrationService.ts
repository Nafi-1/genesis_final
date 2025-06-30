/**
 * Integration types supported by GenesisOS
 */
export enum IntegrationType {
  API = 'api',
  DATABASE = 'database',
  EMAIL = 'email',
  SLACK = 'slack',
  GOOGLE_SHEETS = 'google_sheets',
  GOOGLE_DRIVE = 'google_drive',
  WEBHOOK = 'webhook',
  CALENDAR = 'calendar',
  SMS = 'sms',
  VOICE = 'voice',
  STORAGE = 'storage',
  OTHER = 'other'
}

/**
 * Integration definition structure
 */
export interface Integration {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  icon: string;
  authType: 'api_key' | 'oauth' | 'webhook' | 'basic_auth' | 'custom';
  requiredCredentials: {
    key: string;
    name: string;
    description: string;
  }[];
  actions: {
    id: string;
    name: string;
    description: string;
    parameters: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
  }[];
  triggers?: {
    id: string;
    name: string;
    description: string;
    parameters: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
  }[];
}

/**
 * Service for managing external integrations
 */
export const integrationService = {
  /**
   * Get all available integrations
   */
  getAllIntegrations: (): Integration[] => {
    return INTEGRATIONS;
  },
  
  /**
   * Get integrations by type
   */
  getIntegrationsByType: (type: IntegrationType): Integration[] => {
    return INTEGRATIONS.filter(integration => integration.type === type);
  },
  
  /**
   * Get integration by ID
   */
  getIntegrationById: (id: string): Integration | undefined => {
    return INTEGRATIONS.find(integration => integration.id === id);
  },
  
  /**
   * Get integrations by name (partial match)
   */
  searchIntegrations: (query: string): Integration[] => {
    const lowerQuery = query.toLowerCase();
    return INTEGRATIONS.filter(integration => 
      integration.name.toLowerCase().includes(lowerQuery) ||
      integration.description.toLowerCase().includes(lowerQuery)
    );
  }
};

/**
 * Available integrations in GenesisOS
 */
export const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages, notifications, and interact with Slack channels',
    type: IntegrationType.SLACK,
    icon: 'MessageSquare',
    authType: 'api_key',
    requiredCredentials: [
      {
        key: 'slack_api_key',
        name: 'Slack Bot Token',
        description: 'Bot User OAuth Token from Slack API dashboard'
      }
    ],
    actions: [
      {
        id: 'slack_send_message',
        name: 'Send Message',
        description: 'Send a message to a Slack channel or user',
        parameters: [
          {
            name: 'channel',
            type: 'string',
            required: true,
            description: 'Channel ID or name (#general) or user ID (@username)'
          },
          {
            name: 'text',
            type: 'string',
            required: true,
            description: 'Message text to send'
          },
          {
            name: 'blocks',
            type: 'json',
            required: false,
            description: 'Slack Block Kit content (advanced)'
          }
        ]
      },
      {
        id: 'slack_update_message',
        name: 'Update Message',
        description: 'Update an existing Slack message',
        parameters: [
          {
            name: 'channel',
            type: 'string',
            required: true,
            description: 'Channel ID where the message is located'
          },
          {
            name: 'ts',
            type: 'string',
            required: true,
            description: 'Timestamp of the message to update'
          },
          {
            name: 'text',
            type: 'string',
            required: true,
            description: 'New message text'
          }
        ]
      }
    ],
    triggers: [
      {
        id: 'slack_event',
        name: 'Message Event',
        description: 'Triggered when a message is posted in a channel',
        parameters: [
          {
            name: 'channel',
            type: 'string',
            required: true,
            description: 'Channel ID or name to monitor'
          }
        ]
      }
    ]
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Read, write, and update Google Sheets data',
    type: IntegrationType.GOOGLE_SHEETS,
    icon: 'FileText',
    authType: 'api_key',
    requiredCredentials: [
      {
        key: 'google_sheets_api_key',
        name: 'Google Sheets API Key',
        description: 'API Key from Google Cloud Console with Sheets API enabled'
      }
    ],
    actions: [
      {
        id: 'sheets_read',
        name: 'Read Range',
        description: 'Read data from a specified range in a Google Sheet',
        parameters: [
          {
            name: 'spreadsheetId',
            type: 'string',
            required: true,
            description: 'ID of the Google Sheet (from URL)'
          },
          {
            name: 'range',
            type: 'string',
            required: true,
            description: 'Cell range (e.g., Sheet1!A1:B10)'
          }
        ]
      },
      {
        id: 'sheets_update',
        name: 'Update Range',
        description: 'Update data in a specified range in a Google Sheet',
        parameters: [
          {
            name: 'spreadsheetId',
            type: 'string',
            required: true,
            description: 'ID of the Google Sheet (from URL)'
          },
          {
            name: 'range',
            type: 'string',
            required: true,
            description: 'Cell range (e.g., Sheet1!A1:B10)'
          },
          {
            name: 'values',
            type: 'array',
            required: true,
            description: 'Values to write (2D array)'
          }
        ]
      }
    ],
    triggers: [
      {
        id: 'sheets_change',
        name: 'Sheet Changed',
        description: 'Triggered when a Google Sheet is updated',
        parameters: [
          {
            name: 'spreadsheetId',
            type: 'string',
            required: true,
            description: 'ID of the Google Sheet to monitor'
          }
        ]
      }
    ]
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send emails and monitor your inbox',
    type: IntegrationType.EMAIL,
    icon: 'Mail',
    authType: 'api_key',
    requiredCredentials: [
      {
        key: 'gmail_api_key',
        name: 'Gmail API Key',
        description: 'API Key from Google Cloud Console with Gmail API enabled'
      }
    ],
    actions: [
      {
        id: 'gmail_send',
        name: 'Send Email',
        description: 'Send an email through Gmail',
        parameters: [
          {
            name: 'to',
            type: 'string',
            required: true,
            description: 'Recipient email address'
          },
          {
            name: 'subject',
            type: 'string',
            required: true,
            description: 'Email subject line'
          },
          {
            name: 'body',
            type: 'string',
            required: true,
            description: 'Email body content'
          },
          {
            name: 'isHtml',
            type: 'boolean',
            required: false,
            description: 'Whether the body content is HTML'
          }
        ]
      }
    ],
    triggers: [
      {
        id: 'gmail_new_email',
        name: 'New Email',
        description: 'Triggered when a new email arrives',
        parameters: [
          {
            name: 'from',
            type: 'string',
            required: false,
            description: 'Filter by sender email (optional)'
          },
          {
            name: 'subject',
            type: 'string',
            required: false,
            description: 'Filter by subject text (optional)'
          }
        ]
      }
    ]
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Create custom HTTP endpoints to receive data from external services',
    type: IntegrationType.WEBHOOK,
    icon: 'Globe',
    authType: 'webhook',
    requiredCredentials: [],
    actions: [
      {
        id: 'webhook_send',
        name: 'Send Webhook',
        description: 'Send data to an external webhook URL',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'Webhook URL'
          },
          {
            name: 'method',
            type: 'string',
            required: true,
            description: 'HTTP method (GET, POST, PUT, DELETE)'
          },
          {
            name: 'headers',
            type: 'json',
            required: false,
            description: 'HTTP headers as JSON'
          },
          {
            name: 'body',
            type: 'json',
            required: false,
            description: 'Request body as JSON'
          }
        ]
      }
    ],
    triggers: [
      {
        id: 'webhook_receive',
        name: 'Receive Webhook',
        description: 'Triggered when data is received on your webhook endpoint',
        parameters: [
          {
            name: 'path',
            type: 'string',
            required: true,
            description: 'Custom path for your webhook endpoint'
          }
        ]
      }
    ]
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Generate realistic AI voice audio from text',
    type: IntegrationType.VOICE,
    icon: 'Volume',
    authType: 'api_key',
    requiredCredentials: [
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
    actions: [
      {
        id: 'elevenlabs_tts',
        name: 'Text to Speech',
        description: 'Convert text to lifelike speech audio',
        parameters: [
          {
            name: 'text',
            type: 'string',
            required: true,
            description: 'Text content to convert to speech'
          },
          {
            name: 'voiceId',
            type: 'string',
            required: false,
            description: 'Specific voice ID (optional, uses default if not specified)'
          },
          {
            name: 'stability',
            type: 'number',
            required: false,
            description: 'Voice stability (0-1)'
          },
          {
            name: 'similarityBoost',
            type: 'number',
            required: false,
            description: 'Voice similarity boost (0-1)'
          }
        ]
      }
    ],
    triggers: []
  },
  {
    id: 'gemini',
    name: 'Google Gemini AI',
    description: 'Leverage Google\'s advanced AI model for content generation and analysis',
    type: IntegrationType.API,
    icon: 'Brain',
    authType: 'api_key',
    requiredCredentials: [
      {
        key: 'gemini_api_key',
        name: 'Gemini API Key',
        description: 'API Key from Google AI Studio'
      }
    ],
    actions: [
      {
        id: 'gemini_generate',
        name: 'Generate Content',
        description: 'Generate content using Gemini AI',
        parameters: [
          {
            name: 'prompt',
            type: 'string',
            required: true,
            description: 'Text prompt for content generation'
          },
          {
            name: 'temperature',
            type: 'number',
            required: false,
            description: 'Creativity level (0-1)'
          },
          {
            name: 'maxOutputTokens',
            type: 'number',
            required: false,
            description: 'Maximum length of generated content'
          }
        ]
      }
    ],
    triggers: []
  }
];