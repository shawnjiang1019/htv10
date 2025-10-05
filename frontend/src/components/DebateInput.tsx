import { Input } from './ui/input'
import { Button } from "./ui/button"

interface DebateInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  loading: boolean;
  debateStarted: boolean;
  isConnected: boolean;
  debateCompleted: boolean;
  error: string | null;
  messagesCount: number;
  debateMode: string;
  setDebateMode: (mode: string) => void;
  includeAudio: boolean;
  setIncludeAudio: (include: boolean) => void;
  proVoice: string;
  setProVoice: (voice: string) => void;
  conVoice: string;
  setConVoice: (voice: string) => void;
  audioPlaying: boolean;
  onStartDebate: () => void;
  onResetDebate: () => void;
  onStopAudio: () => void;
  onPauseAudio: () => void;
  onResumeAudio: () => void;
  onTestConnection: () => void;
}

export const DebateInput = ({
  prompt,
  setPrompt,
  loading,
  debateStarted,
  isConnected,
  debateCompleted,
  error,
  messagesCount,
  debateMode,
  setDebateMode,
  includeAudio,
  setIncludeAudio,
  proVoice,
  setProVoice,
  conVoice,
  setConVoice,
  audioPlaying,
  onStartDebate,
  onResetDebate,
  onStopAudio,
  onPauseAudio,
  onResumeAudio,
  onTestConnection
}: DebateInputProps) => {
  return (
    <div className="debate-input-container">
      <div className="debate-header">
        <h3>🗣️ AI Debate System</h3>
        <p className="debate-description">
          Enter a topic on your mind, our AI agents will use your scanned articles and videos to give you multiple perspectives on the topic.
        </p>
      </div>
      
      {/* Debate Mode Selection */}
      <div className="debate-mode-section">
        <label className="debate-label">Debate Mode:</label>
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
            <span className="radio-label">Both Text & Sound</span>
          </label>
        </div>
      </div>

      {/* Audio Settings */}
      {debateMode === "both" && (
        <div className="audio-settings">
          <div className="audio-toggle">
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(e) => setIncludeAudio(e.target.checked)}
              className="checkbox-input"
            />
            <label className="checkbox-label">Enable Audio</label>
          </div>
          
          {includeAudio && (
            <div className="voice-settings">
              <div className="voice-header">
                <span className="voice-title">Voice Settings</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onTestConnection}
                  className="test-button"
                >
                  🔧 Test Connection
                </Button>
              </div>
              <div className="voice-grid">
                <div className="voice-selector">
                  <label className="voice-label">Pro Voice:</label>
                  <select
                    value={proVoice}
                    onChange={(e) => setProVoice(e.target.value)}
                    className="voice-select"
                  >
                    <option value="Rachel">Rachel (Female)</option>
                    <option value="Adam">Adam (Male)</option>
                    <option value="Bella">Bella (Female)</option>
                    <option value="Josh">Josh (Male)</option>
                    <option value="Sam">Sam (Male)</option>
                    <option value="Antoni">Antoni (Male)</option>
                    <option value="Arnold">Arnold (Male)</option>
                    <option value="Elli">Elli (Female)</option>
                  </select>
                </div>
                <div className="voice-selector">
                  <label className="voice-label">Con Voice:</label>
                  <select
                    value={conVoice}
                    onChange={(e) => setConVoice(e.target.value)}
                    className="voice-select"
                  >
                    <option value="Adam">Adam (Male)</option>
                    <option value="Rachel">Rachel (Female)</option>
                    <option value="Josh">Josh (Male)</option>
                    <option value="Bella">Bella (Female)</option>
                    <option value="Sam">Sam (Male)</option>
                    <option value="Antoni">Antoni (Male)</option>
                    <option value="Arnold">Arnold (Male)</option>
                    <option value="Elli">Elli (Female)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="input-section">
        <Input 
          type="text" 
          placeholder="What's on your mind?" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && !loading && onStartDebate()}
          className="debate-input"
        />
        <Button 
          type="button" 
          variant="outline"
          onClick={onStartDebate}
          disabled={loading || !prompt.trim()}
          className="start-button"
        >
          {loading ? "Debating..." : "Start Debate"}
        </Button>
        {debateStarted && (
          <Button 
            type="button" 
            variant="secondary"
            onClick={onResetDebate}
            disabled={loading}
            className="reset-button"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Audio Controls */}
      {includeAudio && debateStarted && (
        <div className="audio-controls">
          <div className="audio-controls-header">
            <div className="audio-status">
              <span className="audio-title">Audio Controls:</span>
              {audioPlaying && (
                <span className="audio-indicator">
                  🔴 Playing
                </span>
              )}
            </div>
            <div className="audio-buttons">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={audioPlaying ? onPauseAudio : onResumeAudio}
                disabled={loading}
                className="audio-button"
              >
                {audioPlaying ? "⏸️ Pause" : "▶️ Resume"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onStopAudio}
                disabled={loading}
                className="audio-button"
              >
                🛑 Stop
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Display */}
      {loading && (
        <div className="status-loading">
          <div className="loading-spinner"></div>
          AI agents are conversing "{prompt}"... 
          {isConnected ? "(Live stream)" : "(Processing)"}
        </div>
      )}
      
      {debateCompleted && (
        <div className="status-completed">
          Debate completed! {messagesCount} exchanges generated.
        </div>
      )}
      
      {error && (
        <div className="status-error">
          Error: {error}
        </div>
      )}
    </div>
  );
};