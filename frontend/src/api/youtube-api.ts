// YouTube Transcript API client

// Types for YouTube API responses
export interface TranscriptData {
  video_id: string;
  sentences: string[];
  raw_text: string;
  summary: string;
  metadata: Record<string, unknown>;
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

export interface FlashEvent {
  id: string;
  timestamp: number;
  content: string;
  duration: number;
  url: string;
  factuality_classification: string;
  context_omission: string;
  emotional_language: string;
  emotional_tone: string;
  reasoning_and_sources: string;
}

export interface CombinedData extends TranscriptData {
  bias_analysis: BiasAnalysis;
}

const API_BASE_URL = 'http://127.0.0.1:8000/vid';

async function apiRequest<T>(endpoint: string): Promise<T> {
  try {
    console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
    
    // Try using Chrome messaging API to communicate with background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('Using Chrome messaging API...');
      
      // Extract video ID from endpoint
      const videoId = endpoint.split('/').pop();
      console.log('Extracted video ID for background script:', videoId);
      
      // Determine action based on endpoint
      let action = 'fetchYouTubeSummary';
      if (endpoint.includes('/youtube-transcript/')) {
        action = 'fetchFactChecks';
      }
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action, videoId },
          (response) => {
            console.log('Chrome messaging response:', response);
            
            if (chrome.runtime.lastError) {
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              reject(new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`));
              return;
            }
            
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Unknown error from background script'));
            }
          }
        );
      });
    }
    
    // Fallback to direct fetch if Chrome API is not available
    console.log('Chrome API not available, trying direct fetch...');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
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
    
    // If fetch fails, try using XMLHttpRequest as fallback
    console.log('Trying XMLHttpRequest fallback...');
    try {
      return await xmlHttpRequest(`${API_BASE_URL}${endpoint}`);
    } catch (fallbackError) {
      console.error('XMLHttpRequest fallback also failed:', fallbackError);
      throw error; // Throw original error
    }
  }
}

// Fallback using XMLHttpRequest
function xmlHttpRequest<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('XMLHttpRequest success:', data);
            resolve(data);
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${parseError}`));
          }
        } else {
          reject(new Error(`XMLHttpRequest failed: ${xhr.status} ${xhr.statusText}`));
        }
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('XMLHttpRequest network error'));
    };
    
    xhr.send();
  });
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

  // Get fact checks for real-time fact-checking
  async getFactChecks(videoId: string): Promise<FlashEvent[]> {
    return apiRequest<FlashEvent[]>(`/youtube-transcript/${videoId}`);
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
