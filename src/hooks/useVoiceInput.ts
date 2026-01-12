import { useState, useCallback } from 'react';
import type { VoiceInputState } from '@/types';
import * as transcribeService from '@/services/awsTranscribe';

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
  });

  const startRecording = useCallback(async () => {
    try {
      const hasPermission = await transcribeService.requestMicrophonePermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, error: 'Microphone permission denied' }));
        return;
      }

      setState({ isRecording: true, isProcessing: false });
      await transcribeService.startRecording();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Failed to start recording',
      }));
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
      const result = await transcribeService.stopRecording();
      setState({ isRecording: false, isProcessing: false });
      return result.transcript;
    } catch (error) {
      setState({
        isRecording: false,
        isProcessing: false,
        error: 'Transcription failed',
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
