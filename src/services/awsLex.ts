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

  if (lowerText.includes('hospital')) {
    return {
      message:
        "The nearest hospital is Kingston General Hospital at 76 Stuart Street. It's open 24/7. Would you like me to show it on the map?",
      intent: 'FindService',
      slots: { category: 'hospitals' },
    };
  }

  if (lowerText.includes('pharmacy') || lowerText.includes('drugstore') || lowerText.includes('clinic') || lowerText.includes('doctor')) {
    return {
      message:
        "I found several clinics and pharmacies nearby. Would you like me to show them on the map?",
      intent: 'FindService',
      slots: { category: 'clinics' },
    };
  }

  if (lowerText.includes('school') || lowerText.includes('university') || lowerText.includes('college')) {
    return {
      message:
        "I found several education facilities nearby including Queen's University and St. Lawrence College. Would you like me to show them on the map?",
      intent: 'FindService',
      slots: { category: 'education' },
    };
  }

  if (lowerText.includes('bank') || lowerText.includes('atm')) {
    return {
      message:
        "I found several banks and ATMs nearby. Would you like me to show them on the map?",
      intent: 'FindService',
      slots: { category: 'banks' },
    };
  }

  if (lowerText.includes('library') || lowerText.includes('libraries')) {
    return {
      message:
        "I found several libraries nearby including the Kingston Frontenac Library. Would you like me to show them on the map?",
      intent: 'FindService',
      slots: { category: 'libraries' },
    };
  }

  if (lowerText.includes('daycare') || lowerText.includes('childcare') || lowerText.includes('child care')) {
    return {
      message:
        "I found several daycare facilities nearby. Would you like me to show them on the map?",
      intent: 'FindService',
      slots: { category: 'daycare' },
    };
  }

  if (lowerText.includes('park') || lowerText.includes('garden')) {
    return {
      message:
        "I found several parks and gardens nearby. Would you like me to show them on the map?",
      intent: 'FindService',
      slots: { category: 'gardens' },
    };
  }

  return {
    message:
      "I can help you find hospitals, clinics, grocery stores, banks, libraries, daycare, parks, and more in Kingston. What are you looking for?",
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
