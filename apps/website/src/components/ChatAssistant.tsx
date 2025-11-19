import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, Bot, User } from 'lucide-react';
import { PsychologyChatbot } from '../utils/PsychologyChatbot';
import { trackHalaxyHandoff, intentScorer } from '../utils/analytics';
import { getEnvVar } from '../utils/env';

// Extend window interface for halaxyBookingTracker
declare global {
  interface Window {
    halaxyBookingTracker?: {
      handleBookingClick: (
        eventOrButton?:
          | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
          | HTMLButtonElement
          | Event,
        customUrl?: string
      ) => void;
    };
  }
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you learn more about Life Psychology Australia's services. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize AI chatbot (you'll need to add your OpenAI API key)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const chatbot = new PsychologyChatbot(apiKey);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await chatbot.getResponse(inputValue);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble responding right now. Please contact us at info@lifepsychology.com.au for assistance.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBookingLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const intentScore = intentScorer.getScore();
    trackHalaxyHandoff({
      psychologist: 'zoe_semmler',
      source: 'chatbot',
      intent_score: intentScore,
    });
    // Use the halaxyTracker for proper conversion tracking with delay
    if (window.halaxyBookingTracker) {
      window.halaxyBookingTracker.handleBookingClick(e);
    } else {
      console.warn(
        '[ChatAssistant] halaxyBookingTracker not available on window'
      );
    }
  };

  const renderMessage = (message: Message) => {
    // Convert Halaxy booking URLs to clickable links with tracking
    const halaxyUrl = getEnvVar('VITE_BOOKING_URL') || '#';
    if (message.text.includes(halaxyUrl)) {
      const parts = message.text.split(halaxyUrl);
      return (
        <div>
          {parts[0]}
          <a
            href={halaxyUrl}
            rel="noopener noreferrer"
            onClick={handleBookingLinkClick}
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            Book your session with Zoe now
          </a>
          {parts[1]}
        </div>
      );
    }
    return <div>{message.text}</div>;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open chat assistant"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 sm:w-96 h-[33.6rem] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span className="font-semibold">Life Psychology Assistant</span>
          </div>
          <button
            onClick={onToggle}
            className="hover:bg-blue-700 p-1 rounded transition-colors duration-200"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender === 'bot' ? (
                    <Bot size={14} className="text-blue-600" />
                  ) : (
                    <User size={14} className="text-white" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.sender === 'bot' ? 'Assistant' : 'You'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {renderMessage(message)}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-blue-600" />
                  <span className="text-xs opacity-75">Assistant</span>
                </div>
                <div className="flex space-x-1 mt-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
