import React, { useEffect, useState } from 'react';
import youtubeApi, { type CombinedData } from './api/api';
import './transcript-popup.css';
import TP_DUMMY from './TP_DUMMY';

interface TranscriptPopupProps {
  videoId: string;
  onClose: () => void;
}

interface BiasInfo {
  level: string;
  color: string;
}

function getBiasLevel(score: number): BiasInfo {
  if (score < 0.2) return { level: "Low Bias", color: "#10B981" };
  if (score < 0.5) return { level: "Moderate Bias", color: "#F59E0B" };
  return { level: "High Bias", color: "#EF4444" };
}

export const TranscriptPopup: React.FC<TranscriptPopupProps> = ({ videoId, onClose }) => {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDummyData, setUseDummyData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await youtubeApi.getFullAnalysis(videoId);
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data, using dummy data:', error);
        setUseDummyData(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);
  

  if (loading) {
    return (
      <div id="youtube-transcript-ai" className="yt-transcript-popup">
        <div className="yt-transcript-header">
          <div className="yt-transcript-title">
            <h3>📝 AI Transcript & Analysis</h3>
            <button onClick={onClose} className="yt-transcript-close">×</button>
          </div>
        </div>
        <div className="yt-transcript-content">
          <div className="yt-transcript-loading">
            <div className="spinner"></div>
            <p>Loading transcript and analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (useDummyData) {
    return <TP_DUMMY/>;
  }

  // Render with real API data
  const biasInfo = getBiasLevel(data?.bias_analysis?.bias_score ?? 0);

  return (
    <div id="youtube-transcript-ai" className="yt-transcript-popup">
      <div className="yt-transcript-header">
        <div className="yt-transcript-title">
          <h3>📝 AI Transcript & Analysis</h3>
          <button onClick={onClose} className="yt-transcript-close">×</button>
        </div>
      </div>
      
      <div className="yt-transcript-content">
        <div className="yt-transcript-section">
          <div className="yt-transcript-section-header">
            <h4>📋 Summary</h4>
            <div className="yt-transcript-bias-indicator">
              <span className="yt-transcript-bias-label">Bias Level:</span>
              <span className="yt-transcript-bias-score" style={{ color: biasInfo.color }}>
                {biasInfo.level}
              </span>
            </div>
          </div>
          <div className="yt-transcript-summary">
            {data?.summary || 'No summary available'}
          </div>
        </div>

        <div className="yt-transcript-section">
          <div className="yt-transcript-section-header">
            <h4>🎯 Bias Analysis</h4>
          </div>
          <div className="yt-transcript-bias-details">
            <p><strong>View Point:</strong> {data?.bias_analysis?.view_point || 'None detected'}</p>
            {data?.bias_analysis?.sentences && data.bias_analysis.sentences.length > 0 ? (
              <>
                <p><strong>Biased Sentences:</strong></p>
                <ul>
                  {data.bias_analysis.sentences.map((sentence, index) => (
                    <li key={index}>{sentence}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No biased sentences detected</p>
            )}
          </div>
        </div>

        <div className="yt-transcript-footer">
          <div className="yt-transcript-video-id">Video ID: {videoId}</div>
          <div className="yt-transcript-powered-by">Powered by AI</div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPopup;