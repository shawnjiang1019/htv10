import React, { useEffect, useState } from 'react';


interface ArticlePopupProps {
  articleURL: string;
  onClose: () => void;
}


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

export const ArticlePopUp: React.FC<TranscriptPopupProps> = ({articleURL, onClose}) => {
    const [data, setData] = useState<YouTubeSummary | null>(null);

}

