// Popup script for Chrome extension
console.log('YouTube Transcript AI: Popup loaded');

// Check if we're on a YouTube page
async function checkYouTubePage(): Promise<boolean> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url?.includes('youtube.com/watch') || false;
  } catch (error) {
    console.error('Error checking page:', error);
    return false;
  }
}

// Toggle article popup
async function toggleArticlePopup(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      console.error('No active tab found');
      return;
    }

    console.log('Sending toggleArticlePopup message to tab:', tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleArticlePopup' });
    console.log('Toggle response:', response);
  } catch (error) {
    console.error('Error toggling article popup:', error);
  }
}

// Update status based on current page
async function updateStatus(): Promise<void> {
  const statusElement = document.getElementById('status');
  const actionButton = document.getElementById('actionButton');
  
  if (!statusElement) return;
  
  const isYouTube = await checkYouTubePage();

  // Always show the button
  if (actionButton) {
    actionButton.style.display = 'block';
    actionButton.textContent = 'Toggle Article Analysis';
  }
  
  if (isYouTube) {
    statusElement.className = 'status success';
    statusElement.textContent = '✅ YouTube video detected! Popup auto-injected.';
  } else {
    statusElement.className = 'status success';
    statusElement.textContent = '📄 Click below to analyze this page.';
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  updateStatus();
  
  // Add click handler for action button
  const actionButton = document.getElementById('actionButton');
  if (actionButton) {
    actionButton.addEventListener('click', toggleArticlePopup);
  }
  
  // Modal handlers
  document.getElementById('openModalBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('modalOverlay');
    modal?.classList.add('active');
  });

  document.getElementById('closeModal')?.addEventListener('click', () => {
    const modal = document.getElementById('modalOverlay');
    modal?.classList.remove('active');
  });

  // Close modal when clicking outside
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });
});