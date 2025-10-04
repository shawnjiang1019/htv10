// Popup script for Chrome extension
console.log('YouTube Transcript AI: Popup loaded');

// Check if we're on a YouTube page
async function checkYouTubePage(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url?.includes('youtube.com') || false;
  } catch (error) {
    console.error('Error checking YouTube page:', error);
    return false;
  }
}

// Update status based on current page
async function updateStatus(): Promise<void> {
  const statusElement = document.getElementById('status');
  if (!statusElement) return;
  
  const isYouTube = await checkYouTubePage();
  
  if (isYouTube) {
    statusElement.className = 'status success';
    statusElement.textContent = '✅ Ready! Go to a YouTube video to see the transcript popup.';
  } else {
    statusElement.className = 'status error';
    statusElement.textContent = '❌ Please navigate to YouTube to use this extension.';
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  updateStatus();
});
