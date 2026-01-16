import { useState, useCallback } from 'react';
import type { VoiceInputState } from '@/types';
import * as transcribeService from '@/services/awsTranscribe';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
  });

  const startRecording = useCallback(async () => {
    try {
      if (!transcribeService.isBrowserSupported()) {
        setState(prev => ({
          ...prev,
          error: 'Voice input is not supported in this browser.',
        }));
        return;
      }

      // Clear any previous errors
      setState(prev => ({ ...prev, error: undefined }));

      const hasPermission = await transcribeService.requestMicrophonePermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, error: 'Please allow microphone access and try again.' }));
        return;
      }

      setState({ isRecording: true, isProcessing: false, error: undefined });
      await transcribeService.startRecording();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: message === 'not-allowed' ? 'Please allow microphone access in your browser settings.' : message,
      }));
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
      const result = await transcribeService.stopRecording();
      const transcript = result.transcript?.trim();
      if (!transcript) {
        setState({
          isRecording: false,
          isProcessing: false,
          error: 'No speech detected. Please try again.',
        });
        return null;
      }
      setState({ isRecording: false, isProcessing: false, error: undefined });
      return transcript;
    } catch (error) {
      setState({
        isRecording: false,
        isProcessing: false,
        error: getErrorMessage(error, 'Transcription failed'),
      });
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearError,
    isSupported: transcribeService.isBrowserSupported(),
  };
};
