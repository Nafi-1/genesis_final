import axios from 'axios';
import { v4 as uuid } from 'uuid';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_FUNCTION_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Service for video generation and management
 */
class VideoService {
  /**
   * Generate a video from text
   */
  async generateVideo(
    text: string,
    options?: {
      avatarId?: string;
      webhookUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      console.log(`🎬 Generating video with text: ${text.substring(0, 50)}...`);
      
      // Try to use Supabase Edge Function if configured
      if (SUPABASE_URL && SUPABASE_FUNCTION_KEY && !SUPABASE_URL.includes('your_')) {
        return await this.generateVideoViaEdgeFunction(text, options);
      }
      
      // Fallback to local implementation
      console.log('⚠️ Using local video generation (mock)');
      return this.generateMockVideoResponse(text);
    } catch (error: any) {
      console.error('❌ Error in video generation:', error);
      throw new Error(`Video generation failed: ${error.message}`);
    }
  }
  
  /**
   * Get video generation status
   */
  async getVideoStatus(videoId: string): Promise<any> {
    try {
      console.log(`🎬 Getting status for video: ${videoId}`);
      
      // Try to check status via Supabase Edge Function if configured
      if (SUPABASE_URL && SUPABASE_FUNCTION_KEY && !SUPABASE_URL.includes('your_')) {
        return await this.getVideoStatusViaEdgeFunction(videoId);
      }
      
      // Fallback to mock status
      return this.getMockVideoStatus(videoId);
    } catch (error: any) {
      console.error('❌ Error getting video status:', error);
      throw new Error(`Failed to get video status: ${error.message}`);
    }
  }
  
  /**
   * List available avatars
   */
  async listAvatars(): Promise<Avatar[]> {
    try {
      console.log('🎬 Listing available avatars');
      
      // Try to use a real API if available
      try {
        const response = await axios.get(`${API_BASE_URL}/api/video/avatars`);
        
        if (response.data && Array.isArray(response.data.avatars)) {
          console.log(`✅ Retrieved ${response.data.avatars.length} avatars from API`);
          return response.data.avatars;
        }
      } catch (error) {
        console.warn('⚠️ Failed to get avatars from API, using mock avatars');
      }
      
      // Return mock avatars
      return this.getMockAvatars();
    } catch (error: any) {
      console.error('❌ Error listing avatars:', error);
      return this.getMockAvatars();
    }
  }
  
  /**
   * Generate video via Supabase Edge Function
   */
  private async generateVideoViaEdgeFunction(
    text: string,
    options?: {
      avatarId?: string;
      webhookUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${SUPABASE_URL}/functions/v1/video-generation`,
        {
          text,
          avatar_id: options?.avatarId,
          webhook_url: options?.webhookUrl,
          metadata: options?.metadata
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_FUNCTION_KEY}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Edge function video generation failed:', error);
      
      // Fall back to mock response
      console.log('⚠️ Falling back to mock video generation');
      return this.generateMockVideoResponse(text);
    }
  }
  
  /**
   * Get video status via Supabase Edge Function
   */
  private async getVideoStatusViaEdgeFunction(videoId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${SUPABASE_URL}/functions/v1/video-generation/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_FUNCTION_KEY}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Edge function video status check failed:', error);
      
      // Fall back to mock status
      console.log('⚠️ Falling back to mock video status');
      return this.getMockVideoStatus(videoId);
    }
  }
  
  /**
   * Generate a mock video response (for development/testing)
   */
  private generateMockVideoResponse(text: string): any {
    console.log('🔄 Generating mock video response');
    
    return {
      success: true,
      video: {
        id: uuid(),
        status: "processing",
        estimated_completion: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 min from now
        text: text,
        thumbnail_url: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
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
   * Get mock video status (for development/testing)
   */
  private getMockVideoStatus(videoId: string): any {
    console.log('🔄 Generating mock video status');
    
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
   * Get mock avatars (for development/testing)
   */
  private getMockAvatars(): Avatar[] {
    console.log('🔄 Generating mock avatars');
    
    return [
      {
        id: 'avatar-1',
        name: 'Professional Male',
        thumbnailUrl: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
        category: 'professional',
        gender: 'male'
      },
      {
        id: 'avatar-2',
        name: 'Professional Female',
        thumbnailUrl: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
        category: 'professional',
        gender: 'female'
      },
      {
        id: 'avatar-3',
        name: 'Casual Male',
        thumbnailUrl: 'https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
        category: 'casual',
        gender: 'male'
      },
      {
        id: 'avatar-4',
        name: 'Casual Female',
        thumbnailUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=100',
        category: 'casual',
        gender: 'female'
      }
    ];
  }
}

// Create singleton instance
const videoService = new VideoService();

export default videoService;

// Type declarations
export interface Avatar {
  id: string;
  name: string;
  thumbnailUrl: string;
  category?: string;
  gender?: string;
  description?: string;
}