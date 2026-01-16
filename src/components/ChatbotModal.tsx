import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ChatbotModalProps, ChatMessage, ChatAction, ServiceLocation } from '@/types';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import * as lexService from '@/services/awsLex';
import * as transcribeService from '@/services/awsTranscribe';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';

const HOURS_INTENT_REGEX = /\b(hours?|open|opening|closing|close|schedule)\b/;

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'of',
  'on',
  'in',
  'at',
  'by',
  'near',
  'around',
  'with',
  'without',
  'from',
  'hours',
  'hour',
  'open',
  'opening',
  'close',
  'closing',
  'when',
  'what',
  'is',
  'are',
  'do',
  'does',
  'tell',
  'me',
  'please',
  'show',
  'give',
  'need',
  'want',
  'looking',
  'find',
  'get',
  'info',
  'information',
  'details',
  'view',
  'map',
  'service',
  'services',
  'center',
  'centre',
  'clinic',
  'hospital',
  'school',
  'office',
  'community',
  'association',
  'inc',
  'ltd',
  'corp',
  'company',
  'co',
  'limited',
  'station',
  'department',
  'church',
  'ministry',
  'temple',
  'mosque',
  'synagogue',
  'bank',
  'library',
  'city',
  'town',
  'kingston',
]);

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenize = (value: string): string[] => {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
};

const isHoursIntent = (value: string): boolean => {
  return HOURS_INTENT_REGEX.test(normalizeText(value));
};

const getActionIntent = (value: string): ChatAction['kind'] | null => {
  const normalized = normalizeText(value);
  if (/\b(show|open|focus|view)\b.*\bmap\b/.test(normalized)) {
    return 'show_on_map';
  }
  if (/\b(details?|detail|info|information)\b/.test(normalized)) {
    return 'show_details';
  }
  return null;
};

const getDetailString = (
  details: ServiceLocation['details'] | undefined,
  key: string,
): string | undefined => {
  if (!details) return undefined;
  const value = details[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
};

const formatDetailValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value) && value.length > 0) {
    return value.map(item => String(item)).join(', ');
  }
  return undefined;
};

type ServiceIndexEntry = {
  service: ServiceLocation;
  normalizedName: string;
  nameTokens: string[];
  addressTokens: string[];
};

const buildServiceIndex = (services: ServiceLocation[]): ServiceIndexEntry[] => {
  return services.map(service => ({
    service,
    normalizedName: normalizeText(service.name),
    nameTokens: tokenize(service.name),
    addressTokens: tokenize(service.address || ''),
  }));
};

const findBestServiceMatch = (
  input: string,
  index: ServiceIndexEntry[],
): ServiceLocation | null => {
  const normalizedInput = normalizeText(input);
  if (!normalizedInput) return null;

  let bestDirect: ServiceIndexEntry | null = null;
  let bestDirectLength = 0;
  index.forEach(entry => {
    if (
      entry.normalizedName &&
      normalizedInput.includes(entry.normalizedName) &&
      entry.normalizedName.length > bestDirectLength
    ) {
      bestDirect = entry;
      bestDirectLength = entry.normalizedName.length;
    }
  });
  if (bestDirect) return bestDirect.service;

  const inputTokens = new Set(tokenize(input));
  if (inputTokens.size === 0) return null;

  let best: ServiceIndexEntry | null = null;
  let bestScore = 0;
  let bestAddressMatches = 0;
  let bestNameLength = 0;

  index.forEach(entry => {
    if (entry.nameTokens.length === 0) return;

    const nameMatches = entry.nameTokens.filter(token => inputTokens.has(token))
      .length;
    if (nameMatches === 0) return;

    const strongSingleToken =
      entry.nameTokens.length === 1 &&
      nameMatches === 1 &&
      entry.nameTokens[0].length >= 4;
    if (!strongSingleToken && nameMatches < 2) return;

    const addressMatches = entry.addressTokens.filter(token =>
      inputTokens.has(token),
    ).length;
    const score =
      nameMatches / entry.nameTokens.length +
      Math.min(0.15, addressMatches * 0.05);

    if (
      score > bestScore ||
      (score === bestScore && addressMatches > bestAddressMatches) ||
      (score === bestScore &&
        addressMatches === bestAddressMatches &&
        entry.normalizedName.length > bestNameLength)
    ) {
      best = entry;
      bestScore = score;
      bestAddressMatches = addressMatches;
      bestNameLength = entry.normalizedName.length;
    }
  });

  return best ? best.service : null;
};

