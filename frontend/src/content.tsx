import { createRoot, type Root } from 'react-dom/client';
import TranscriptPopup from './TranscriptPopup';
import LiveCheck from './components/transcript-popup/LiveCheck';
import Timeline from './components/transcript-popup/Timeline';
import styles from './transcript-popup.css?inline';
import componentStyles from './components/injection-styles.css?inline';
import { youtubeApi } from './api/youtube-api';
import type { FlashEvent } from './api/youtube-api';

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
  private isPlaying = false;
  private interval: number;
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
    this.interval = setInterval(this.updateTime.bind(this), 1000);
    this.setupVideoListeners();
  }

  private setupVideoListeners() {
    const videoElement = document.querySelector<HTMLVideoElement>('video.html5-main-video');
    if (videoElement) {
      this.videoElement = videoElement;
      videoElement.addEventListener('play', () => { this.isPlaying = true; });
      videoElement.addEventListener('pause', () => { this.isPlaying = false; });
      videoElement.addEventListener('waiting', () => { this.isPlaying = false; });
      videoElement.addEventListener('playing', () => { this.isPlaying = true; });
      this.isPlaying = !videoElement.paused;
    }
  }

  private updateTime() {
    const videoElement = this.videoElement || document.querySelector<HTMLVideoElement>('video.html5-main-video');
    if (videoElement) {
      this.videoElement = videoElement;
      this.currentTime = videoElement.currentTime;
      this.duration = videoElement.duration || 0;
      this.isPlaying = !videoElement.paused;
    }
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getDuration() {
    return this.duration;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  cleanup() {
    clearInterval(this.interval);
    if (this.videoElement) {
      this.videoElement.removeEventListener('play', () => { this.isPlaying = true; });
      this.videoElement.removeEventListener('pause', () => { this.isPlaying = false; });
      this.videoElement.removeEventListener('waiting', () => { this.isPlaying = false; });
      this.videoElement.removeEventListener('playing', () => { this.isPlaying = true; });
    }
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

  // State for fact checks and loading - using same pattern as TranscriptPopup
  let flashEvents: FlashEvent[] = [];
  let timelineEvents: Array<{
    content: string;
    start: number;
    end: number;
  }> = [];
  let isLoading = true;

  // Fetch fact checks from API - following same pattern as YouTube summary
  const fetchFactChecks = async () => {
    try {
      console.log('Fetching fact checks for video:', videoId);
      
      // Check if video ID is valid
      if (!videoId || videoId === 'unknown') {
        throw new Error('Invalid video ID. Please make sure you are on a YouTube video page.');
      }
      
      const factChecks = await youtubeApi.getFactChecks(videoId);
      console.log('API response for fact checks:', factChecks);
      
      flashEvents = factChecks || [];
      
      // Create timeline events from flash events
      timelineEvents = flashEvents.map((flash) => ({
        content: flash.content,
        start: flash.timestamp,
        end: flash.timestamp + flash.duration
      }));
      
      console.log('Loaded fact checks:', flashEvents.length);
      console.log('Created timeline events:', timelineEvents.length);
      
      // Debug: Check if we have any events
      if (flashEvents.length === 0) {
        console.warn('No fact checks returned from API');
        console.log('Adding test data for debugging...');
        
        // Add test data for debugging
        flashEvents = [
          {
            id: "test_1",
            timestamp: 10,
            content: "This is a test fact check",
            duration: 5,
            url: "https://example.com",
            factuality_classification: "mostly correct",
            context_omission: "minor",
            emotional_language: "none",
            emotional_tone: "neutral",
            reasoning_and_sources: "Based on available evidence"
          },
          {
            id: "test_2", 
            timestamp: 30,
            content: "Another test fact check",
            duration: 4,
            url: "https://example.com",
            factuality_classification: "incorrect",
            context_omission: "major",
            emotional_language: "strong",
            emotional_tone: "negative",
            reasoning_and_sources: "Contradicts verified sources"
          }
        ];
        
        timelineEvents = flashEvents.map((flash) => ({
          content: flash.content,
          start: flash.timestamp,
          end: flash.timestamp + flash.duration
        }));
        
        console.log('Added test data:', flashEvents);
      } else {
        console.log('First fact check:', flashEvents[0]);
      }
    } catch (error) {
      console.error('Error fetching fact checks:', error);
      flashEvents = [];
      timelineEvents = [];
    } finally {
      isLoading = false;
    }
  };

  // Start fetching fact checks (don't await, let it run async)
  fetchFactChecks();

  // Setup LiveCheck rendering and interval management
  const setupLiveCheck = () => {    
    const renderComponents = () => {
      const currentTime = videoTime.getCurrentTime();
      const videoDuration = videoTime.getDuration();
      
      liveCheckRoot?.render(
        <div className="livecheck-container">
          <LiveCheck
            events={flashEvents}
            currentTime={currentTime}
            loading={isLoading}
            isVideoPlaying={videoTime.getIsPlaying()}
          />
          <Timeline 
            events={timelineEvents}
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
    const intervalId = setInterval(renderComponents, 1000);
    
    // Also re-render when data changes (after API call completes)
    const checkDataUpdate = setInterval(() => {
      if (!isLoading) {
        renderComponents();
        clearInterval(checkDataUpdate);
      }
    }, 100);
    
    return intervalId;
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