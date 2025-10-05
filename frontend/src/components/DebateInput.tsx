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
    <div className="sticky top-0 z-50 bg-white p-4 border-b border-gray-200 shadow-sm w-full m-0">
      <p className="mb-4 mt-0">
        Enter in a topic on your mind, our AI agents will use your scanned articles and videos to give you multiple perspectives on the topic.
      </p>
      
      {/* Debate Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Debate Mode:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="text_only"
              checked={debateMode === "text_only"}
              onChange={(e) => setDebateMode(e.target.value)}
              className="mr-2"
            />
            Text Only
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="both"
              checked={debateMode === "both"}
              onChange={(e) => setDebateMode(e.target.value)}
              className="mr-2"
            />
            Both Text & Sound
          </label>
        </div>
      </div>

      {/* Audio Settings */}
      {debateMode === "both" && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(e) => setIncludeAudio(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Enable Audio</label>
          </div>
          
          {includeAudio && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Voice Settings</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onTestConnection}
                  className="text-xs"
                >
                  🔧 Test Connection
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Pro Voice:</label>
                  <select
                    value={proVoice}
                    onChange={(e) => setProVoice(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
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
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Con Voice:</label>
                  <select
                    value={conVoice}
                    onChange={(e) => setConVoice(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
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
      
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input 
          type="text" 
          placeholder="Whats on your mind?" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && !loading && onStartDebate()}
        />
        <Button 
          type="button" 
          variant="outline"
          onClick={onStartDebate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Debating..." : "Start Debate"}
        </Button>
        {debateStarted && (
          <Button 
            type="button" 
            variant="secondary"
            onClick={onResetDebate}
            disabled={loading}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Audio Controls */}
      {includeAudio && debateStarted && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Audio Controls:</span>
              {audioPlaying && (
                <span className="text-sm text-green-600 flex items-center">
                  🔴 Playing
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={audioPlaying ? onPauseAudio : onResumeAudio}
                disabled={loading}
                className="px-3"
              >
                {audioPlaying ? "⏸️ Pause" : "▶️ Resume"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onStopAudio}
                disabled={loading}
                className="px-3"
              >
                🛑 Stop
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Display */}
      {loading && (
        <div className="mt-2 text-blue-600 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          AI agents are conversing "{prompt}"... 
          {isConnected ? "(Live stream)" : "(Processing)"}
        </div>
      )}
      
      {debateCompleted && (
        <div className="mt-2 text-green-600 text-sm">
          Debate completed! {messagesCount} exchanges generated.
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};