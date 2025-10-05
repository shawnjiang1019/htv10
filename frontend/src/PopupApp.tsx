import React, { useState, useEffect } from 'react';
import ArticlePopup from './ArticlePopup';
import './popup-styles.css';

const PopupApp: React.FC = () => {
  const [showArticlePopup, setShowArticlePopup] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkCurrentPage();
  }, []);

  const checkCurrentPage = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url || '';
      setCurrentUrl(url);
      setIsYouTube(url.includes('youtube.com/watch'));
    } catch (error) {
      console.error('Error checking page:', error);
    }
  };

  const handleToggleArticlePopup = () => {
    setShowArticlePopup(!showArticlePopup);
  };

  const handleCloseArticlePopup = () => {
    setShowArticlePopup(false);
  };

  if (showArticlePopup) {
    return (
      <ArticlePopup 
        articleUrl={currentUrl} 
        onClose={handleCloseArticlePopup} 
      />
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h1>📝 Content Analysis AI</h1>
      </div>
      
      <div className="content">
        <div className="description">
          Get AI-powered analysis for YouTube videos and articles
        </div>
        
        <button 
          className="action-button"
          onClick={handleToggleArticlePopup}
        >
          Analyze Current Page
        </button>

        <div className="instructions">
          <h3>How to use:</h3>
          <ol>
            <li><strong>YouTube:</strong> Popup appears automatically on video pages</li>
            <li><strong>Articles:</strong> Click button above to analyze</li>
            <li>View summary and alternative perspectives</li>
            <li>Click × to close the popup</li>
          </ol>
        </div>
        
        <div className={`status ${isYouTube ? 'success' : 'success'}`}>
          {isYouTube 
            ? '✅ YouTube video detected!' 
            : '📄 Ready to analyze this page.'}
        </div>

        <button 
          className="action-button"
          onClick={() => setShowModal(true)}
        >
          Open Settings
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settings</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Settings content here...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupApp;
