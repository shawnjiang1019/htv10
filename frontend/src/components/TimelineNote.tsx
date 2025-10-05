import React from 'react';
import './TimelineNote.css';

interface TimelineNoteProps {
  content: string | null;
}

export const TimelineNote: React.FC<TimelineNoteProps> = ({ content }) => {
  return (
    <div className={`timeline-note ${!content ? 'empty' : ''}`}>
      {content || 'Hover over the timeline to see section details'}
    </div>
  );
};