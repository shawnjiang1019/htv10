import { useState, useEffect } from 'react';

interface FlashEvent {
    id: string;
    timestamp: number;
    content: string;
    duration: number;
    url: string;
    factuality_classification: string;
    context_omission: string;
    emotional_language: string;
    emotional_tone: string;
    reasoning_and_sources: string;
}

interface LiveCheckProps {
    events: FlashEvent[];
    currentTime: number;  // current video time in seconds
    loading?: boolean;    // loading state
    isVideoPlaying: boolean; // whether the video is currently playing
}

export default function LiveCheck({ events, currentTime, loading = false, isVideoPlaying = true }: LiveCheckProps) {
    const [activeFlashes, setActiveFlashes] = useState<FlashEvent[]>([]);
    const [flashStartTimes, setFlashStartTimes] = useState<{ [key: string]: number }>({});
    const [elapsedTimes, setElapsedTimes] = useState<{ [key: string]: number }>({});
    
    // Check for events that should be shown based on currentTime
    useEffect(() => {
        const now = currentTime;
        const visibleEvents = events.filter(event => {
            const startTime = event.timestamp;
            const endTime = startTime + (event.duration || 3);
            return now >= startTime && now <= endTime;
        });
        
        // Track when each flash started
        const newFlashStartTimes = { ...flashStartTimes };
        visibleEvents.forEach(event => {
            if (!flashStartTimes[event.id]) {
                newFlashStartTimes[event.id] = Date.now();
            }
        });
        setFlashStartTimes(newFlashStartTimes);
        
        setActiveFlashes(visibleEvents);
    }, [currentTime, events, flashStartTimes]);

    // Update elapsed times for active flashes when video is playing
    useEffect(() => {
        if (!isVideoPlaying) return;

        const interval = setInterval(() => {
            setElapsedTimes(prev => {
                const newElapsedTimes = { ...prev };
                activeFlashes.forEach(flash => {
                    if (flashStartTimes[flash.id]) {
                        newElapsedTimes[flash.id] = (Date.now() - flashStartTimes[flash.id]) / 1000;
                    }
                });
                return newElapsedTimes;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isVideoPlaying, activeFlashes, flashStartTimes]);

    return (
        <div className="livecheck-container">
            <div className="livecheck-header">
                📝 Live Notes
            </div>
            {loading ? (
                <div className="livecheck-loading">
                    <div className="spinner"></div>
                    <p>Loading fact checks...</p>
                </div>
            ) : activeFlashes.length === 0 ? (
                <div className="livecheck-empty">
                    No active notes at this time
                </div>
            ) : (
                <div className="livecheck-flashes">
                    {activeFlashes.map((flash) => {
                        const progress = isVideoPlaying && elapsedTimes[flash.id] 
                            ? (elapsedTimes[flash.id] / flash.duration) * 100 
                            : 0;
                            
                        const getFactualityColor = (classification: string) => {
                            switch (classification) {
                                case 'correct': return '#22c55e';
                                case 'mostly correct': return '#84cc16';
                                case 'somewhat correct': return '#eab308';
                                case 'mostly incorrect': return '#f97316';
                                case 'incorrect': return '#ef4444';
                                case 'misleading': return '#f43f5e';
                                default: return '#6b7280';
                            }
                        };

                        return (
                            <div 
                                key={flash.id}
                                className={`livecheck-flash ${flash.factuality_classification}`}
                                style={{
                                    borderLeftColor: getFactualityColor(flash.factuality_classification),
                                    opacity: Math.max(0, 1 - (elapsedTimes[flash.id] || 0) / flash.duration),
                                    transition: isVideoPlaying ? 'none' : 'opacity 0.3s ease'
                                }}
                            >
                                <div className="livecheck-progress-bar" style={{ width: `${progress}%` }} />
                                <div className="livecheck-flash-content">
                                    <div className="livecheck-header">
                                        <span className="factuality-badge" style={{ 
                                            backgroundColor: getFactualityColor(flash.factuality_classification),
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {flash.factuality_classification.toUpperCase()}
                                        </span>
                                        {flash.context_omission !== 'none' && (
                                            <span className="context-badge">
                                                {flash.context_omission.toUpperCase()} CONTEXT MISSING
                                            </span>
                                        )}
                                    </div>
                                    <div className="fact-section">
                                        <p className="fact-content">{flash.content}</p>
                                        {flash.reasoning_and_sources && (
                                            <div className="fact-reasoning">
                                                <strong className="reasoning-label">Why? </strong>
                                                <p className="reasoning-text">{flash.reasoning_and_sources}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="livecheck-meta">
                                    <a 
                                        href={flash.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="source-link"
                                    >
                                        Learn More →
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}