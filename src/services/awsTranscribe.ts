/**
 * AWS Transcribe Service - STUBBED FOR MVP
 * Phase 2 will implement real-time streaming transcription
 */

export interface TranscribeResult {
  transcript: string;
  confidence: number;
}

// Simulates starting voice recording
export const startRecording = async (): Promise<void> => {
  console.log('[STUB] AWS Transcribe - Starting recording...');
  // Phase 2: Initialize MediaRecorder and AWS Transcribe streaming
  return Promise.resolve();
};

// Simulates stopping recording and returning transcript
export const stopRecording = async (): Promise<TranscribeResult> => {
  console.log('[STUB] AWS Transcribe - Stopping recording...');
  // Phase 2: Stop MediaRecorder, send to AWS Transcribe, return result
  return {
    transcript: 'Find me the nearest grocery store',
    confidence: 0.95,
  };
};

// Check if browser supports voice input
export const isBrowserSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Request microphone permission
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};
