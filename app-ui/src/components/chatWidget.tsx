import React, { useState } from 'react';
import styled from 'styled-components';
import { sendMessage } from '../services/chatService';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

const ChatWidgetContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 30%;
  height: 100%;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px 0 0 10px;
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', sans-serif;
`;

const Header = styled.div`
  background-color: #3f51b5;
  color: #fff;
  padding: 10px;
  border-top-left-radius: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
`;

const HeaderIcon = styled.span`
  margin-right: 10px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div`
  background-color: ${({ isBotMessage }) => (isBotMessage ? '#4169e1' : '#90ee90')};
  color: ${({ isBotMessage }) => (isBotMessage ? '#fff' : '#000')};
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  max-width: 70%;
  align-self: ${({ isBotMessage }) => (isBotMessage ? 'flex-start' : 'flex-end')};
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #e0e0e0;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #f1f1f1;
  outline: none;
`;

const SendButton = styled.button`
  background-color: #3f51b5;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #283593;
  }
`;

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, sender: 'user' }]);
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
    <ChatWidgetContainer>
      <Header>
        <HeaderIcon>💬</HeaderIcon>
        Chat
      </Header>
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} isBotMessage={message.sender === 'bot'}>
            {message.text}
          </Message>
        ))}
      </MessagesContainer>
      <InputContainer>
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <SendButton onClick={handleSendMessage}>Send</SendButton>
      </InputContainer>
    </ChatWidgetContainer>
  );
};

export default ChatWidget;