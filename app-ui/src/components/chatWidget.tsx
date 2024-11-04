import React, { useState } from 'react';
import { sendMessage } from '../services/chatService';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = { text: newMessage, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setNewMessage('');

      try {
        const response = await sendMessage(newMessage);
        setMessages((prevMessages) => [...prevMessages, response]);
      } catch (error) {
        console.error('Error sending message:', error);
        // Handle error scenario, e.g., display an error message
      }
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-[30%] h-[85.8%] bg-white shadow-md flex flex-col font-roboto"> {/* Adjusted width here */}
      <div className="bg-indigo-700 text-white px-4 py-2 rounded-tl-lg font-bold flex items-center">
        <span className="mr-2">💬</span>
        Chat
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
      </div>
      <div className="px-4 py-2 border-t border-gray-200 flex">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-200 outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="bg-indigo-700 text-white px-4 py-2 rounded-lg ml-2 hover:bg-indigo-800 transition-colors duration-300"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
