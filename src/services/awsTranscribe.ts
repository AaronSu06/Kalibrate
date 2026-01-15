import {
  StartStreamTranscriptionCommand,
  TranscribeStreamingClient,
} from '@aws-sdk/client-transcribe-streaming';
import {
  getAwsCredentials,
  getAwsRegion,
  getTranscribeLanguageCode,
} from '@/services/awsConfig';

export interface TranscribeResult {
  transcript: string;
  confidence: number;
}

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

class TranscribeSession {
  private audioContext: AudioContext;
  private processorNode: ScriptProcessorNode;
  private sourceNode: MediaStreamAudioSourceNode;
  private silenceNode: GainNode;
  private isStopped = false;
  private audioQueue: Uint8Array[] = [];
  private queueResolver: (() => void) | null = null;
  private transcriptParts: string[] = [];
  private latestPartial = '';
  private transcriptionPromise: Promise<TranscribeResult>;
  private inputSampleRate: number;

  constructor(private mediaStream: MediaStream) {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('AudioContext is not supported in this browser.');
    }

    this.audioContext = new AudioContextClass();
    this.inputSampleRate = this.audioContext.sampleRate;
    this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);
    this.processorNode = this.audioContext.createScriptProcessor(
      BUFFER_SIZE,
      1,
      1,
    );
    this.silenceNode = this.audioContext.createGain();
    this.silenceNode.gain.value = 0;

    this.processorNode.onaudioprocess = event => {
      if (this.isStopped) return;
      const inputData = event.inputBuffer.getChannelData(0);
      const chunk = downsampleBuffer(
        inputData,
        this.inputSampleRate,
        TARGET_SAMPLE_RATE,
      );
      if (chunk.byteLength > 0) {
        this.audioQueue.push(chunk);
        this.queueResolver?.();
      }
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.silenceNode);
    this.silenceNode.connect(this.audioContext.destination);

    this.transcriptionPromise = this.startTranscription();
  }

  async start(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async stop(): Promise<TranscribeResult> {
    this.isStopped = true;
    this.processorNode.onaudioprocess = null;
    this.sourceNode.disconnect();
    this.processorNode.disconnect();
    this.silenceNode.disconnect();
    this.mediaStream.getTracks().forEach(track => track.stop());
    this.queueResolver?.();

    try {
      await this.audioContext.close();
    } catch {
      // AudioContext may already be closed.
    }

    return this.transcriptionPromise;
  }

  private async startTranscription(): Promise<TranscribeResult> {
    const client = new TranscribeStreamingClient({
      region: getAwsRegion(),
      credentials: getAwsCredentials(),
    });

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: getTranscribeLanguageCode(),
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: TARGET_SAMPLE_RATE,
      AudioStream: this.audioStream(),
    });

    const response = await client.send(command);
    const transcriptStream = response.TranscriptResultStream;

    if (!transcriptStream) {
      return { transcript: '', confidence: 0 };
    }

    for await (const event of transcriptStream) {
      const results = event.TranscriptEvent?.Transcript?.Results;
      if (!results?.length) continue;

      results.forEach(result => {
        const transcript = result.Alternatives?.[0]?.Transcript;
        if (!transcript) return;
        if (result.IsPartial) {
          this.latestPartial = transcript;
        } else {
          const last = this.transcriptParts[this.transcriptParts.length - 1];
          if (transcript !== last) {
            this.transcriptParts.push(transcript);
          }
        }
      });
    }

    const transcript =
      this.transcriptParts.join(' ').trim() ||
      this.latestPartial.trim();

    return {
      transcript,
      confidence: transcript ? 1 : 0,
    };
  }

  private async *audioStream(): AsyncIterable<{
    AudioEvent: { AudioChunk: Uint8Array };
  }> {
    while (!this.isStopped || this.audioQueue.length > 0) {
      if (this.audioQueue.length === 0) {
        await new Promise<void>(resolve => {
          this.queueResolver = resolve;
        });
        this.queueResolver = null;
        continue;
      }

      const chunk = this.audioQueue.shift();
      if (chunk) {
        yield { AudioEvent: { AudioChunk: chunk } };
      }
    }
  }
}

let activeSession: TranscribeSession | null = null;

// Start streaming transcription from the microphone.
export const startRecording = async (): Promise<void> => {
  if (activeSession) return;
  if (!isBrowserSupported()) {
    throw new Error('Voice input is not supported in this browser.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const session = new TranscribeSession(stream);
  activeSession = session;
  await session.start();
};

// Stop streaming transcription and return the transcript.
export const stopRecording = async (): Promise<TranscribeResult> => {
  if (!activeSession) {
    return { transcript: '', confidence: 0 };
  }
  const session = activeSession;
  activeSession = null;
  return session.stop();
};

// Check if browser supports voice input
export const isBrowserSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    !!(window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  );
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

const downsampleBuffer = (
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Uint8Array => {
  if (outputSampleRate === inputSampleRate) {
    return floatTo16BitPCM(buffer);
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    const sample = count ? accum / count : 0;
    result[offsetResult] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return new Uint8Array(result.buffer);
};

const floatTo16BitPCM = (buffer: Float32Array): Uint8Array => {
  const output = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, buffer[i]));
    output[i] = sample * 0x7fff;
  }
  return new Uint8Array(output.buffer);
};
