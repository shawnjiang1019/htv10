import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Debate: {prompt}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{messages.length} exchanges</Badge>
              {isConnected && loading && (
                <Badge variant="secondary" className="text-xs">
                  🔴 Live
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Click "Start Debate" to begin.
            </div>
          )}
          
          {messages.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.speaker === 'pro' ? 'justify-end' : 'justify-start'
                  } animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.speaker === 'pro'
                        ? 'bg-green-100 text-green-900 border border-green-200'
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={message.speaker === 'pro' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {message.speaker === 'pro' ? '✅ PRO' : '❌ CON'}
                      </Badge>
                      {message.round && (
                        <span className="text-xs text-gray-500">
                          Round {message.round}
                        </span>
                      )}
                      {message.timestamp && (
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loading && messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
              Waiting for AI agents to start debating...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};