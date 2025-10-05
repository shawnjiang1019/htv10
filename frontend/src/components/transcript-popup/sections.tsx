import React from 'react';

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
  biasLevel, 
  biasColor 
}) => (
  <div className="yt-transcript-section">
    <div className="yt-transcript-section-header">
      <h4>📋 Summary</h4>
      <BiasIndicator level={biasLevel} color={biasColor} />
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

interface PopupFooterProps {
  videoId: string;
}

export const PopupFooter: React.FC<PopupFooterProps> = ({ videoId }) => (
  <div className="yt-transcript-footer">
    <div className="yt-transcript-video-id">Video ID: {videoId}</div>
    <div className="yt-transcript-powered-by">Powered by AI</div>
  </div>
);