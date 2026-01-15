import { useState, useRef, useEffect } from 'react';
import type { ChatbotModalProps, ChatMessage } from '@/types';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import * as lexService from '@/services/awsLex';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';

export const ChatbotModal = ({
  isOpen,
  onClose,
  sidebarWidth,
}: ChatbotModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      text: "Hi! I'm your Kalibrate assistant. I can help you find healthcare, groceries, banks, and other services in Kingston. What are you looking for?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecording,
    clearError,
    isSupported: isVoiceSupported,
  } = useVoiceInput();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      textAreaRef.current?.focus();
    } else {
      setHasInteracted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = '0px';
    const nextHeight = Math.min(textAreaRef.current.scrollHeight, 140);
    textAreaRef.current.style.height = `${nextHeight}px`;
  }, [inputText]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setHasInteracted(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await lexService.sendMessage(text.trim());
      const botMessage = lexService.lexResponseToChatMessage(response);
      setMessages(prev => [...prev, botMessage]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
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
          width: `min(720px, calc(100vw - ${sidebarWidth}px - 32px))`,
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

          <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
            <div className="flex items-end gap-2">
              {isVoiceSupported && (
                <button
                  onClick={handleVoiceToggle}
                  disabled={isProcessing}
                  className={`
                    p-2.5 sm:p-3 rounded-lg transition-all duration-200
                    focus:outline-none focus:ring-1 focus:ring-white/25
                    ${
                      isRecording
                        ? 'bg-red-500/80 text-white animate-pulse'
                        : 'bg-white/[0.06] hover:bg-white/[0.1] text-white/70'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                  aria-pressed={isRecording}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
              <textarea
                ref={textAreaRef}
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  setHasInteracted(true);
                }}
                onKeyPress={handleKeyPress}
                disabled={isSending || isRecording}
                placeholder={
                  isRecording ? 'Listening...' : 'Message Kalibrate...'
                }
                rows={1}
                className="
                  flex-1 resize-none px-3 sm:px-4 py-2 border border-white/10 rounded-lg
                  bg-white/[0.04] text-xs text-white/85 placeholder:text-white/40
                  focus:outline-none focus:ring-1 focus:ring-white/25
                  disabled:bg-white/[0.02] disabled:cursor-not-allowed
                "
                aria-label="Message input"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isSending || isRecording}
                className="
                  px-4 sm:px-5 py-2 bg-white/[0.12] text-xs text-white/85 rounded-lg
                  hover:bg-white/[0.18] transition-colors
                  focus:outline-none focus:ring-1 focus:ring-white/25
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </div>
        </LiquidGlassCard>
      </div>
    </div>
  );
};
