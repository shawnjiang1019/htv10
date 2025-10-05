import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


interface Message {
  id: string;
  content: string;
  sender: 'agent1' | 'agent2';
}



const debate = () => {
    const [messages] = useState<Message[]>([]);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);




    return (
        <div className="max-w-4xl mx-auto h-screen flex flex-col p-4">
            <Card className="flex-1 flex flex-col">
                {/* Header */}
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">AI Debate</h3>
                        <Badge variant="outline">{messages.length} messages</Badge>
                    </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    <p>No messages yet</p>
                                </div>
                            )}
                            
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${
                                        message.sender === 'agent1' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {message.sender === 'agent2' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-red-100 text-red-600">
                                                A2
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${
                                            message.sender === 'agent1'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-red-100 text-red-900'
                                        }`}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                    </div>

                                    {message.sender === 'agent1' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                                A1
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

    );

}

export default debate;