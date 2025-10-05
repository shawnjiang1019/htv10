import { createRoot, type Root } from 'react-dom/client';
import TranscriptPopup from './TranscriptPopup';
import LiveCheck from './components/transcript-popup/LiveCheck';
import Timeline from './components/transcript-popup/Timeline';
import styles from './transcript-popup.css?inline';
import componentStyles from './components/injection-styles.css?inline';

// Inject CSS into the page
function injectStyles() {
  if (document.getElementById('yt-transcript-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'yt-transcript-styles';
  styleEl.textContent = styles + '\n' + componentStyles;
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
let liveCheckRoot: Root | null = null;

// Class to handle video time tracking
class VideoTimeTracker {
  private currentTime = 0;
  private duration = 0;
  private interval: number;

  constructor() {
    this.interval = setInterval(this.updateTime.bind(this), 1000);
  }

  private updateTime() {
    const videoElement = document.querySelector<HTMLVideoElement>('video.html5-main-video');
    if (videoElement) {
      this.currentTime = videoElement.currentTime;
      this.duration = videoElement.duration || 0;
    }
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getDuration() {
    return this.duration;
  }

  cleanup() {
    clearInterval(this.interval);
  }
}

async function injectPopup() {
  if (window.location.hostname !== "www.youtube.com" || 
      !window.location.pathname.startsWith("/watch")) {
    return;
  }

  // Inject styles first
  injectStyles();

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v") || "unknown";
  
  console.log('YouTube Transcript AI: Extracted video ID:', videoId);
  console.log('YouTube Transcript AI: Current URL:', window.location.href);

  // Clean up existing elements
  const existingContainer = document.getElementById("yt-transcript-container");
  const existingLiveCheck = document.getElementById("yt-livecheck-container");
  
  if (existingContainer) {
    currentRoot?.unmount();
    currentRoot = null;
    existingContainer.remove();
  }
  if (existingLiveCheck) {
    existingLiveCheck.remove();
  }

  const container = document.createElement("div");
  container.id = "yt-transcript-container";

  const liveCheckContainer = document.createElement("div");
  liveCheckContainer.id = "yt-livecheck-container";
  liveCheckContainer.className = "yt-livecheck-wrapper";

  // Initialize video time tracking
  const videoTime = new VideoTimeTracker();

  const DUMMY_EVENTS = {
    flash: [
      {
        id: "1",
        timestamp: 5,
        content: "🤖 Machine Learning is a subset of AI - this foundational concept is crucial for understanding the field",
        type: "info" as const,
        duration: 4,
        category: "Key Concept"
      }
    ],
    timeline: [
      {
        content: "Introduction to AI concepts",
        start: 0,
        end: 135
      },
      {
        content: "Neural Networks Deep Dive",
        start: 135,
        end: 342
      },
      {
        content: "Real-world Applications",
        start: 342,
        end: 510
      },
    ]
  };

  // Setup LiveCheck rendering and interval management
  const setupLiveCheck = () => {    
    const renderComponents = () => {
      const currentTime = videoTime.getCurrentTime();
      const videoDuration = videoTime.getDuration();
      
      liveCheckRoot?.render(
        <div className="livecheck-container">
          <LiveCheck
            events={DUMMY_EVENTS.flash}
            currentTime={currentTime}
          />
          <Timeline 
            events={DUMMY_EVENTS.timeline}
            currentTime={currentTime}
            duration={videoDuration}
            onSeek={(time) => {
              const videoElement = document.querySelector<HTMLVideoElement>('video.html5-main-video');
              if (videoElement) videoElement.currentTime = time;
            }}
          />
        </div>
      );
    };

    // Initial render
    renderComponents();
    
    // Update every second
    return setInterval(renderComponents, 1000);
  };

  const handleClose = () => {
    // Unmount components
    currentRoot?.unmount();
    liveCheckRoot?.unmount();
    currentRoot = null;
    liveCheckRoot = null;

    // Remove containers
    container.remove();
    liveCheckContainer.remove();

    // Cleanup video time tracking
    videoTime.cleanup();
  };

  try {
    const secondary = await waitForElement<HTMLElement>("#secondary");
    secondary.prepend(container);
    secondary.prepend(liveCheckContainer);
  } catch {
    document.body.appendChild(container);
    document.body.appendChild(liveCheckContainer);
  }

  currentRoot = createRoot(container);
  liveCheckRoot = createRoot(liveCheckContainer);

  // Set up LiveCheck with interval
  const updateInterval = setupLiveCheck();
  
  // Render main component
  console.log('YouTube Transcript AI: Rendering TranscriptPopup with videoId:', videoId);
  currentRoot.render(
    <TranscriptPopup 
      videoId={videoId} 
      onClose={() => {
        clearInterval(updateInterval);
        handleClose();
      }} 
    />
  );
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