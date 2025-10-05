import { useState, useCallback } from 'react'
import { DebateInput } from './DebateInput'
import { MessageDisplay } from './MessageDisplay'


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
        debateMode={debateMode}
        setDebateMode={setDebateMode}
        includeAudio={includeAudio}
        setIncludeAudio={setIncludeAudio}
        proVoice={proVoice}
        setProVoice={setProVoice}
        conVoice={conVoice}
        setConVoice={setConVoice}
        audioPlaying={audioPlaying}
        onStartDebate={startDebateWithStreaming}
        onResetDebate={resetDebate}
        onStopAudio={stopAudio}
        onPauseAudio={pauseAudio}
        onResumeAudio={resumeAudio}
        onTestConnection={testConnection}
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
