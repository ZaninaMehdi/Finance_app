import React, { useState } from 'react';
import { sendMessage } from '../services/chatService';
import { useParams } from 'react-router-dom';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = { text: newMessage, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setNewMessage('');
      setIsLoading(true);

      try {
        const response = await sendMessage({
          prompt: newMessage.toLowerCase(),
          company: companyName?.toLowerCase() || ''
        });
        setMessages((prevMessages) => [...prevMessages, response]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: 'Sorry, there was an error processing your request.', sender: 'bot' }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-[30%] h-[85.8%] bg-white shadow-md flex flex-col font-roboto">
      <div className="bg-indigo-700 text-white px-4 py-2 rounded-tl-lg font-bold flex items-center">
        <span className="mr-2">💬</span>
        Claudia
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.sender === 'bot' ? 'bg-blue-600 text-white self-start' : 'bg-gray-300 text-black self-end'
            } px-4 py-2 rounded-lg mb-2 max-w-[70%]`}
          >
            {message.text}
          </div>
        ))}
        {isLoading && (
          <div className="bg-blue-600 text-white self-start px-4 py-2 rounded-lg mb-2">
            <LoadingDots />
          </div>
        )}
      </div>
      <div className="px-4 py-2 border-t border-gray-200 flex">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-200 outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          className={`${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800'
          } text-white px-4 py-2 rounded-lg ml-2 transition-colors duration-300`}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;