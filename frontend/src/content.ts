// Content script for injecting popup into YouTube
import './content.css';
console.log('YouTube Transcript AI: Content script loaded');

// Check if we're on a YouTube video page
function isYouTubeVideoPage(): boolean {
  return window.location.hostname === 'www.youtube.com' && 
         window.location.pathname.startsWith('/watch');
}

// Extract video ID from URL
function getVideoId(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Create the popup container
function createPopup(): HTMLElement {
  const popup = document.createElement('div');
  popup.id = 'youtube-transcript-popup';
  popup.innerHTML = `
    <div class="transcript-header">
      <h3>📝 Transcript & Summary</h3>
      <button id="close-popup" class="close-btn">×</button>
    </div>
    <div class="transcript-content">
      <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading transcript...</p>
      </div>
      <div id="transcript-data" class="transcript-data" style="display: none;">
        <div class="tabs">
          <button class="tab-btn active" data-tab="transcript">Transcript</button>
          <button class="tab-btn" data-tab="summary">Summary</button>
          <button class="tab-btn" data-tab="metadata">Info</button>
        </div>
        <div class="tab-content">
          <div id="transcript-tab" class="tab-pane active">
            <div id="sentences"></div>
          </div>
          <div id="summary-tab" class="tab-pane">
            <div id="summary-content"></div>
          </div>
          <div id="metadata-tab" class="tab-pane">
            <div id="metadata-content"></div>
          </div>
        </div>
      </div>
      <div id="error" class="error" style="display: none;">
        <p>Failed to load transcript. Please try again.</p>
        <button id="retry-btn" class="retry-btn">Retry</button>
      </div>
    </div>
  `;
  
  return popup;
}

// CSS is now imported from content.css file

// Fetch transcript data from backend
async function fetchTranscript(videoId: string): Promise<any> {
  try {
    const response = await fetch(`http://localhost:8000/vid/get-transcript?video_id=${videoId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

// Display transcript data
function displayTranscriptData(data: any): void {
  const transcriptData = document.getElementById('transcript-data');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'none';
  if (transcriptData) transcriptData.style.display = 'block';
  
  // Display sentences
  const sentencesContainer = document.getElementById('sentences');
  if (sentencesContainer && data.sentences) {
    sentencesContainer.innerHTML = data.sentences
      .map((sentence: string, index: number) => 
        `<div class="sentence">${index + 1}. ${sentence}</div>`
      ).join('');
  }
  
  // Display summary
  const summaryContent = document.getElementById('summary-content');
  if (summaryContent && data.summary) {
    summaryContent.innerHTML = `<div class="summary-text">${data.summary}</div>`;
  }
  
  // Display metadata
  const metadataContent = document.getElementById('metadata-content');
  if (metadataContent && data.metadata) {
    const metadata = data.metadata;
    metadataContent.innerHTML = `
      <div class="metadata-item">
        <div class="metadata-label">Title:</div>
        <div class="metadata-value">${metadata.title || 'N/A'}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Channel:</div>
        <div class="metadata-value">${metadata.uploader || 'N/A'}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Duration:</div>
        <div class="metadata-value">${metadata.duration ? Math.floor(metadata.duration / 60) + ':' + (metadata.duration % 60).toString().padStart(2, '0') : 'N/A'}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Views:</div>
        <div class="metadata-value">${metadata.view_count ? metadata.view_count.toLocaleString() : 'N/A'}</div>
      </div>
    `;
  }
}

// Show error
function showError(): void {
  const transcriptData = document.getElementById('transcript-data');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  
  if (loading) loading.style.display = 'none';
  if (transcriptData) transcriptData.style.display = 'none';
  if (error) error.style.display = 'block';
}

// Tab switching functionality
function setupTabs(): void {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Remove active class from all buttons and panes
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      btn.classList.add('active');
      const targetPane = document.getElementById(`${targetTab}-tab`);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Initialize popup
async function initPopup(): Promise<void> {
  if (!isYouTubeVideoPage()) return;
  
  const videoId = getVideoId();
  if (!videoId) return;
  
  // Remove existing popup if any
  const existingPopup = document.getElementById('youtube-transcript-popup');
  if (existingPopup) existingPopup.remove();
  
  // CSS is imported from content.css
  
  // Create and add popup
  const popup = createPopup();
  document.body.appendChild(popup);
  
  // Setup event listeners
  const closeBtn = document.getElementById('close-popup');
  const retryBtn = document.getElementById('retry-btn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.remove();
    });
  }
  
  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      await loadTranscript(videoId);
    });
  }
  
  // Setup tabs
  setupTabs();
  
  // Load transcript data
  await loadTranscript(videoId);
}

// Load transcript data
async function loadTranscript(videoId: string): Promise<void> {
  try {
    const data = await fetchTranscript(videoId);
    displayTranscriptData(data);
  } catch (error) {
    console.error('Failed to load transcript:', error);
    showError();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}

// Re-initialize when navigating to different videos
let currentVideoId = getVideoId();
const observer = new MutationObserver(() => {
  const newVideoId = getVideoId();
  if (newVideoId && newVideoId !== currentVideoId) {
    currentVideoId = newVideoId;
    initPopup();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
