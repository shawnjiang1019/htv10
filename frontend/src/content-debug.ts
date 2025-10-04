// Debug version of content script
console.log('YouTube Transcript AI: Content script loaded - DEBUG VERSION');

// Simple test to see if script is running
function testScript() {
  console.log('YouTube Transcript AI: Script is running on:', window.location.href);
  
  // Check if we're on YouTube
  if (window.location.hostname === 'www.youtube.com') {
    console.log('YouTube Transcript AI: On YouTube domain');
    
    // Check if it's a video page
    if (window.location.pathname.startsWith('/watch')) {
      console.log('YouTube Transcript AI: On video page');
      
      // Extract video ID
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');
      console.log('YouTube Transcript AI: Video ID:', videoId);
      
      // Create a simple test popup
      const testPopup = document.createElement('div');
      testPopup.id = 'youtube-transcript-test';
      testPopup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        height: 200px;
        background: #ff0000;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
      `;
      testPopup.innerHTML = `
        <h3>🎉 Extension Working!</h3>
        <p>Video ID: ${videoId}</p>
        <p>Content script is running!</p>
        <button onclick="this.parentElement.remove()" style="background: white; color: #ff0000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
      `;
      
      document.body.appendChild(testPopup);
      console.log('YouTube Transcript AI: Test popup created');
      
    } else {
      console.log('YouTube Transcript AI: Not on video page, path:', window.location.pathname);
    }
  } else {
    console.log('YouTube Transcript AI: Not on YouTube domain');
  }
}

// Run immediately
testScript();

// Also run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testScript);
}

// Run when page changes (for SPA navigation)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('YouTube Transcript AI: URL changed to:', currentUrl);
    setTimeout(testScript, 1000); // Wait a bit for page to load
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