export const ChatbotModal = ({
  isOpen,
  onClose,
  services,
  sidebarWidth,
  onServiceSelect,
}: ChatbotModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      text: "Hi! I'm your Kalibrate assistant. I can help you find healthcare, groceries, banks, and other services in Kingston. What are you looking for?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [lastMatchedServiceId, setLastMatchedServiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const serviceIndex = useMemo(() => buildServiceIndex(services), [services]);

  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecording,
    clearError,
    isSupported: isVoiceSupported,
  } = useVoiceInput();

  // Request microphone permission when modal opens
  useEffect(() => {
    if (isOpen && isVoiceSupported && micPermission === 'prompt') {
      transcribeService.requestMicrophonePermission().then(granted => {
        setMicPermission(granted ? 'granted' : 'denied');
      });
    }
  }, [isOpen, isVoiceSupported, micPermission]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset interaction state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInteracted(false);
      setLastMatchedServiceId(null);
    }
  }, [isOpen]);

  const handleActionClick = useCallback((action: ChatAction) => {
    const service = services.find(item => item.id === action.serviceId);
    if (!service) return;
    setLastMatchedServiceId(service.id);
    onServiceSelect?.(service.id);
  }, [services, onServiceSelect]);

  const getLocalHoursResponse = useCallback((text: string) => {
    if (!isHoursIntent(text)) return null;

    const matchedService = findBestServiceMatch(text, serviceIndex);
    if (!matchedService) {
      const promptMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: 'I can give opening hours for a specific place. Say the full service name, like "Kingston General Hospital".',
        sender: 'bot',
        timestamp: new Date(),
      };
      return { message: promptMessage, matchedServiceId: null };
    }

    const details = matchedService.details;
    const hardcodedHours =
      matchedService.id === 'poi_100517'
        ? 'Open 24/7, Monday to Sunday'
        : undefined;
    const hours =
      hardcodedHours ||
      matchedService.hours ||
      getDetailString(details, 'hours');

    const website =
      matchedService.website ||
      getDetailString(details, 'website');
    const infoUrl = getDetailString(details, 'info_url');
    const link = website || infoUrl;
    const linkLabel = website ? 'Website' : 'Info';

    const extraDetails: string[] = [];
    const subDescription = getDetailString(details, 'sub_description');
    if (subDescription) {
      extraDetails.push(`Type: ${subDescription}.`);
    }
    const affordability = getDetailString(details, 'affordability');
    if (affordability) {
      extraDetails.push(`Affordability: ${affordability}.`);
    }
    const region = getDetailString(details, 'region');
    if (region) {
      extraDetails.push(`Region: ${region}.`);
    }
    const servicesProvided = formatDetailValue(details?.services);
    if (servicesProvided) {
      extraDetails.push(`Services: ${servicesProvided}.`);
    }

    const messageParts = [
      `Hours for ${matchedService.name}: ${hours || 'not listed yet'}.`,
    ];
    if (link) {
      messageParts.push(`${linkLabel}: ${link}.`);
    }
    if (extraDetails.length > 0) {
      messageParts.push(extraDetails.join(' '));
    }
    messageParts.push('Want me to show it on the map?');

    const actions: ChatAction[] = [
      {
        id: `action-map-${matchedService.id}`,
        label: 'Show on map',
        kind: 'show_on_map',
        serviceId: matchedService.id,
      },
    ];

    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      text: messageParts.join(' '),
      sender: 'bot',
      timestamp: new Date(),
      actions,
    };

    return { message: botMessage, matchedServiceId: matchedService.id };
  }, [serviceIndex]);

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    setHasInteracted(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: trimmedText,
      sender: 'user',
      timestamp: new Date(),
    };

    const actionIntent = getActionIntent(trimmedText);
    if (actionIntent && lastMatchedServiceId) {
      const matchedService = services.find(
        service => service.id === lastMatchedServiceId,
      );
      if (matchedService) {
        onServiceSelect?.(matchedService.id);
        const actionMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          text:
            actionIntent === 'show_on_map'
              ? `Showing ${matchedService.name} on the map and opening details.`
              : `Opening details for ${matchedService.name} and focusing the map.`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage, actionMessage]);
        return;
      }
    }

    const localResponse = getLocalHoursResponse(trimmedText);
    if (localResponse) {
      setLastMatchedServiceId(localResponse.matchedServiceId);
      setMessages(prev => [...prev, userMessage, localResponse.message]);
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await lexService.sendMessage(trimmedText);
      const botMessage = lexService.lexResponseToChatMessage(response);
      setMessages(prev => [...prev, botMessage]);

      // If response includes a serviceId, trigger service selection
      if (response.serviceId) {
        onServiceSelect?.(response.serviceId);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const transcript = await stopRecording();
      if (transcript) {
        setHasInteracted(true);
        await handleSendMessage(transcript);
      }
    } else {
      setHasInteracted(true);
      await startRecording();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-title"
    >
      <div
        className="absolute bottom-6 -translate-x-1/2 pointer-events-auto"
        style={{
          left: `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`,
          width: `min(760px, calc(100vw - ${sidebarWidth}px - 32px))`,
        }}
      >
        <LiquidGlassCard
          radiusClass="rounded-2xl"
          singleLayer
          className="border-white/10 bg-neutral-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          <div className="flex items-center justify-between px-3 sm:px-4 pt-2.5 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/50" />
              <h2 id="chatbot-title" className="text-[10px] uppercase tracking-widest text-white/50">
                Voice Assistant
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/[0.08] rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-white/25"
              aria-label="Close voice assistant"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            className={`px-3 sm:px-4 pb-2.5 transition-all duration-200 ${
              hasInteracted ? 'max-h-[50vh] opacity-100' : 'max-h-0 opacity-0'
            } overflow-hidden`}
          >
            <div
              className="space-y-2.5 overflow-y-auto pr-2"
              style={{ maxHeight: '45vh' }}
              role="log"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 ${
                      message.sender === 'user'
                        ? 'bg-white/[0.14] text-white/90'
                        : 'bg-white/[0.06] text-white/80'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{message.text}</p>
                    <p className="text-[10px] mt-1 text-white/45">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.actions.map(action => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className="px-2 py-1 rounded-md text-[10px] uppercase tracking-widest border border-white/10 bg-white/[0.08] text-white/70 hover:bg-white/[0.16] hover:text-white transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
                    <div className="flex space-x-2">
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {voiceError && (
            <div
              className="px-4 py-2 bg-red-500/10 border-t border-red-500/30"
              role="alert"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-200">{voiceError}</p>
                <button
                  onClick={clearError}
                  className="text-red-200 hover:text-red-100"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

<div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-3 flex flex-col items-center">
            {/* Microphone Button - Centered and larger */}
            {isVoiceSupported && (
              <button
                onClick={handleVoiceToggle}
                disabled={isProcessing}
                className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
                  flex items-center justify-center
                  ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                      : 'bg-white/[0.1] hover:bg-white/[0.15] text-white/80 hover:text-white'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                aria-pressed={isRecording}
              >
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            )}
            
            {/* Status text */}
            <p className="mt-3 text-xs text-white/50">
              {isRecording ? 'Listening... tap to stop' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </p>
          </div>
        </LiquidGlassCard>
      </div>
    </div>
  );
};
