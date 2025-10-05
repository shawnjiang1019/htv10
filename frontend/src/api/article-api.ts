// Article Transcript API client (for future use)

// Types for Article API responses
export interface ArticleData {
  summary: string;
  alternateLinks: Array<{
    title: string;
    url: string;
    source: string;
    description: string;
  }>;
}


export interface AlternateLink {
  title: string;
  url: string;
  source: string;
  description: string;
}


export interface ArticleSummary {
  url: string;
  summary: string;
  alternateLinks: AlternateLink[];
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
  // Get alternative articles based on article URL
  async getAlternativeArticles(articleUrl: string): Promise<ArticleData> {
    console.log('Making API request to:', `${API_BASE_URL}/alternative?url=${encodeURIComponent(articleUrl)}`);
    return apiRequest<ArticleData>(`/alternative?url=${encodeURIComponent(articleUrl)}`);
  }, 

  async getArticleSummary(url: string): Promise<ArticleSummary> {
    console.log('Making API request to:', `${API_BASE_URL}/alternative?url=${encodeURIComponent(url)}`);
    return apiRequest<ArticleSummary>(`/alternative?url=${encodeURIComponent(url)}`);
  },
};



// Export default for convenience
export default articleApi;
