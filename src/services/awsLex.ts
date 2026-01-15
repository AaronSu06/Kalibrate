import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from '@aws-sdk/client-lex-runtime-v2';
import type { ChatMessage } from '@/types';
import {
  getAwsCredentials,
  getAwsRegion,
  getLexLocaleId,
} from '@/services/awsConfig';

export interface LexResponse {
  message: string;
  intent?: string;
  slots?: Record<string, string>;
}

const getLexClient = (() => {
  let client: LexRuntimeV2Client | null = null;
  return () => {
    if (!client) {
      client = new LexRuntimeV2Client({
        region: getAwsRegion(),
        credentials: getAwsCredentials(),
      });
    }
    return client;
  };
})();

const getSessionId = (() => {
  let sessionId: string | null = null;
  return () => {
    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `session-${Date.now()}`;
    }
    return sessionId;
  };
})();

const extractSlots = (
  slots:
    | Record<string, { value?: { interpretedValue?: string } } | null>
    | null
    | undefined,
): Record<string, string> | undefined => {
  if (!slots) return undefined;
  const mapped: Record<string, string> = {};
  Object.entries(slots).forEach(([key, value]) => {
    const interpreted = value?.value?.interpretedValue;
    if (interpreted) {
      mapped[key] = interpreted;
    }
  });
  return Object.keys(mapped).length ? mapped : undefined;
};

// Send text message to Lex bot
export const sendMessage = async (text: string): Promise<LexResponse> => {
  const botId = import.meta.env.VITE_AWS_LEX_BOT_ID;
  const botAliasId = import.meta.env.VITE_AWS_LEX_BOT_ALIAS_ID;

  if (!botId || !botAliasId) {
    throw new Error(
      'Missing VITE_AWS_LEX_BOT_ID or VITE_AWS_LEX_BOT_ALIAS_ID',
    );
  }

  const command = new RecognizeTextCommand({
    botId,
    botAliasId,
    localeId: getLexLocaleId(),
    sessionId: getSessionId(),
    text,
  });

  const response = await getLexClient().send(command);
  const message =
    response.messages
      ?.map(item => item.content)
      .filter((content): content is string => !!content)
      .join(' ') ||
    response.inputTranscript ||
    "I'm not sure how to respond to that yet.";

  return {
    message,
    intent: response.interpretations?.[0]?.intent?.name,
    slots: extractSlots(response.sessionState?.intent?.slots),
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
