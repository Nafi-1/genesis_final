import { api } from '../lib/api';

/**
 * Service for video generation and management
 */
export const videoService = {
  /**
   * Generate a video from text
   */
  generateVideo: async (
    text: string,
    options?: {
      avatarId?: string;
      webhookUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<VideoGenerationResult> => {
    try {
      console.log(`🎬 Generating video with text: ${text.substring(0, 50)}...`);
      
      // Try to use the API endpoint
      try {
        const response = await api.post('/agent/video/generate', {
          text,
          avatar_id: options?.avatarId,
          webhook_url: options?.webhookUrl,
          metadata: options?.metadata
        });
        
        return response.data;
      } catch (error) {
        console.warn('Failed to generate video via API, using fallback:', error);
      }
      
      // Fall back to Supabase Edge Function if available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey && 
          !supabaseUrl.includes('your_') && !supabaseAnonKey.includes('your_')) {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/video-generation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
              },
              body: JSON.stringify({
                text,
                avatar_id: options?.avatarId,
                webhook_url: options?.webhookUrl,
                metadata: options?.metadata
              })
            }
          );
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.warn('Failed to generate video via Edge Function, using mock:', error);
        }
      }
      
      // If all else fails, return a mock response
      return generateMockVideoResponse(text);
    } catch (error) {
      console.error('Failed to generate video:', error);
      return generateMockVideoResponse(text);
    }
  },
  
  /**
   * Get video status
   */
  getVideoStatus: async (videoId: string): Promise<VideoStatus> => {
    try {
      console.log(`🎬 Getting status for video: ${videoId}`);
      
      // Try to use the API endpoint
      try {
        const response = await api.get(`/agent/video/status/${videoId}`);
        return response.data;
      } catch (error) {
        console.warn('Failed to get video status via API, using fallback:', error);
      }
      
      // Fall back to Supabase Edge Function if available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey && 
          !supabaseUrl.includes('your_') && !supabaseAnonKey.includes('your_')) {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/video-generation/${videoId}`,
            {
              headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`
              }
            }
          );
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.warn('Failed to get video status via Edge Function, using mock:', error);
        }
      }
      
      // Return mock status
      return getMockVideoStatus(videoId);
    } catch (error) {
      console.error('Failed to get video status:', error);
      return getMockVideoStatus(videoId);
    }
  },
  
  /**
   * List available avatars
   */
  listAvatars: async (): Promise<Avatar[]> => {
    try {
      console.log('🎬 Listing available avatars');
      
      // Try to use the API endpoint
      try {
        const response = await api.get('/agent/video/avatars');
        
        if (response.data.avatars) {
          return response.data.avatars;
        }
      } catch (error) {
        console.warn('Failed to list avatars via API, using fallback:', error);
      }
      
      // Return mock avatars
      return getMockAvatars();
    } catch (error) {
      console.error('Failed to list avatars:', error);
      return getMockAvatars();
    }
  }
};

/**
 * Generate a mock video response
 */
function generateMockVideoResponse(text: string): VideoGenerationResult {
  return {
    success: true,
    video: {
      id: `video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: "processing",
      estimated_completion: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
      text: text,
      thumbnail_url: `https://images.pexels.com/photos/${3756679 + Math.floor(Math.random() * 100)}/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`,
      metadata: {
        model: "advanced-personalized-avatar",
        processing_started: new Date().toISOString(),
        is_priority: true
      }
    },
    message: "Video generation initiated (mock)"
  };
}

/**
 * Get mock video status
 */
function getMockVideoStatus(videoId: string): VideoStatus {
  // Simulate different statuses based on videoId
  const videoIdNum = parseInt(videoId.replace(/\D/g, '').slice(-3)) || 0;
  
  if (videoIdNum % 10 === 0) {
    // Simulate failure for 10% of videos
    return {
      status: "failed",
      error: "Processing failed due to invalid input",
      id: videoId
    };
  } else if (videoIdNum % 3 === 0) {
    // Simulate processing for 30% of videos
    return {
      status: "processing",
      progress: Math.min(99, Math.floor(videoIdNum % 100)),
      id: videoId
    };
  } else {
    // Simulate completion for the rest
    return {
      status: "completed",
      url: "https://example.com/mock-video.mp4",
      thumbnail_url: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      id: videoId,
      completed_at: new Date().toISOString()
    };
  }
}

/**
 * Get mock avatars
 */
function getMockAvatars(): Avatar[] {
  return [
    {
      id: 'avatar-1',
      name: 'Business Professional',
      thumbnailUrl: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
      category: 'professional',
      gender: 'male'
    },
    {
      id: 'avatar-2',
      name: 'Corporate Specialist',
      thumbnailUrl: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
      category: 'professional',
      gender: 'female'
    },
    {
      id: 'avatar-3',
      name: 'Creative Professional',
      thumbnailUrl: 'https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
      category: 'casual',
      gender: 'male'
    },
    {
      id: 'avatar-4',
      name: 'Tech Specialist',
      thumbnailUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
      category: 'casual',
      gender: 'female'
    },
    {
      id: 'avatar-5',
      name: 'Data Analyst',
      thumbnailUrl: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
      category: 'professional',
      gender: 'male'
    },
    {
      id: 'avatar-6',
      name: 'Marketing Specialist',
      thumbnailUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
      category: 'professional',
      gender: 'female'
    }
  ];
}

// Type definitions
export interface Avatar {
  id: string;
  name: string;
  thumbnailUrl: string;
  category?: string;
  gender?: string;
  description?: string;
}

export interface VideoGenerationResult {
  success: boolean;
  video: {
    id: string;
    status: string;
    estimated_completion?: string;
    text?: string;
    thumbnail_url?: string;
    metadata?: Record<string, any>;
  };
  message?: string;
  error?: string;
}

export interface VideoStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  url?: string;
  thumbnail_url?: string;
  completed_at?: string;
  progress?: number;
  error?: string;
}