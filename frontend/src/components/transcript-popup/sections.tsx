import React from 'react';
import type { AlternateLink } from '../../api/youtube-api';

interface PopupHeaderProps {
  onClose: () => void;
}

export const PopupHeader: React.FC<PopupHeaderProps> = ({ onClose }) => (
  <div className="yt-transcript-header">
    <div className="yt-transcript-title">
      <h3>📝 AI Transcript & Analysis</h3>
      <button onClick={onClose} className="yt-transcript-close">×</button>
    </div>
  </div>
);

export const LoadingState: React.FC = () => (
  <div className="yt-transcript-loading">
    <div className="spinner"></div>
    <p>Loading transcript and analysis...</p>
  </div>
);

interface BiasIndicatorProps {
  level: string;
  color: string;
}

export const BiasIndicator: React.FC<BiasIndicatorProps> = ({ level, color }) => (
  <div className="yt-transcript-bias-indicator">
    <span className="yt-transcript-bias-label">Bias Level:</span>
    <span className="yt-transcript-bias-score" style={{ color }}>
      {level}
    </span>
  </div>
);

interface SummarySectionProps {
  summary: string;
  biasLevel: string;
  biasColor: string;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ 
  summary, 
}) => (
  <div className="yt-transcript-section">
    <div className="yt-transcript-section-header">
      <h4>📋 Summary</h4>
    </div>
    <div className="yt-transcript-summary">
      {summary}
    </div>
  </div>
);

interface BiasAnalysisSectionProps {
  viewPoint: string;
  sentences: string[];
}

export const BiasAnalysisSection: React.FC<BiasAnalysisSectionProps> = ({ 
  viewPoint, 
  sentences 
}) => (
  <div className="yt-transcript-section">
    <div className="yt-transcript-section-header">
      <h4>🎯 Bias Analysis</h4>
    </div>
    <div className="yt-transcript-bias-details">
      <p><strong>View Point:</strong> {viewPoint}</p>
      {sentences.length > 0 ? (
        <>
          <p><strong>Biased Sentences:</strong></p>
          <ul>
            {sentences.map((sentence, index) => (
              <li key={index}>{sentence}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No biased sentences detected</p>
      )}
    </div>
  </div>
);

interface AlternateLinksProps {
  links: AlternateLink[];
}

export const AlternateLinksSection: React.FC<AlternateLinksProps> = ({ links }) => {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="yt-transcript-section">
      <div className="yt-transcript-section-header">
        <h4>🔗 Alternate Resources</h4>
        <span className="yt-transcript-link-count">{links.length} sources</span>
      </div>
      <div className="yt-transcript-links">
        {links.map((link, index) => (
          <div 
            key={index} 
            className="yt-transcript-link-item" 
            onClick={() => handleLinkClick(link.url)}
          >
            <div className="yt-transcript-link-header">
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="yt-transcript-link-title"
              >
                {link.title}
              </a>
              {link.source && (
                <span className="yt-transcript-link-source">{link.source}</span>
              )}
            </div>
            {link.url && (
              <div
                className="yt-transcript-link-url"
                style={{
                  color: '#2563eb', // Tailwind blue-600
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                title={link.url}
              >
                {link.url}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface PopupFooterProps {
  videoId: string;
}

export const PopupFooter: React.FC<PopupFooterProps> = ({ videoId }) => (
  <div className="yt-transcript-footer">
    <div className="yt-transcript-video-id">Video ID: {videoId}</div>
    <div className="yt-transcript-powered-by">Powered by AI</div>
  </div>
);