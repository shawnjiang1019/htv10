import { createRoot, type Root } from 'react-dom/client';
import ArticlePopup from './ArticlePopup';
import styles from './transcript-popup.css?inline';

// Inject CSS into the page
function injectStyles() {
  if (document.getElementById('article-ai-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'article-ai-styles';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

let currentRoot: Root | null = null;
let isPopupVisible = false;

function togglePopup() {
  console.log('togglePopup called, isPopupVisible:', isPopupVisible);
  
  // If popup is visible, hide it
  if (isPopupVisible) {
    const existingContainer = document.getElementById("article-ai-container");
    if (existingContainer) {
      console.log('Removing existing popup');
      currentRoot?.unmount();
      currentRoot = null;
      existingContainer.remove();
      isPopupVisible = false;
    }
    return;
  }

  // Otherwise, show the popup
  console.log('Showing article popup');
  injectPopup();
}

async function injectPopup() {
  // Inject styles first
  injectStyles();

  const articleUrl = window.location.href;
  console.log('Injecting ArticlePopup for URL:', articleUrl);

  // Clean up existing container
  const existingContainer = document.getElementById("article-ai-container");
  if (existingContainer) {
    currentRoot?.unmount();
    currentRoot = null;
    existingContainer.remove();
  }

  const container = document.createElement("div");
  container.id = "article-ai-container";
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;

  const handleClose = () => {
    console.log('Closing article popup');
    currentRoot?.unmount();
    currentRoot = null;
    container.remove();
    isPopupVisible = false;
  };

  // Append to body
  document.body.appendChild(container);

  currentRoot = createRoot(container);
  isPopupVisible = true;
  
  console.log('Rendering ArticlePopup component');
  
  // Render article popup
  currentRoot.render(
    <ArticlePopup 
      articleUrl={articleUrl} 
      onClose={handleClose} 
    />
  );
}

// Listen for messages from popup/background script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Article content script received message:', request);
  
  if (request.action === 'toggleArticlePopup') {
    try {
      togglePopup();
      sendResponse({ success: true, visible: isPopupVisible });
    } catch (error) {
      console.error('Error toggling popup:', error);
      sendResponse({ success: false, error: String(error) });
    }
    return true; // Keep message channel open for async response
  }
});

// Log that content script is ready
console.log('Article content script loaded and ready on:', window.location.href);