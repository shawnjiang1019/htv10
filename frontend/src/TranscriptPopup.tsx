import React, { useEffect, useState } from 'react';
import youtubeApi, { type CombinedData } from './api/api';
// import TP_DUMMY from './TP_DUMMY';
import {
  PopupHeader,
  LoadingState,
  SummarySection,
  BiasAnalysisSection,
  PopupFooter
} from './components/transcript-popup/sections';
import Timeline from './components/transcript-popup/Timeline';

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

const DUMMY_TIMELINE_EVENTS=  [
  {
    content: "Introduction to AI and machine learning concepts",
    start: 0,
    end: 135
  },
  {
    content: "Deep dive into neural network architectures",
    start: 135,
    end: 342
  },
  {
    content: "Real-world applications in healthcare and finance",
    start: 342,
    end: 510
  },
  {
    content: "Discussing ethical implications and bias in AI",
    start: 510,
    end: 665
  },
  {
    content: "Future trends and predictions for AI development",
    start: 665,
    end: 800
  },
  {
    content: "Q&A session and concluding remarks",
    start: 800,
    end: 920
  }
];

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
        <PopupHeader onClose={onClose} />
        <div className="yt-transcript-content">
          <LoadingState />
        </div>
      </div>
    );
  }

  DUMMY_DATA
  useDummyData

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
        
        <Timeline 
          events={DUMMY_TIMELINE_EVENTS}
          currentTime={250}
          onSeek={() => {alert(1)}}
        />
        <PopupFooter videoId={videoId} />

      </div>
    </div>
  );
};

export default TranscriptPopup;