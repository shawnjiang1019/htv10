import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"

interface DebateMessage {
  speaker: 'pro' | 'con';
  message: string;
  timestamp?: string;
  round?: number;
}

interface MessageDisplayProps {
  prompt: string;
  messages: DebateMessage[];
  loading: boolean;
  isConnected: boolean;
  debateStarted: boolean;
}

export const MessageDisplay = ({
  prompt,
  messages,
  loading,
  isConnected,
  debateStarted
}: MessageDisplayProps) => {
  console.log('MessageDisplay render - messages count:', messages.length, 'messages:', messages);
  
  if (!debateStarted) {
    return null;
  }

  return (
    <div className="debate-display-container">
      <div className="debate-messages-card">
        <div className="debate-messages-header">
          <div className="debate-title">
            <h3>🗣️ AI Debate: {prompt}</h3>
          </div>
          <div className="debate-stats">
            <div className="debate-badge">
              {messages.length} exchanges
            </div>
            {isConnected && loading && (
              <div className="live-badge">
                Live
              </div>
            )}
          </div>
        </div>
        
        <div className="debate-messages-content">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              No messages yet. Click "Start Debate" to begin.
            </div>
          )}
          
          {messages.length > 0 && (
            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-wrapper ${
                    message.speaker === 'pro' ? 'message-pro' : 'message-con'
                  }`}
                >
                  <div className={`message-bubble ${
                    message.speaker === 'pro'
                      ? 'message-bubble-pro'
                      : 'message-bubble-con'
                  }`}>
                    <div className="message-header">
                      <div className={`speaker-badge ${
                        message.speaker === 'pro' ? 'speaker-pro' : 'speaker-con'
                      }`}>
                        {message.speaker === 'pro' ? '✅ PRO' : '❌ CON'}
                      </div>
                      {message.round && (
                        <span className="round-indicator">
                          Round {message.round}
                        </span>
                      )}
                      {message.timestamp && (
                        <span className="timestamp">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="message-text">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loading && messages.length === 0 && (
            <div className="loading-state">
              <div className="loading-spinner-large"></div>
              Waiting for AI agents to start debating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};