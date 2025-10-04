// components/SummarySection.tsx

export default function SummarySection({ summary, biasInfo, confidence }: {
  summary?: string;
  biasInfo: { level: string, color: string };
  confidence?: number;
}) {
  return (
    <section className="yt-transcript-section">
      <div className="yt-transcript-section-header">
        <h4>📋 Summary</h4>
        <div className="yt-transcript-bias-indicator">
          <span className="yt-transcript-bias-label">Bias Level:</span>
          <span className="yt-transcript-bias-score" style={{ color: biasInfo.color }}>
            {biasInfo.level}
          </span>
          {confidence != null && (
            <div className="yt-transcript-confidence">Confidence: {Math.round(confidence * 100)}%</div>
          )}
        </div>
      </div>
      <div className="yt-transcript-summary">
        {summary || "No summary available"}
      </div>
    </section>
  );
}
