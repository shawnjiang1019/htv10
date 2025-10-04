// Content script for YouTube transcript extension
import './content.css';

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

  // Extract video ID
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v") || "unknown";

  // Create popup
  const testPopup = document.createElement("div");
  testPopup.id = "youtube-transcript-test";
  testPopup.style.cssText = `
    background: #00ff00;
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  testPopup.innerHTML = `
    <h3>🎉 Extension Working!</h3>
    <p>Video ID: ${videoId}</p>
    <p>Content script is running!</p>
    <button id="yt-transcript-close" style="background: white; color: #ff0000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
      Close
    </button>
  `;

  try {
    const secondary = await waitForElement<HTMLElement>("#secondary");

    // Prevent duplicate injection
    if (!document.getElementById("youtube-transcript-test")) {
      secondary.prepend(testPopup);

      const closeBtn = document.getElementById("yt-transcript-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => testPopup.remove());
      }
    }
  } catch (err) {
    // fallback: inject to body
    if (!document.getElementById("youtube-transcript-test")) {
      document.body.appendChild(testPopup);
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