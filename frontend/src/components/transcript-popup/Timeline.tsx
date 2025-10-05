import React, { useState, useRef, useEffect } from 'react';
import '../Timeline.css';

interface TimelineEvent {
  content: string;
  start: number;
  end: number;
}

interface TimelineProps {
  events: TimelineEvent[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  duration?: number;
}

export default function Timeline({ events, currentTime, onSeek, duration = 1000 }: TimelineProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const calculateTimeFromMousePosition = (clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(percentage * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = calculateTimeFromMousePosition(e.clientX);
    setHoverTime(time);
    if (isDragging) {
      onSeek(time);
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const time = calculateTimeFromMousePosition(e.clientX);
    onSeek(time);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  return (
    <div 
      className="timeline-container"
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      <div 
        ref={timelineRef}
        className="timeline-track"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      >
        <div className="timeline-bar">
          <div 
            className="timeline-progress" 
            style={{ width: `${(currentTime / duration) * 100}%` }} 
          />
          {hoverTime !== null && (
            <div 
              className="timeline-hover-time"
              style={{ 
                left: `${(hoverTime / duration) * 100}%`,
                opacity: 1 
              }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          {events.map((event, i) => (
            <div
              key={i}
              className={`timeline-marker ${currentTime >= event.start && currentTime <= event.end ? 'active' : ''}`}
              style={{ left: `${(event.start / duration) * 100}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(event.start);
              }}
            >
              <div className="timeline-tooltip">
                {formatTime(event.start)} - {event.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(t: number) {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
