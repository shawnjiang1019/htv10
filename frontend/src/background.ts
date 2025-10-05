// Background script for Chrome extension
console.log('YouTube Transcript AI: Background script loaded');

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  console.log('Background sender:', sender);
  
  if (request.action === 'fetchYouTubeSummary') {
    const { videoId } = request;
    console.log('Fetching YouTube summary for video ID:', videoId);
    
    // Make API request from background script
    fetch(`http://127.0.0.1:8000/vid/youtube-summary/${videoId}`)
      .then(response => {
        console.log('Background API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Background API response data:', data);
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('Background API error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  if (request.action === 'fetchFactChecks') {
    const { videoId } = request;
    console.log('Fetching fact checks for video ID:', videoId);
    
    // Make API request from background script
    fetch(`http://127.0.0.1:8000/vid/youtube-transcript/${videoId}`)
      .then(response => {
        console.log('Background fact checks API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Background fact checks API response data:', data);
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('Background fact checks API error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

console.log('Background script message listener set up');
