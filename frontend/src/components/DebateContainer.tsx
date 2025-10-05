import { useState, useCallback } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { DebateInput } from './DebateInput'
import { MessageDisplay } from './MessageDisplay'

interface DebateMessage {
  speaker: 'pro' | 'con';
  message: string;
  timestamp?: string;
  round?: number;
}

interface WebSocketMessage {
  type: 'message' | 'complete' | 'error' | 'start';
  speaker?: 'pro' | 'con';
  message?: string;
  round?: number;
  timestamp?: string;
  claim?: string;
  total_exchanges?: number;
  conversation_history?: Array<{
    speaker: string;
    response: string;
    round: number;
  }>;
}

export const DebateContainer = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debateCompleted, setDebateCompleted] = useState(false);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    console.log('Received WebSocket message:', data);

    switch (data.type) {
        case 'start':
        console.log('Debate started for:', data.claim);
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
        } else {const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
            console.log('Received WebSocket message:', data);

            switch (data.type) {
                case 'start':
                console.log('Debate started for:', data.claim);
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
                    console.warn('Missing speaker or message in WebSocket data:', data);
                }
                break;

                case 'complete':
                console.log('Debate completed!', data);
                setLoading(false);
                setDebateCompleted(true);
                
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
                console.error('WebSocket error:', data.message);
                setError(data.message || 'An error occurred');
                setLoading(false);
                break;
            }
            }, []);
            console.warn('Missing speaker or message in WebSocket data:', data);
        }
        break;

        case 'complete':
        console.log('Debate completed!', data);
        setLoading(false);
        setDebateCompleted(true);
        
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
        console.error('WebSocket error:', data.message);
        setError(data.message || 'An error occurred');
        setLoading(false);
        break;
    }
    }, []);

  // WebSocket error handler
  const handleWebSocketError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    setError('Connection error occurred');
    setLoading(false);
  }, []);

  // WebSocket close handler
  const handleWebSocketClose = useCallback(() => {
    console.log('WebSocket connection closed');
    if (loading) {
      setError('Connection was closed unexpectedly');
      setLoading(false);
    }
  }, [loading]);

  // Initialize WebSocket
  const { isConnected, connect, disconnect, sendMessage } = useWebSocket({
    url: 'ws://127.0.0.1:8080/debate/run-ws',
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    onClose: handleWebSocketClose,
    onOpen: () => console.log('WebSocket connected')
  });

  const startDebateWithWebSocket = async () => {
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
      // Connect to WebSocket and wait for connection
      connect();
      
      // Wait longer for connection to establish and then check connection status
      setTimeout(() => {
        console.log('WebSocket connection status:', isConnected);
        
        // Try to send message or fall back to HTTP
        const sendWebSocketMessage = () => {
          console.log('Sending WebSocket message for:', prompt);
          sendMessage({
            claim: prompt,
            max_rounds: 4,
            include_audio: false,
            pro_voice: "Rachel",
            con_voice: "Adam"
          });
        };

        if (isConnected) {
          sendWebSocketMessage();
        } else {
          // Wait a bit more or fall back to HTTP
          console.log('WebSocket not connected, trying fallback in 1 second');
          setTimeout(() => {
            if (isConnected) {
              sendWebSocketMessage();
            } else {
              console.log('WebSocket still not connected, falling back to HTTP');
              fallbackToHTTP();
            }
          }, 1000);
        }
      }, 500);

    } catch (error) {
      console.error("Error starting WebSocket debate:", error);
      fallbackToHTTP();
    }
  };

  // Fallback to original HTTP method
  const fallbackToHTTP = async () => {
    try {
      console.log("Using HTTP fallback for:", prompt);
      
      const response = await fetch('http://127.0.0.1:8080/debate/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim: prompt,
          max_rounds: 4,
          include_audio: false,
          pro_voice: "Rachel",
          con_voice: "Adam"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMessages(data.conversation_history);
        setDebateCompleted(true);
      } else {
        throw new Error("Debate was not successful");
      }

    } catch (error) {
      console.error("Error with HTTP fallback:", error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetDebate = () => {
    setMessages([]);
    setDebateStarted(false);
    setDebateCompleted(false);
    setError(null);
    setPrompt("");
    setLoading(false);
    disconnect();
  };

  return (
    <div className="m-0 p-0 w-full min-h-screen">
      <DebateInput
        prompt={prompt}
        setPrompt={setPrompt}
        loading={loading}
        debateStarted={debateStarted}
        isConnected={isConnected}
        debateCompleted={debateCompleted}
        error={error}
        messagesCount={messages.length}
        onStartDebate={startDebateWithWebSocket}
        onResetDebate={resetDebate}
      />
      
      <MessageDisplay
        prompt={prompt}
        messages={messages}
        loading={loading}
        isConnected={isConnected}
        debateStarted={debateStarted}
      />
    </div>
  );
};