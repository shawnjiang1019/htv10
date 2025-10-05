// YouTube Transcript API client

// Types for YouTube API responses
export interface TranscriptData {
  video_id: string;
  sentences: string[];
  raw_text: string;
  summary: string;
  metadata: any;
}

export interface BiasAnalysis {
  sentences: string[];
  bias_score: number;
  view_point: string;
  error?: string;
}

export interface CombinedData extends TranscriptData {
  bias_analysis: BiasAnalysis;
}

const API_BASE_URL = 'http://127.0.0.1:8080/vid';

async function apiRequest<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// YouTube API service functions
export const youtubeApi = {
  // Get transcript data
  async getTranscript(videoId: string): Promise<TranscriptData> {
    return apiRequest<TranscriptData>(`/get-transcript?video_id=${videoId}`);
  },

  // Get bias analysis
  async getBiasAnalysis(videoId: string): Promise<BiasAnalysis> {
    return apiRequest<BiasAnalysis>(`/analyze-bias?video_id=${videoId}`);
  },

  // Get both transcript and bias analysis
  async getFullAnalysis(videoId: string): Promise<CombinedData> {
    try {
      const [transcriptData, biasAnalysis] = await Promise.all([
        this.getTranscript(videoId),
        this.getBiasAnalysis(videoId)
      ]);

      return {
        ...transcriptData,
        bias_analysis: biasAnalysis
      };
    } catch (error) {
      console.error('Error fetching full analysis:', error);
      throw error;
    }
  }
};

// Export default for convenience
export default youtubeApi;
