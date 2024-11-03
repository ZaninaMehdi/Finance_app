
interface ChatMessage {
    text: string;
    sender: 'user' | 'bot';
  }

  const API_BASE_URL = "http://127.0.0.1:5000/api";

// Array of pre-defined funny responses
const funnyResponses = [
  "Why did the tomato turn red? Because it saw the salad dressing!",
  "I tried to catch some fog earlier. I mist.",
  "What do you call a fake noodle? An Impasta!",
  "Why don't scientists trust atoms? Because they make up everything!",
  "I'm reading a book about anti-gravity. It's impossible to put down!",
  "I wondered why the baseball always got bigger. Then it hit me.",
  "I'm on a seafood diet. Every time I see food, I eat it.",
  "Why don't skeletons fight each other? They don't have the guts!",
  "What do you call a bear with no teeth? A gummy bear!",
];

export const sendMessage = async (message: string): Promise<ChatMessage> => {
  try {
    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    // Mock the response from Claude AI with a random funny response
    const randomIndex = Math.floor(Math.random() * funnyResponses.length);
    const data: ChatMessage = {
      text: funnyResponses[randomIndex],
      sender: 'bot',
    };

    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};