import { Input } from './ui/input'
import { Button } from "@/components/ui/button"

interface DebateInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  loading: boolean;
  debateStarted: boolean;
  isConnected: boolean;
  debateCompleted: boolean;
  error: string | null;
  messagesCount: number;
  onStartDebate: () => void;
  onResetDebate: () => void;
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
  onStartDebate,
  onResetDebate
}: DebateInputProps) => {
  return (
    <div className="sticky top-0 z-50 bg-white p-4 border-b border-gray-200 shadow-sm w-full m-0">
      <p className="mb-4 mt-0">
        Enter in a topic on your mind, our AI agents will use your scanned articles and videos to give you nothing but the facts.
      </p>
      
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
      
      {/* Status Display */}
      {loading && (
        <div className="mt-2 text-blue-600 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          🤖 AI agents are debating "{prompt}"... 
          {isConnected ? "(Live stream)" : "(Processing)"}
        </div>
      )}
      
      {debateCompleted && (
        <div className="mt-2 text-green-600 text-sm">
          ✅ Debate completed! {messagesCount} exchanges generated.
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">
          ❌ Error: {error}
        </div>
      )}
    </div>
  );
};