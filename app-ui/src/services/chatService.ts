
interface ChatMessage {
    text: string;
    sender: 'user' | 'bot';
  }

const API_BASE_URL = "https://bb5d-54-203-17-143.ngrok-free.app/api";


interface MessageRequest {
  prompt: string;
  company: string;
}

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

export const sendMessage = async (messageData: MessageRequest): Promise<ChatMessage> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {  // Update this URL to match your backend endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      text: data.response || 'Sorry, I could not process your request.',
      sender: 'bot'
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
