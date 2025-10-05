import { useState, useCallback } from 'react'
import './debate-styles.css'

interface DebateMessage {
  speaker: 'pro' | 'con';
  message: string;
  timestamp?: string;
  round?: number;
}

interface StreamMessage {
  type: 'message' | 'complete' | 'error' | 'start';
  speaker?: 'pro' | 'con';
  message?: string;
  round?: number;
  timestamp?: string;
  claim?: string;
  total_exchanges?: number;
  show_text?: boolean;
  play_audio?: boolean;
  conversation_history?: Array<{
    speaker: string;
    response: string;
    round: number;
    show_text?: boolean;
    play_audio?: boolean;
  }>;
}

export const DebateContainer = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debateCompleted, setDebateCompleted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [debateMode, setDebateMode] = useState<string>("both");
  const [includeAudio, setIncludeAudio] = useState<boolean>(false);
  const [proVoice, setProVoice] = useState<string>("Rachel");
  const [conVoice, setConVoice] = useState<string>("Adam");
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);

  // Audio control functions
  const stopAudio = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/debate/audio/stop', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        setAudioPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const pauseAudio = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/debate/audio/pause', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        setAudioPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resumeAudio = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/debate/audio/resume', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        setAudioPlaying(true);
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/debate/audio/test-connection');
      const result = await response.json();
      if (result.success) {
        alert('✅ ElevenLabs connection successful!');
      } else {
        alert('❌ ElevenLabs connection failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('❌ Error testing connection: ' + error);
    }
  };

  // Stream message handler
  const handleStreamMessage = useCallback((data: StreamMessage) => {
    console.log('Received stream message:', data);

    switch (data.type) {
        case 'start':
        console.log('Debate started for:', data.claim);
        setIsConnected(true);
        break;

        case 'message':
        console.log('Processing message:', data);
        if (data.speaker && data.message) {
            const newMessage: DebateMessage = {
            speaker: data.speaker,
            message: data.message,
            round: data.round,
            timestamp: data.timestamp || new Date().toISOString()
            };
           
            console.log('Adding message to state:', newMessage);
            setMessages(prev => [...prev, newMessage]);
        } else {
            console.warn('Missing speaker or message in stream data:', data);
        }
        break;

        case 'complete':
        console.log('Debate completed!', data);
        setLoading(false);
        setDebateCompleted(true);
        setIsConnected(false);
       
        // Process the conversation_history from the complete message
        if (data.conversation_history && Array.isArray(data.conversation_history)) {
            const formattedMessages: DebateMessage[] = data.conversation_history.map((entry: any) => ({
            speaker: entry.speaker === 'Proponent' ? 'pro' : 'con', // Map speaker names
            message: entry.response, // Use 'response' field instead of 'message'
            round: entry.round,
            timestamp: new Date().toISOString() // Add timestamp if not present
            }));
           
            console.log('Setting messages from conversation_history:', formattedMessages);
            setMessages(formattedMessages);
        }
        break;

        case 'error':
        console.error('Stream error:', data.message);
        setError(data.message || 'An error occurred');
        setLoading(false);
        setIsConnected(false);
        break;
    }
    }, []);

  // Parse Server-Sent Events data
  const parseSSEData = (data: string): StreamMessage | null => {
    try {
      // Remove "data: " prefix and parse JSON
      const jsonData = data.replace(/^data: /, '').trim();
      if (jsonData) {
        return JSON.parse(jsonData);
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error);
    }
    return null;
  };

  const startDebateWithStreaming = async () => {
    if (!prompt || prompt.trim() === "") {
      alert("Please enter a topic first!");
      return;
    }

    setLoading(true);
    setError(null);
    setDebateStarted(true);
    setDebateCompleted(false);
    setMessages([]);

    try {
      console.log('Starting streaming debate for:', prompt);
     
      const response = await fetch('http://127.0.0.1:8000/debate/run-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim: prompt,
          max_rounds: 4,
          include_audio: includeAudio,
          pro_voice: proVoice,
          con_voice: conVoice,
          debate_mode: debateMode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
         
          if (done) {
            console.log('Stream completed');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
         
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              const message = parseSSEData(line);
              if (message) {
                handleStreamMessage(message);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error("Error with streaming debate:", error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setLoading(false);
      setIsConnected(false);
    }
  };

  const resetDebate = () => {
    setMessages([]);
    setDebateStarted(false);
    setDebateCompleted(false);
    setError(null);
    setPrompt("");
    setLoading(false);
    setIsConnected(false);
  };

  return (
    <div className="debate-page">
      {/* Header Section */}
      <div className="debate-page-header">
        <h2>🗣️ AI Debate System</h2>
      </div>

      {/* Controls Section */}
      <div className="debate-controls-section">
        {/* Input Row */}
        <div className="input-row">
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && onStartDebate()}
            className="debate-main-input"
          />
          <button 
            onClick={startDebateWithStreaming}
            disabled={loading || !prompt.trim()}
            className="start-debate-btn"
          >
            {loading ? "Debating..." : "Start Debate"}
          </button>
          {debateStarted && (
            <button 
              onClick={resetDebate}
              disabled={loading}
              className="reset-debate-btn"
            >
              Reset
            </button>
          )}
        </div>

        {/* Settings Row */}
        <div className="settings-row">
          {/* Debate Mode */}
          <div className="setting-group">
            <label className="setting-label">Debate Mode:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  value="text_only"
                  checked={debateMode === "text_only"}
                  onChange={(e) => setDebateMode(e.target.value)}
                  className="radio-input"
                />
                <span className="radio-label">Text Only</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="both"
                  checked={debateMode === "both"}
                  onChange={(e) => setDebateMode(e.target.value)}
                  className="radio-input"
                />
                <span className="radio-label">Text & Audio</span>
              </label>
            </div>
          </div>

          {/* Audio Settings */}
          {debateMode === "both" && (
            <div className="setting-group">
              <label className="setting-label">Audio:</label>
              <div className="audio-controls-compact">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">Enable Audio</span>
                </label>
                
                {includeAudio && (
                  <div className="voice-controls-compact">
                    <div className="voice-selector-compact">
                      <select
                        value={proVoice}
                        onChange={(e) => setProVoice(e.target.value)}
                        className="voice-select-compact"
                      >
                        <option value="Rachel">Rachel (F)</option>
                        <option value="Adam">Adam (M)</option>
                        <option value="Bella">Bella (F)</option>
                        <option value="Josh">Josh (M)</option>
                      </select>
                      <span className="voice-label-compact">Pro</span>
                    </div>
                    <div className="voice-selector-compact">
                      <select
                        value={conVoice}
                        onChange={(e) => setConVoice(e.target.value)}
                        className="voice-select-compact"
                      >
                        <option value="Adam">Adam (M)</option>
                        <option value="Rachel">Rachel (F)</option>
                        <option value="Josh">Josh (M)</option>
                        <option value="Bella">Bella (F)</option>
                      </select>
                      <span className="voice-label-compact">Con</span>
                    </div>
                    <button
                      onClick={testConnection}
                      className="test-connection-btn"
                    >
                      🔧 Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Row */}
        {(loading || debateCompleted || error) && (
          <div className="status-row">
            {loading && (
              <div className="status-loading">
                <div className="loading-spinner-small"></div>
                AI agents are conversing "{prompt}"... 
                {isConnected ? "(Live stream)" : "(Processing)"}
              </div>
            )}
            
            {debateCompleted && (
              <div className="status-completed">
                Debate completed! {messages.length} exchanges generated.
              </div>
            )}
            
            {error && (
              <div className="status-error">
                Error: {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Section */}
      {debateStarted && (
        <div className="debate-messages-section">
          <div className="messages-header">
            <h3>🗣️ AI Debate: {prompt}</h3>
            <div className="messages-stats">
              <span className="messages-count">{messages.length} exchanges</span>
              {isConnected && loading && <span className="live-indicator">Live</span>}
            </div>
          </div>
          
          <div className="messages-container">
            {messages.length === 0 && !loading && (
              <div className="empty-messages">
                No messages yet. Click "Start Debate" to begin.
              </div>
            )}
            
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
                    <span className={`speaker-badge ${
                      message.speaker === 'pro' ? 'speaker-pro' : 'speaker-con'
                    }`}>
                      {message.speaker === 'pro' ? '✅ PRO' : '❌ CON'}
                    </span>
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
            
            {loading && messages.length === 0 && (
              <div className="loading-messages">
                <div className="loading-spinner-large"></div>
                Waiting for AI agents to start debating...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Controls Section */}
      {includeAudio && debateStarted && (
        <div className="audio-controls-section">
          <div className="audio-controls-header">
            <span className="audio-title">Audio Controls</span>
            {audioPlaying && <span className="audio-status">🔴 Playing</span>}
          </div>
          <div className="audio-controls-buttons">
            <button
              onClick={audioPlaying ? pauseAudio : resumeAudio}
              disabled={loading}
              className="audio-control-btn"
            >
              {audioPlaying ? "⏸️ Pause" : "▶️ Resume"}
            </button>
            <button
              onClick={stopAudio}
              disabled={loading}
              className="audio-control-btn"
            >
              🛑 Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};