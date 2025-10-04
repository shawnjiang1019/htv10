// Popup Component for YouTube Transcript AI Extension

import transcriptApi from "./api/api"
// Dummy data - easy to update later

// interface link {
//   summary: string,
//   url: string,
//   source: string,
//   description: string
// }

type CombinedData = {
    summary?: string;
    bias_analysis: {
      bias_score?: number;
      view_point?: string;
      sentences?: string[];
    };
  };


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
  biasScore: 0.15, // 0 = completely unbiased, 1 = highly biased
  confidence: 0.87 // 0 = low confidence, 1 = high confidence
};

// Get bias level description
function getBiasLevel(score: number): { level: string; color: string } {
  if (score < 0.2) return { level: "Low Bias", color: "#10B981" };
  if (score < 0.5) return { level: "Moderate Bias", color: "#F59E0B" };
  return { level: "High Bias", color: "#EF4444" };
}

// Create the popup HTML

function showLoadingState(popup: HTMLElement): void {
  popup.innerHTML = `
    <div class="yt-transcript-header">
      <div class="yt-transcript-title">
        <h3>📝 AI Transcript & Analysis</h3>
        <button id="yt-transcript-close" class="yt-transcript-close">×</button>
      </div>
    </div>
    <div class="yt-transcript-content">
      <div class="yt-transcript-loading">
        <div class="spinner"></div>
        <p>Loading transcript and analysis...</p>
      </div>
    </div>
  `;
}

export async function createTranscriptPopup(videoId: string): Promise<HTMLElement> {
  //const biasInfo = getBiasLevel(DUMMY_DATA.biasScore);

  const popup = document.createElement("div");
  popup.id = "youtube-transcript-ai";
  popup.className = "yt-transcript-popup";

  showLoadingState(popup);

  try {
    // Fetch real data from API
    const data = await transcriptApi.getFullAnalysis(videoId);
    updatePopupWithData(popup, data, videoId);
  } catch (error) {
    console.error('Failed to load data, using dummy data:', error);
    // Fall back to dummy data
    updatePopupWithDummyData(popup, videoId);
  }

  return popup;
}

function updatePopupWithData(popup: HTMLElement, data: CombinedData, videoId: string): void {
  const biasInfo = getBiasLevel(data.bias_analysis?.bias_score ?? 0);

  popup.innerHTML = `
    <div class="yt-transcript-header">
      <div class="yt-transcript-title">
        <h3>📝 AI Transcript & Analysis</h3>
        <button id="yt-transcript-close" class="yt-transcript-close">×</button>
      </div>
    </div>
    
    <div class="yt-transcript-content">
      <!-- Summary Section -->
      <div class="yt-transcript-section">
        <div class="yt-transcript-section-header">
          <h4>📋 Summary</h4>
          <div class="yt-transcript-bias-indicator">
            <span class="yt-transcript-bias-label">Bias Level:</span>
            <span class="yt-transcript-bias-score" style="color: ${biasInfo.color}">
              ${biasInfo.level}
            </span>
          </div>
        </div>
        <div class="yt-transcript-summary">
          ${data.summary || 'No summary available'}
        </div>
      </div>

      <!-- Bias Analysis Section -->
      <div class="yt-transcript-section">
        <div class="yt-transcript-section-header">
          <h4>🎯 Bias Analysis</h4>
        </div>
        <div class="yt-transcript-bias-details">
          <p><strong>View Point:</strong> ${data.bias_analysis.view_point || 'None detected'}</p>
           ${data.bias_analysis.sentences && data.bias_analysis.sentences.length > 0 ? `
             <p><strong>Biased Sentences:</strong></p>
             <ul>
               ${data.bias_analysis.sentences.map(sentence => `<li>${sentence}</li>`).join('')}
             </ul>
           ` : '<p>No biased sentences detected</p>'}
        </div>
      </div>

      <!-- Footer -->
      <div class="yt-transcript-footer">
        <div class="yt-transcript-video-id">Video ID: ${videoId}</div>
        <div class="yt-transcript-powered-by">Powered by AI</div>
      </div>
    </div>
  `;
}

function updatePopupWithDummyData(popup: HTMLElement, videoId: string): void {
  const biasInfo = getBiasLevel(DUMMY_DATA.biasScore);
  
  popup.innerHTML = `
    <div class="yt-transcript-header">
      <div class="yt-transcript-title">
        <h3>📝 AI Transcript & Analysis</h3>
        <button id="yt-transcript-close" class="yt-transcript-close">×</button>
      </div>
    </div>
    
    <div class="yt-transcript-content">
      <!-- Summary Section -->
      <div class="yt-transcript-section">
        <div class="yt-transcript-section-header">
          <h4>📋 Summary</h4>
          <div class="yt-transcript-bias-indicator">
            <span class="yt-transcript-bias-label">Bias Level:</span>
            <span class="yt-transcript-bias-score" style="color: ${biasInfo.color}">
              ${biasInfo.level}
            </span>
            <div class="yt-transcript-confidence">
              Confidence: ${Math.round(DUMMY_DATA.confidence * 100)}%
            </div>
          </div>
        </div>
        <div class="yt-transcript-summary">
          ${DUMMY_DATA.summary}
        </div>
      </div>

      <!-- Alternate Links Section -->
      <div class="yt-transcript-section">
        <div class="yt-transcript-section-header">
          <h4>🔗 Unbiased Resources</h4>
          <span class="yt-transcript-link-count">${DUMMY_DATA.alternateLinks.length} sources</span>
        </div>
        <div class="yt-transcript-links">
          ${DUMMY_DATA.alternateLinks.map(link => `
            <div class="yt-transcript-link-item">
              <div class="yt-transcript-link-header">
                <a href="${link.url}" target="_blank" class="yt-transcript-link-title">
                  ${link.title}
                </a>
                <span class="yt-transcript-link-source">${link.source}</span>
              </div>
              <div class="yt-transcript-link-description">
                ${link.description}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Footer -->
      <div class="yt-transcript-footer">
        <div class="yt-transcript-video-id">Video ID: ${videoId}</div>
        <div class="yt-transcript-powered-by">Powered by AI</div>
      </div>
    </div>
  `;
}

// Setup event listeners for the popup
export function setupPopupEventListeners(popup: HTMLElement): void {
  const closeBtn = popup.querySelector("#yt-transcript-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.remove();
    });
  }

  // Add click handlers for link items
  const linkItems = popup.querySelectorAll(".yt-transcript-link-item");
  linkItems.forEach(item => {
    item.addEventListener("click", (e) => {
      const link = item.querySelector(".yt-transcript-link-title") as HTMLAnchorElement;
      if (link && !e.defaultPrevented) {
        window.open(link.href, "_blank");
      }
    });
  });
}
