import type { ChatMessage } from '@/types';

/**
 * AWS Lex V2 Service - STUBBED FOR MVP
 * Phase 2 will implement real chatbot integration
 */

export interface LexResponse {
  message: string;
  intent?: string;
  slots?: Record<string, string>;
}

// Send text message to Lex bot
export const sendMessage = async (text: string): Promise<LexResponse> => {
  console.log('[STUB] AWS Lex - Sending message:', text);

  // Phase 2: Send to AWS Lex V2, process response
  // For now, return simple pattern matching

  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

  const lowerText = text.toLowerCase();

  if (lowerText.includes('grocery') || lowerText.includes('food')) {
    return {
      message:
        "I found 2 grocery stores nearby: Metro on Princess Street and FreshCo at Kingston Centre. Would you like directions to one of them?",
      intent: 'FindService',
      slots: { category: 'grocery' },
    };
  }

  if (lowerText.includes('hospital') || lowerText.includes('doctor') || lowerText.includes('health')) {
    return {
      message:
        "The nearest hospital is Kingston General Hospital at 76 Stuart Street. It's open 24/7 and is wheelchair accessible. Would you like me to show it on the map?",
      intent: 'FindService',
      slots: { category: 'healthcare' },
    };
  }

  if (lowerText.includes('bank')) {
    return {
      message:
        "I found 2 banks nearby: RBC Royal Bank on Princess Street and TD Canada Trust on Bath Road. Both are wheelchair accessible. Which one would you prefer?",
      intent: 'FindService',
      slots: { category: 'banking' },
    };
  }

  if (lowerText.includes('pharmacy') || lowerText.includes('drugstore')) {
    return {
      message:
        "Shoppers Drug Mart on Princess Street is the nearest pharmacy. It's open Mon-Sun 8am-10pm and is wheelchair accessible.",
      intent: 'FindService',
      slots: { category: 'pharmacy' },
    };
  }

  return {
    message:
      "I can help you find healthcare facilities, grocery stores, banks, and pharmacies in Kingston. What are you looking for?",
    intent: 'Welcome',
  };
};

// Convert LexResponse to ChatMessage
export const lexResponseToChatMessage = (response: LexResponse): ChatMessage => {
  return {
    id: `bot-${Date.now()}`,
    text: response.message,
    sender: 'bot',
    timestamp: new Date(),
  };
};
