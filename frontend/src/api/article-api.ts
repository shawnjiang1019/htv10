// Article Transcript API client (for future use)

// Types for Article API responses
export interface ArticleData {
  summary: string;
  alternatelinks: Array<{
    title: string;
    url: string;
    source: string;
    description: string;
  }>;
}

const API_BASE_URL = 'http://127.0.0.1:8080/article';

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

// Article API service functions
export const articleApi = {
  // Get alternative articles based on transcript text
  async getAlternativeArticles(transcriptText: string): Promise<ArticleData> {
    return apiRequest<ArticleData>(`/alternative?transcript_text=${encodeURIComponent(transcriptText)}`);
  }
};

// Export default for convenience
export default articleApi;
