import React, { useEffect, useState } from 'react';
import youtubeApi, { type CombinedData } from './api/api';
// import TP_DUMMY from './TP_DUMMY';
import {
  PopupHeader,
  LoadingState,
  SummarySection,
  BiasAnalysisSection,
  AlternateLinksSection,
  PopupFooter,
} from './components/transcript-popup/sections';

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



export const TranscriptPopup: React.FC<TranscriptPopupProps> = ({ videoId, onClose }) => {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(true);
  // Video time is now handled in content.tsx

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await youtubeApi.getFullAnalysis(videoId);
        setData(result);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
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

  const biasInfo = getBiasLevel(data?.bias_analysis?.bias_score ?? 0);

  return (
    <div id="youtube-transcript-ai" className="yt-transcript-popup">
      <PopupHeader onClose={onClose} />
      
      <div className="yt-transcript-content">
        <SummarySection
          summary={data?.summary || 'No summary available'}
          biasLevel={biasInfo.level}
          biasColor={biasInfo.color}
        />

        <BiasAnalysisSection
          viewPoint={data?.bias_analysis?.view_point || 'None detected'}
          sentences={data?.bias_analysis?.sentences || []}
        />

        <AlternateLinksSection
          links={DUMMY_DATA.alternateLinks}
        />

        <PopupFooter videoId={videoId} />

      </div>
    </div>
  );
};

export default TranscriptPopup;