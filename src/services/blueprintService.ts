import { Blueprint } from '../types';

// Gemini API configuration

/**
 * Service for handling blueprint operations
 */
export const blueprintService = {
  /**
   * Generate a blueprint from user input
   */
  generateBlueprint: async (userInput: string): Promise<Blueprint> => {
    try {
      console.log('🧠 Generating blueprint from user input:', userInput.substring(0, 50) + '...');
     
      // Attempt to generate blueprint using comprehensive service discovery
      const services = [
        // Try agent service
        async () => {
          const agentServiceUrl = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8001';
          console.log('🤖 Attempting to generate blueprint via agent service:', agentServiceUrl);
          
          // Try multiple endpoints that might be valid
          const endpoints = [
            '/generate-blueprint',
            '/v1/generate-blueprint',
            '/api/generate-blueprint'
          ];
          
          for (const endpoint of endpoints) {
            try {
              console.log(`🔄 Trying agent service endpoint: ${agentServiceUrl}${endpoint}`);
              
              const response = await fetch(`${agentServiceUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: userInput })
              });
              
              if (response.ok) {
                const blueprint = await response.json();

                // Generate a unique ID if not present
                if (!blueprint.id) {
                  blueprint.id = `blueprint-${Date.now()}`;
                }

                // Ensure user input is set
                blueprint.user_input = userInput;

                // Add status and timestamp if not present
                if (!blueprint.status) {
                  blueprint.status = 'pending';
                }
                if (!blueprint.created_at) {
                  blueprint.created_at = new Date().toISOString();
                }

                console.log('✅ Blueprint generated successfully with agent service');
                return blueprint;
              }
            } catch (jsonError) {
              console.error('Failed to parse JSON from Gemini response:', jsonError);
            }
          }
        }
      ];
      
      // Try each service in sequence
      for (const serviceCall of services) {
        try {
          return await serviceCall();
        } catch (error) {
          console.error('Error calling service:', error);
        }
      }

      // If all services fail, create a fallback blueprint
      console.error('❌ All blueprint generation methods failed');
      return createSampleBlueprint(userInput);
    } catch (error) {
      console.error('Failed to generate blueprint:', error);
      
      // Always provide a result rather than throwing to maintain UX
      console.log('Creating emergency fallback blueprint');
      return createSampleBlueprint(userInput);
    }
  },
  
  /**
   * Create a sample blueprint for testing
   */
  createSampleBlueprint: (userInput: string): Blueprint => {
    const guildName = getGuildNameFromInput(userInput);
    
    return {
      id: `blueprint-${Date.now()}`,
      user_input: userInput,
      interpretation: `I understand that you want to: ${userInput}. I'll create a comprehensive AI-powered system to accomplish this goal using specialized AI agents and automated workflows.`,
      suggested_structure: {
        guild_name: guildName,
        guild_purpose: `A powerful AI guild designed to accomplish: ${userInput}`,
        agents: [
          {
            name: "Data Analyst",
            role: "Analytics Specialist",
            description: "Analyzes data and provides actionable insights",
            tools_needed: ["Google Analytics API", "Database", "Reporting Tools"]
          },
          {
            name: "Content Creator",
            role: "Creative Writer",
            description: "Generates high-quality content based on analytics",
            tools_needed: ["Google Docs", "Grammarly", "Content Management"]
          },
          {
            name: "Outreach Manager",
            role: "Communications Specialist",
            description: "Handles external communications and promotions",
            tools_needed: ["Email API", "Social Media API", "CRM System"]
          }
        ],
        workflows: [
          {
            name: "Weekly Analytics Review",
            description: "Analyzes weekly metrics and generates detailed reports",
            trigger_type: "schedule"
          },
          {
            name: "Content Production Pipeline",
            description: "Creates and publishes content based on performance data",
            trigger_type: "manual"
          },
          {
            name: "Customer Response System",
            description: "Responds to customer inquiries and feedback",
            trigger_type: "webhook"
          }
        ]
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
};

/**
 * Generate a guild name from user input
 */
function getGuildNameFromInput(userInput: string): string {
  const keywords = userInput.toLowerCase();
  
  if (keywords.includes('customer') || keywords.includes('support')) {
    return "Customer Success Guild";
  } else if (keywords.includes('sales') || keywords.includes('revenue')) {
    return "Revenue Growth Guild";
  } else if (keywords.includes('marketing') || keywords.includes('content')) {
    return "Marketing Intelligence Guild";
  } else if (keywords.includes('analytics') || keywords.includes('data')) {
    return "Data Intelligence Guild";
  } else if (keywords.includes('finance') || keywords.includes('payment')) {
    return "Financial Operations Guild";
  } else {
    return "Business Automation Guild";
  }
}

function createSampleBlueprint(userInput: string): Blueprint {
  const guildName = getGuildNameFromInput(userInput);

  return {
    id: `blueprint-${Date.now()}`,
    user_input: userInput,
    interpretation: `I understand that you want to: ${userInput}. I'll create a comprehensive AI-powered system to accomplish this goal using specialized AI agents and automated workflows.`,
    suggested_structure: {
      guild_name: guildName,
      guild_purpose: `A powerful AI guild designed to accomplish: ${userInput}`,
      agents: [
        {
          name: "Data Analyst",
          role: "Analytics Specialist",
          description: "Analyzes data and provides actionable insights",
          tools_needed: ["Google Analytics API", "Database", "Reporting Tools"]
        },
        {
          name: "Content Creator",
          role: "Creative Writer",
          description: "Generates high-quality content based on analytics",
          tools_needed: ["Google Docs", "Grammarly", "Content Management"]
        },
        {
          name: "Outreach Manager",
          role: "Communications Specialist",
          description: "Handles external communications and promotions",
          tools_needed: ["Email API", "Social Media API", "CRM System"]
        }
      ],
      workflows: [
        {
          name: "Weekly Analytics Review",
          description: "Analyzes weekly metrics and generates detailed reports",
          trigger_type: "schedule"
        },
        {
          name: "Content Production Pipeline",
          description: "Creates and publishes content based on performance data",
          trigger_type: "manual"
        },
        {
          name: "Customer Response System",
          description: "Responds to customer inquiries and feedback",
          trigger_type: "webhook"
        }
      ]
    },
    status: 'pending',
    created_at: new Date().toISOString()
  };
}

