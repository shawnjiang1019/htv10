import React, { useEffect, useState } from 'react';
import youtubeApi, { type YouTubeSummary } from './api/youtube-api';
import {
  PopupHeader,
  LoadingState,
  SummarySection,
  AlternateLinksSection,
  PopupFooter,
} from './components/transcript-popup/sections';

interface TranscriptPopupProps {
  videoId: string;
  onClose: () => void;
}





export const TranscriptPopup: React.FC<TranscriptPopupProps> = ({ videoId, onClose }) => {
  const [data, setData] = useState<YouTubeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching data for video ID:', videoId);
        
        // Check if video ID is valid
        if (!videoId || videoId === 'unknown') {
          throw new Error('Invalid video ID. Please make sure you are on a YouTube video page.');
        }
        
        const result = await youtubeApi.getYouTubeSummary(videoId);
        console.log('API response:', result);
        setData(result);
      } catch (error) {
        console.error('Failed to load data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load video summary: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  if (loading) {
    return (
      <div id="youtube-transcript-ai" className="yt-transcript-popup">
        <PopupHeader onClose={onClose} />
        <div className="yt-transcript-content">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="youtube-transcript-ai" className="yt-transcript-popup">
        <PopupHeader onClose={onClose} />
        <div className="yt-transcript-content">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="youtube-transcript-ai" className="yt-transcript-popup">
      <PopupHeader onClose={onClose} />
      
      <div className="yt-transcript-content">
        <SummarySection
          summary={data?.summary || 'No summary available'}
          biasLevel="Analysis Pending"
          biasColor="#6B7280"
        />

        <AlternateLinksSection
          links={data?.alternateLinks || []}
        />

        <PopupFooter videoId={videoId} />

      </div>
    </div>
  );
};

export default TranscriptPopup;