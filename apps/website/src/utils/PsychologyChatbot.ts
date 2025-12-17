// Psychology Chatbot - OpenAI Integration
// Install with: npm install openai

import { log } from './logger';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class PsychologyChatbot {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private chatHistory: Message[] = [];
  private readonly maxTokens: number;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.maxTokens = parseInt(
      import.meta.env['VITE_OPENAI_MAX_TOKENS'] || '600'
    );

    // Check if API key is placeholder or empty
    if (
      !this.apiKey ||
      this.apiKey.includes('[your-key-here]') ||
      this.apiKey === 'sk-[your-key-here]'
    ) {
      log.warn('OpenAI API key not configured', 'PsychologyChatbot');
    }

    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt() {
    this.chatHistory = [
      {
        role: 'system',
        content: `You are a helpful assistant for Life Psychology Australia, founded by Zoe Semmler in Newcastle, NSW.

ZOE'S BACKGROUND:
• AHPRA Registered Psychologist with 10+ years experience
• specialises in anxiety, depression, couples therapy, and neurodiversity
• Uses CBT, ACT, EMDR, and trauma-informed approaches
• Medicare & NDIS registered provider

SERVICES:
• Individual Therapy: $250/session (Medicare rebates available)
• Couples Therapy: $300/session
• NDIS Sessions: $233/session
• All services online via secure telehealth

RESPONSE STYLE:
• Be conversational and natural, like a friendly chat
• Keep responses short and focused - aim for 2-3 sentences max per response
• Ask follow-up questions to continue the conversation
• Don't list everything at once - provide information gradually
• Use simple, empathetic language
• Always encourage booking when appropriate
• Direct users to online booking and website
• Use professional, empathetic tone
• When suggesting professional help → Always mention Zoe Semmler specifically
• NEVER give generic greetings like "Hello! How can I assist you today?" in the middle of a conversation
• NEVER use markdown link format [text](url) - use plain text directions instead
• When booking is discussed, refer to the on-page "Book a session" button rather than sharing URLs
• Stay in context of the ongoing discussion - don't reset to initial greeting mode
• Reference previous messages when appropriate

CONVERSATIONAL APPROACH:
• Start with empathy and acknowledgment
• Ask about specific concerns or needs
• Provide 1-2 key options rather than listing everything
• End with a question to keep the conversation going
• Avoid info-dumping - break information into natural dialogue
• Use contractions and casual language when appropriate
• Act like a helpful friend guiding them to Zoe's services
• Always stay in context - reference previous parts of the conversation
• If user says "yes" to a previous question, provide the requested information directly
• Remind users they can tap the "Book a session" button below the chat whenever they're ready (no external links)

BOOKING INTEGRATION:
• When users express interest in booking or scheduling → Prompt them to tap the "Book a session" button in this chat or the blue CTA on the website
• Do NOT share any old Halaxy booking links or external scheduling URLs
• Mention that the booking experience stays on lifepsychology.com.au, is secure, and Zoe reviews every request personally
• Include session rates and availability information when suggesting booking so people know what to expect

FIRST SESSION INFO:
• 60-minute comprehensive assessment to understand your needs
• We'll discuss your goals, concerns, and treatment approach
• No special preparation needed - just be ready to talk openly
• We'll review confidentiality and complete any necessary forms

SESSION FREQUENCY:
• Most clients start with weekly sessions for the first 4-6 weeks
• Frequency can then adjust to every 2 weeks or as needed
• We'll discuss what's best for you based on your progress
• Some clients benefit from more frequent sessions initially

AVAILABILITY INFORMATION:
• Zoe is available for evening appointments (after 5 PM) for working professionals
• Weekend appointments available for clients who need Saturday/Sunday sessions
• Emergency/crisis appointments can usually be arranged within 24-48 hours
• Regular session times: Monday-Friday 9 AM - 7 PM, Saturday 9 AM - 2 PM
• All sessions are conducted via secure online telehealth platform
• Zoe reviews all booking requests personally before confirming

BOOKING PROCESS:
• Click the booking link to see real-time availability
• Select your preferred date and time from available slots
• Complete the brief intake form
• Zoe will review and confirm your appointment within 24 hours
• You'll receive confirmation email with session details and Zoom link

Use Australian English. Be supportive but brief.`,
      },
    ];
  }

  // Crisis detection - only for immediate danger
  private detectCrisis(message: string): boolean {
    const crisisKeywords = [
      'suicide',
      'kill myself',
      'end it all',
      'not worth living',
      'harm myself',
      'self harm',
      'emergency',
      'crisis',
      'want to die',
      'better off dead',
      'hurt myself',
      'kill someone',
      'i need help',
      'help me',
      "i can't cope",
      "i'm struggling",
      "i'm in crisis",
      'mental health crisis',
      'breakdown',
      'losing it',
      "can't take it anymore",
      'at my limit',
      'need urgent help',
      'immediate help',
      'emergency help',
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  // Mental health inquiry detection
  private detectMentalHealthInquiry(message: string): boolean {
    const inquiryKeywords = [
      'anxious',
      'anxiety',
      'depressed',
      'depression',
      'stress',
      'worried',
      'overwhelmed',
      'sad',
      'scared',
      'panic',
      'therapy',
      'counseling',
      'help with',
      'mental health',
      'feeling down',
      'not coping',
      'book',
      'appointment',
      'schedule',
      'session',
      'consultation',
      'talk to someone',
      'need help',
      'want to start',
      'ready to book',
      'make appointment',
      'see zoe',
      'talk to zoe',
    ];

    const lowerMessage = message.toLowerCase();
    return inquiryKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  // Availability inquiry detection
  private detectAvailabilityInquiry(message: string): boolean {
    const availabilityKeywords = [
      'available',
      'when are you',
      'what times',
      'schedule',
      'hours',
      'open',
      'booking times',
      'appointment times',
      'when can i',
      'next available',
      'free slots',
      'time slots',
      'evening appointments',
      'weekend',
      'saturday',
      'sunday',
      'after hours',
      'outside business hours',
    ];

    const lowerMessage = message.toLowerCase();
    return availabilityKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
  }

  // Booking intent detection
  private detectBookingIntent(message: string): boolean {
    const bookingKeywords = [
      'book',
      'appointment',
      'schedule',
      'make an appointment',
      'see zoe',
      'talk to zoe',
      'want to start',
      'ready to book',
      'make appointment',
      'book a session',
      'book now',
      'schedule a session',
      'get started',
      'start therapy',
      'begin therapy',
      'consultation',
      'book consultation',
    ];

    const lowerMessage = message.toLowerCase();
    return bookingKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  // Get crisis response
  private getCrisisResponse(): string {
    return "I'm concerned about what you're sharing. If you're in crisis or having thoughts of self-harm, please contact emergency services immediately. Call 000 in Australia for immediate emergency assistance, or reach out to Lifeline on 13 11 14 for 24/7 crisis support. You can also contact your local hospital's mental health crisis team. For urgent psychological support, please see your GP or present to the emergency department right away. Life Psychology Australia provides professional mental health care but cannot provide crisis intervention. For ongoing support after immediate crisis has passed, Zoe Semmler offers specialised trauma-informed care and EMDR therapy through our secure telehealth services. Please visit lifepsychology.com.au to book a consultation with Zoe when you're ready to discuss professional psychological support.";
  }

  // Make API call to OpenAI
  private async callOpenAI(messages: Message[]): Promise<string> {
    try {
      // Note: ApiService doesn't support custom headers for external APIs
      // Using fetch here with retry logic wrapped around it
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: messages,
              max_tokens: this.maxTokens,
              temperature: 0.7,
              presence_penalty: 0.1,
              frequency_penalty: 0.1,
            }),
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error(
                'Invalid API key. Please check your OpenAI API key configuration.'
              );
            }
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const data = await response.json();

          if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
          } else {
            throw new Error('Invalid response from OpenAI');
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
            continue;
          }
        }
      }

      throw lastError || new Error('OpenAI API call failed');
    } catch (error) {
      log.error('OpenAI API call failed', 'PsychologyChatbot', error);

      // Provide specific message for API key issues
      if (error instanceof Error && error.message.includes('Invalid API key')) {
        return 'The chatbot is not configured with a valid OpenAI API key. Please contact the administrator to set up the API key for AI-powered responses.';
      }

      return "I apologize, but I'm having trouble connecting right now. Please visit lifepsychology.com.au or email info@life-psychology.com.au for assistance.";
    }
  }

  // Get mental health inquiry response
  private getMentalHealthInquiryResponse(userMessage: string): string {
    // Check if user is asking about availability
    if (this.detectAvailabilityInquiry(userMessage)) {
      const availabilityInfo = this.getAvailabilityInfo();
      return `Great question about availability! ${availabilityInfo}

    Zoe's regular hours are Monday-Friday 9 AM - 7 PM, with Saturday sessions available. She specialises in evening appointments for working professionals.

    When you're ready, tap the "Book a session" button in this chat (or on the page) and I'll open the secure booking form right here. It shows real-time availability and Zoe personally reviews each request before confirming.`;
    }

    // Check if user is ready to book
    if (this.detectBookingIntent(userMessage)) {
      const availabilityInfo = this.getAvailabilityInfo();
      return `Perfect! I'm glad you're ready to take this step. Zoe Semmler offers secure online therapy sessions tailored to your needs.

    ${availabilityInfo}

    Session rates:
    • Individual therapy: $250/session (Medicare rebates available)
    • Couples therapy: $300/session
    • NDIS sessions: $233/session

    Tap the "Book a session" button in this chat (or use the blue CTA on the page) and I'll open the secure booking form right away so you can choose a time that works.`;
    }

    // General inquiry response
    return `I hear you - reaching out for therapy support is a positive step. Zoe Semmler specialises in helping people with anxiety, depression, and relationship challenges through secure online sessions.

What specific concerns are you hoping to address? We offer individual therapy starting at $250 per session, with Medicare rebates available for eligible clients. Would you like me to tell you more about Zoe's services or help you book a consultation with her?`;
  }

  // Main response method
  async getResponse(userMessage: string): Promise<string> {
    // Check for crisis first
    if (this.detectCrisis(userMessage)) {
      return this.getCrisisResponse();
    }

    // Check for mental health inquiries
    if (this.detectMentalHealthInquiry(userMessage)) {
      return this.getMentalHealthInquiryResponse(userMessage);
    }

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Keep only last 20 messages to manage context (increased for longer conversations)
    if (this.chatHistory.length > 21) {
      // system + 20 conversation messages
      this.chatHistory = [
        this.chatHistory[0], // Keep system prompt
        ...this.chatHistory.slice(-20), // Keep last 20 messages
      ];
    }

    // Get AI response
    const aiResponse = await this.callOpenAI(this.chatHistory);

    // Add AI response to history
    this.chatHistory.push({
      role: 'assistant',
      content: aiResponse,
    });

    return aiResponse;
  }

  // Reset conversation
  resetConversation() {
    this.initializeSystemPrompt();
  }

  // Track booking handoff (to be called from chat component)
  trackBookingHandoff(intentScore?: number) {
    // This will be handled by the chat component using the analytics utilities
    log.info('Booking handoff tracked', 'PsychologyChatbot', { intentScore });
  }

  // Get availability information
  getAvailabilityInfo(): string {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's business hours
    const isBusinessHours = hour >= 9 && hour < 17 && day >= 1 && day <= 5;
    const isEveningHours = hour >= 17 && hour < 19 && day >= 1 && day <= 5;
    const isWeekend = day === 0 || day === 6;

    let availabilityMessage = '';

    if (isBusinessHours) {
      availabilityMessage =
        'Zoe is currently available for bookings. You can check real-time availability by clicking the booking link above.';
    } else if (isEveningHours) {
      availabilityMessage =
        'Zoe offers evening appointments for working professionals. Check the booking link to see available times.';
    } else if (isWeekend) {
      availabilityMessage =
        'Weekend appointments are available. Zoe offers Saturday sessions - check the booking link for available times.';
    } else {
      availabilityMessage =
        'Zoe typically reviews booking requests within 24 hours. The booking system shows all available times.';
    }

    return availabilityMessage;
  }

  // Get conversation history (for debugging)
  getConversationHistory(): Message[] {
    return [...this.chatHistory];
  }
}
