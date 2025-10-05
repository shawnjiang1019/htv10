import React, { useEffect, useState } from 'react';
import { articleApi, type ArticleData } from './api/article-api';
import {
  PopupHeader,
  LoadingState,
  SummarySection,
  AlternateLinksSection,
} from './components/transcript-popup/sections';
import './transcript-popup.css';

interface ArticlePopupProps {
  articleUrl: string;
  onClose: () => void;
}

export const ArticlePopup: React.FC<ArticlePopupProps> = ({ articleUrl, onClose }) => {
  const [data, setData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching article data for URL:', articleUrl);
        
        // Check if URL is valid
        if (!articleUrl) {
          throw new Error('Invalid URL. Please provide a valid article URL.');
        }
        
        const result = await articleApi.getAlternativeArticles(articleUrl);
        console.log('Article API response:', result);
        setData(result);
      } catch (error) {
        console.error('Failed to load article data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load article summary: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [articleUrl]);

  if (loading) {
    return (
      <div id="article-analysis-ai" className="yt-transcript-popup">
        <PopupHeader onClose={onClose} />
        <div className="yt-transcript-content">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="article-analysis-ai" className="yt-transcript-popup">
        <PopupHeader onClose={onClose} />
        <div className="yt-transcript-content">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={onClose} className="error-close-button">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="article-analysis-ai" className="yt-transcript-popup">
      <PopupHeader onClose={onClose} />
      
      <div className="yt-transcript-content">
        <SummarySection
          summary={data?.summary || 'No summary available'}
          biasLevel="Analysis Pending"
          biasColor="#6B7280"
        />

        <AlternateLinksSection
          links={data?.alternateLinks?.map(link => ({
            title: link.title,
            url: link.url,
            source: link.source,
            description: link.description
          })) || []}
        />

        <div className="yt-transcript-footer">
          <div className="yt-transcript-video-id">
            Article Analysis
          </div>
          <div className="yt-transcript-powered-by">
            Powered by AI
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePopup;

