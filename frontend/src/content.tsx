import { createRoot, type Root } from 'react-dom/client';
import TranscriptPopup from './TranscriptPopup';
import styles from './transcript-popup.css?inline';

// Inject CSS into the page
function injectStyles() {
  if (document.getElementById('yt-transcript-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'yt-transcript-styles';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

// Helper: wait for an element to appear
function waitForElement<T extends Element>(
  selector: string, 
  timeout = 10000
): Promise<T> {
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

let currentRoot: Root | null = null;

async function injectPopup() {
  if (window.location.hostname !== "www.youtube.com" || 
      !window.location.pathname.startsWith("/watch")) {
    return;
  }

  // Inject styles first
  injectStyles();

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v") || "unknown";

  // Clean up existing popup
  const existingContainer = document.getElementById("yt-transcript-container");
  if (existingContainer) {
    currentRoot?.unmount();
    currentRoot = null;
    existingContainer.remove();
  }

  const container = document.createElement("div");
  container.id = "yt-transcript-container";

  const handleClose = () => {
    currentRoot?.unmount();
    currentRoot = null;
    container.remove();
  };

  try {
    const secondary = await waitForElement<HTMLElement>("#secondary");
    secondary.prepend(container);
  } catch {
    document.body.appendChild(container);
  }

  currentRoot = createRoot(container);
  currentRoot.render(<TranscriptPopup videoId={videoId} onClose={handleClose} />);
}

injectPopup();

// Handle SPA navigation
let currentUrl = window.location.href;
new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(injectPopup, 1000);
  }
}).observe(document.body, { childList: true, subtree: true });