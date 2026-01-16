import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from '@aws-sdk/client-lex-runtime-v2';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import type { ChatMessage } from '@/types';

export interface LexResponse {
  message: string;
  intent?: string;
  slots?: Record<string, string>;
}

const getRequiredEnv = (
  value: string | undefined,
  name: string,
): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getLexClient = (() => {
  let client: LexRuntimeV2Client | null = null;
  return () => {
    if (!client) {
      const region = getRequiredEnv(
        import.meta.env.VITE_AWS_REGION,
        'VITE_AWS_REGION',
      );
      const identityPoolId = getRequiredEnv(
        import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID,
        'VITE_AWS_COGNITO_IDENTITY_POOL_ID',
      );

      client = new LexRuntimeV2Client({
        region,
        credentials: fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId,
        }),
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
  const botId = getRequiredEnv(
    import.meta.env.VITE_AWS_LEX_BOT_ID,
    'VITE_AWS_LEX_BOT_ID',
  );
  const botAliasId = getRequiredEnv(
    import.meta.env.VITE_AWS_LEX_BOT_ALIAS_ID,
    'VITE_AWS_LEX_BOT_ALIAS_ID',
  );
  const localeId =
    import.meta.env.VITE_AWS_LEX_LOCALE_ID?.trim() || 'en_US';

  const command = new RecognizeTextCommand({
    botId,
    botAliasId,
    localeId,
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
