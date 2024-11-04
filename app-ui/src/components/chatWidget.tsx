import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/chatService';
import {  Send, Minimize2, Maximize2, Bot } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const LoadingDots = () => {
  return (
    <div className="flex space-x-1 animate-pulse">
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
    </div>
  );
};

const ChatWidget: React.FC = () => {
  const { companyName } = useParams<{ companyName: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = { 
        text: newMessage, 
        sender: 'user', 
        timestamp: new Date() 
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setNewMessage('');
      setIsTyping(true);

      try {
        const response = await sendMessage(newMessage);
        setIsTyping(false);
        setMessages(prevMessages => [...prevMessages, {
          ...response,
          timestamp: new Date()
        }]);
      } catch (error) {
        setIsTyping(false);
        setMessages(prevMessages => [...prevMessages, {
          text: "I apologize, but I'm having trouble connecting right now. Please try again.",
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`fixed right-6 transition-all duration-300 ease-in-out ${
      isExpanded ? 'bottom-0 h-[600px] w-[400px]' : 'bottom-0 h-12 w-[400px]'
    }`}>
      {/* Chat Header */}
      <div 
        className="flex items-center justify-between p-3 text-white bg-gray-900 rounded-t-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold">Capital Mind</span>
        </div>
        {isExpanded ? (
          <Minimize2 className="w-4 h-4 text-gray-400 transition-colors hover:text-white" />
        ) : (
          <Maximize2 className="w-4 h-4 text-gray-400 transition-colors hover:text-white" />
        )}
      </div>

      {isExpanded && (
        <>
          {/* Chat Messages */}
          <div className="bg-white h-[calc(100%-110px)] overflow-y-auto p-4 border-l border-r border-gray-200 shadow-inner">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[280px] ${
                    message.sender === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.text}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Bot className="w-4 h-4" />
                <span className="text-sm">Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border border-gray-200 rounded-b-lg shadow-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask about market analysis, trends, or strategies..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 transition-all border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendMessage}
                className="flex items-center justify-center p-2 text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;