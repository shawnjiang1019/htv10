// Content script for YouTube transcript extension
import { createTranscriptPopup, setupPopupEventListeners } from './popup-component';

// Get CSS styles for the extension
function getExtensionStyles(): string {
  return `
    /* YouTube Transcript AI Extension Styles - Dark Theme */
    .yt-transcript-popup {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
      overflow: hidden;
      position: relative;
      z-index: 10000;
      width: 100%;
      max-width: 400px;
      display: block;
    }

    /* Header */
    .yt-transcript-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      border-bottom: 1px solid #475569;
    }

    .yt-transcript-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
    }

    .yt-transcript-title h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .yt-transcript-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }

    .yt-transcript-close:hover {
      background: rgba(148, 163, 184, 0.3);
      color: #f1f5f9;
    }

    /* Content */
    .yt-transcript-content {
      padding: 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    /* Sections */
    .yt-transcript-section {
      border-bottom: 1px solid #374151;
      padding: 20px;
    }

    .yt-transcript-section:last-child {
      border-bottom: none;
    }

    .yt-transcript-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .yt-transcript-section-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #f9fafb;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Bias Indicator */
    .yt-transcript-bias-indicator {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .yt-transcript-bias-label {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 500;
    }

    .yt-transcript-bias-score {
      font-size: 14px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
    }

    .yt-transcript-confidence {
      font-size: 11px;
      color: #9ca3af;
    }

    /* Summary */
    .yt-transcript-summary {
      background: #374151;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #60a5fa;
      color: #e5e7eb;
      line-height: 1.6;
    }

    /* Links */
    .yt-transcript-link-count {
      font-size: 12px;
      color: #9ca3af;
      background: #374151;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .yt-transcript-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .yt-transcript-link-item {
      background: #374151;
      border: 1px solid #4b5563;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .yt-transcript-link-item:hover {
      border-color: #60a5fa;
      box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
      transform: translateY(-1px);
    }

    .yt-transcript-link-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 12px;
    }

    .yt-transcript-link-title {
      color: #f9fafb;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      line-height: 1.4;
      flex: 1;
      transition: color 0.2s ease;
    }

    .yt-transcript-link-title:hover {
      color: #60a5fa;
    }

    .yt-transcript-link-source {
      font-size: 12px;
      color: #9ca3af;
      background: #4b5563;
      padding: 2px 8px;
      border-radius: 12px;
      white-space: nowrap;
      font-weight: 500;
    }

    .yt-transcript-link-description {
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.4;
    }

    /* Footer */
    .yt-transcript-footer {
      background: #374151;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #4b5563;
    }

    .yt-transcript-video-id {
      font-size: 12px;
      color: #9ca3af;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .yt-transcript-powered-by {
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }

    /* Scrollbar Styling */
    .yt-transcript-content::-webkit-scrollbar {
      width: 6px;
    }

    .yt-transcript-content::-webkit-scrollbar-track {
      background: #374151;
    }

    .yt-transcript-content::-webkit-scrollbar-thumb {
      background: #6b7280;
      border-radius: 3px;
    }

    .yt-transcript-content::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .yt-transcript-popup {
        margin: 8px;
        border-radius: 8px;
      }
      
      .yt-transcript-section {
        padding: 16px;
      }
      
      .yt-transcript-link-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .yt-transcript-link-source {
        align-self: flex-start;
      }
    }
  `;
}

// Inject CSS styles directly into the page
function injectStyles() {
  // Check if styles are already injected
  if (document.getElementById('yt-transcript-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'yt-transcript-styles';
  style.textContent = getExtensionStyles();
  document.head.appendChild(style);
}

// Helper: wait for an element to appear
function waitForElement<T extends Element>(selector: string, timeout = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsed = 0;

    const checkExist = setInterval(() => {
      const el = document.querySelector<T>(selector);
      if (el) {
        clearInterval(checkExist);
        resolve(el);
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(checkExist);
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }
    }, interval);
  });
}

// Main injection function
async function injectPopup() {
  if (window.location.hostname !== "www.youtube.com") {
    return;
  }

  if (!window.location.pathname.startsWith("/watch")) {
    return;
  }

  // Inject CSS styles first
  injectStyles();

  // Extract video ID
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v") || "unknown";

  // Create popup using component
  const transcriptPopup = await createTranscriptPopup(videoId);

  try {
    const secondary = await waitForElement<HTMLElement>("#secondary");

    // Prevent duplicate injection
    if (!document.getElementById("youtube-transcript-ai")) {
      secondary.prepend(transcriptPopup);
      
      // Setup event listeners
      setupPopupEventListeners(transcriptPopup);
    }
  } catch (err) {
    // fallback: inject to body
    if (!document.getElementById("youtube-transcript-ai")) {
      document.body.appendChild(transcriptPopup);
      
      // Setup event listeners for fallback
      setupPopupEventListeners(transcriptPopup);
    }
  }
}

// Initial run
injectPopup();

// Handle SPA navigation on YouTube
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(injectPopup, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });