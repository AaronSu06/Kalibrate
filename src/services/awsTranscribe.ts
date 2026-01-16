export interface TranscribeResult {
  transcript: string;
  confidence: number;
}

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript?: string };
  }>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

const getSpeechRecognitionClass = (): BrowserSpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  const typedWindow = window as typeof window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return typedWindow.SpeechRecognition || typedWindow.webkitSpeechRecognition || null;
};

const parseLanguageList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
};

const normalizeLanguage = (value: string) =>
  value.trim().toLowerCase().replace('_', '-');

const getRecognitionLanguage = (): string => {
  const envLanguages = parseLanguageList(import.meta.env.VITE_SPEECH_LANGUAGES);
  const envFallback = parseLanguageList(import.meta.env.VITE_AWS_TRANSCRIBE_LANGUAGE);
  const browserLanguages =
    typeof navigator !== 'undefined' ? navigator.languages : [];

  if (!envLanguages.length) {
    return (
      envFallback[0] ||
      browserLanguages[0] ||
      (typeof navigator !== 'undefined' ? navigator.language : '') ||
      'en-US'
    );
  }

  if (browserLanguages.length) {
    const normalizedBrowser = browserLanguages.map(normalizeLanguage);
    for (const language of envLanguages) {
      const normalizedLanguage = normalizeLanguage(language);
      const matches = normalizedBrowser.some(
        browserLang =>
          browserLang === normalizedLanguage ||
          browserLang.startsWith(normalizedLanguage) ||
          normalizedLanguage.startsWith(browserLang),
      );
      if (matches) {
        return language;
      }
    }
  }

  return envLanguages[0];
};

class SpeechRecognitionSession {
  private recognition: BrowserSpeechRecognition;
  private transcriptParts: string[] = [];
  private latestPartial = '';
  private isResolved = false;
  private transcriptionPromise: Promise<TranscribeResult>;
  private resolvePromise?: (result: TranscribeResult) => void;
  private rejectPromise?: (error: Error) => void;

  constructor(SpeechRecognitionClass: BrowserSpeechRecognitionConstructor, language: string) {
    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = language;
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.transcriptionPromise = new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });

    this.recognition.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) continue;
        if (result.isFinal) {
          this.transcriptParts.push(transcript);
          this.latestPartial = '';
        } else {
          this.latestPartial = transcript;
        }
      }
    };

    this.recognition.onerror = event => {
      if (this.isResolved) return;
      this.isResolved = true;
      const message = event?.error || 'Speech recognition encountered an error.';
      this.rejectPromise?.(new Error(message));
    };

    this.recognition.onend = () => {
      if (this.isResolved) return;
      this.isResolved = true;
      const transcript =
        this.transcriptParts.join(' ').trim() || this.latestPartial.trim();
      this.resolvePromise?.({
        transcript,
        confidence: transcript ? 1 : 0,
      });
    };
  }

  async start(): Promise<void> {
    this.recognition.start();
  }

  async stop(): Promise<TranscribeResult> {
    this.recognition.stop();
    return this.transcriptionPromise;
  }
}

let activeSession: SpeechRecognitionSession | null = null;

export const startRecording = async (): Promise<void> => {
  if (activeSession) return;
  const SpeechRecognitionClass = getSpeechRecognitionClass();
  if (!SpeechRecognitionClass) {
    throw new Error('Speech recognition is not supported in this browser.');
  }

  const session = new SpeechRecognitionSession(
    SpeechRecognitionClass,
    getRecognitionLanguage(),
  );
  activeSession = session;
  try {
    await session.start();
  } catch (error) {
    activeSession = null;
    throw error;
  }
};

export const stopRecording = async (): Promise<TranscribeResult> => {
  if (!activeSession) {
    return { transcript: '', confidence: 0 };
  }
  const session = activeSession;
  activeSession = null;
  return session.stop();
};

export const isBrowserSupported = (): boolean => {
  return !!getSpeechRecognitionClass();
};

let micPermissionGranted = false;

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (!isBrowserSupported()) return false;
  
  // If already granted in this session, return true
  if (micPermissionGranted) return true;
  
  try {
    // Check permission status first if available
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'granted') {
          micPermissionGranted = true;
          return true;
        }
      } catch {
        // permissions.query may not support microphone in all browsers
      }
    }
    
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately - we just needed the permission
    stream.getTracks().forEach(track => track.stop());
    micPermissionGranted = true;
    return true;
  } catch (error) {
    console.error('Microphone permission error:', error);
    return false;
  }
};
