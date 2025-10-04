interface BiasInfo {
  level: string;
  color: string;
}

const DUMMY_DATA = {
  summary: "This video discusses the latest developments in artificial intelligence and machine learning, covering topics from neural networks to practical applications in various industries. The presenter provides insights into current trends and future possibilities in the field.",
  alternateLinks: [
    {
      title: "AI Ethics and Bias - Academic Perspective",
      url: "https://example.com/ai-ethics",
      source: "MIT Technology Review",
      description: "Comprehensive analysis of ethical considerations in AI development"
    },
    {
      title: "Machine Learning Fundamentals",
      url: "https://example.com/ml-fundamentals",
      source: "Stanford CS229",
      description: "Free course covering the mathematical foundations of ML"
    },
    {
      title: "AI in Healthcare - Research Paper",
      url: "https://example.com/ai-healthcare",
      source: "Nature Medicine",
      description: "Peer-reviewed research on AI applications in medical diagnosis"
    },
    {
      title: "Open Source AI Tools",
      url: "https://example.com/open-source-ai",
      source: "GitHub",
      description: "Community-driven AI tools and frameworks for developers"
    }
  ],
  biasScore: 0.15,
  confidence: 0.87
};

function getBiasLevel(score: number): BiasInfo {
  if (score < 0.2) return { level: "Low Bias", color: "#10B981" };
  if (score < 0.5) return { level: "Moderate Bias", color: "#F59E0B" };
  return { level: "High Bias", color: "#EF4444" };
}

export default function TP_DUMMY() {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };

const biasInfo = getBiasLevel(DUMMY_DATA.biasScore);

return (
    <div id="youtube-transcript-ai" className="yt-transcript-popup">
    <div className="yt-transcript-header">
        <div className="yt-transcript-title">
        <h3>📝 AI Transcript & Analysis</h3>
        <button className="yt-transcript-close">×</button>
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
            <div className="yt-transcript-confidence">
                Confidence: {Math.round(DUMMY_DATA.confidence * 100)}%
            </div>
            </div>
        </div>
        <div className="yt-transcript-summary">
            {DUMMY_DATA.summary}
        </div>
        </div>

        <div className="yt-transcript-section">
        <div className="yt-transcript-section-header">
            <h4>🔗 Unbiased Resources</h4>
            <span className="yt-transcript-link-count">{DUMMY_DATA.alternateLinks.length} sources</span>
        </div>
        <div className="yt-transcript-links">
            {DUMMY_DATA.alternateLinks.map((link, index) => (
            <div key={index} className="yt-transcript-link-item" onClick={() => handleLinkClick(link.url)}>
                <div className="yt-transcript-link-header">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="yt-transcript-link-title">
                    {link.title}
                </a>
                <span className="yt-transcript-link-source">{link.source}</span>
                </div>
                <div className="yt-transcript-link-description">
                {link.description}
                </div>
            </div>
            ))}
        </div>
        </div>

        <div className="yt-transcript-footer">
        <div className="yt-transcript-video-id">Video ID: {"woefij"}</div>
        <div className="yt-transcript-powered-by">Powered by AI</div>
        </div>
    </div>
    </div>
  );

};
