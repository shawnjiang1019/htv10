import { useState, useEffect } from 'react';

interface FlashEvent {
    id: string;
    timestamp: number;
    content: string;
    duration: number;
    url: string;
}

interface LiveCheckProps {
    events: FlashEvent[];
    currentTime: number;  // current video time in seconds
}

export default function LiveCheck({ events, currentTime }: LiveCheckProps) {
    const [activeFlashes, setActiveFlashes] = useState<FlashEvent[]>([]);
    
    // Check for events that should be shown based on currentTime
    useEffect(() => {
        const now = currentTime;
        const visibleEvents = events.filter(event => {
            const startTime = event.timestamp;
            const endTime = startTime + (event.duration || 3); // Default duration of 3 seconds
            return now >= startTime && now <= endTime;
        });
        
        setActiveFlashes(visibleEvents);
    }, [currentTime, events]);

    return (
        <div className="livecheck-container">
            <div className="livecheck-header">
                📝 Live Notes
            </div>
            {activeFlashes.length === 0 ? (
                <div className="livecheck-empty">
                    No active notes at this time
                </div>
            ) : (
                <div className="livecheck-flashes">
                    {activeFlashes.map((flash) => (
                        <div 
                            key={flash.id}
                            className="livecheck-flash"
                            style={{
                                animation: `flashFade ${flash.duration || 3}s ease-in-out`
                            }}
                        >
                            <div className="livecheck-flash-content">
                                <span style={{ color: 'red', fontWeight: 'bold' }}>FACT CHECK:</span> {flash.content}
                            </div>
                            <div className="livecheck-meta">
                                <a 
                                    href={flash.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#2563eb' }}
                                >
                                    View Source
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}