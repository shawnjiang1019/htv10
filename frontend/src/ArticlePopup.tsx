import React from 'react';


export interface AlternateLink {
  title: string;
  url: string;
  source?: string;
  description?: string;
}

export interface ArticleSummary {
  video_id: string;
  summary: string;
  alternateLinks: AlternateLink[];
}

interface ArticlePopupProps {
  articleURL: string;
  onClose: () => void;
}

export const ArticlePopUp: React.FC<ArticlePopupProps> = ({ articleURL, onClose }) => {
    return (
        <div>
            <h3>Article Analysis</h3>
            <p>URL: {articleURL}</p>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

