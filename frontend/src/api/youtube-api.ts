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

export interface AlternateLink {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

export interface YouTubeSummary {
  video_id: string;
  summary: string;
  alternateLinks: AlternateLink[];
}

export interface TranscriptWithTimestamps {
  text: string;
  time: number;
}

export interface CombinedData extends TranscriptData {
  bias_analysis: BiasAnalysis;
}

const API_BASE_URL = 'http://localhost:8000/vid';

async function apiRequest<T>(endpoint: string): Promise<T> {
  try {
    console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Parsed response data:', data);
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

  // Get YouTube summary with alternate links (new endpoint)
  async getYouTubeSummary(videoId: string): Promise<YouTubeSummary> {
    console.log('Making API request to:', `${API_BASE_URL}/youtube-summary/${videoId}`);
    return apiRequest<YouTubeSummary>(`/youtube-summary/${videoId}`);
  },

  // Get transcript with timestamps for real-time fact-checking
  async getTranscriptWithTimestamps(videoId: string): Promise<TranscriptWithTimestamps[]> {
    return apiRequest<TranscriptWithTimestamps[]>(`/youtube-transcript/${videoId}`);
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
