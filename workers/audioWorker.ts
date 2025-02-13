/// <reference lib="webworker" />

import { processAudioSegments } from '../utils/audioProcessor';
import type { LameEncoder } from '../utils/lame-bundle';

declare const self: DedicatedWorkerGlobalScope;

// Add type definitions for lamejs
declare global {
  interface WorkerGlobalScope {
    lamejs: {
      Mp3Encoder: {
        new (channels: number, sampleRate: number, kbps: number): {
          encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
          flush(): Int8Array;
          init(): void;
        };
        prototype: {
          encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
          flush(): Int8Array;
          init(): void;
        };
      };
      version: string;
    };
  }
}

console.log('Worker starting...');

// Load lamejs synchronously
try {
  console.log('Loading lamejs...');
  
  // Load the encoder synchronously
  importScripts('/lib/lame.min.js');
  
  // Initialize the encoder
  if (typeof (self as any).initializeLamejs !== 'function') {
    throw new Error('Lamejs initialization function not found');
  }

  // Wait for initialization
  await (self as any).initializeLamejs()
    .catch((error: Error) => {
      console.error('Lamejs initialization failed:', error);
      throw error;
    });

  // Verify encoder is working
  if (typeof self.lamejs?.Mp3Encoder !== 'function') {
    throw new Error('Mp3Encoder not properly initialized');
  }

  const testEncoder = new self.lamejs.Mp3Encoder(2, 44100, 128);
  if (!testEncoder || typeof testEncoder.encodeBuffer !== 'function') {
    throw new Error('Invalid encoder instance after initialization');
  }

  console.log('Lamejs encoder verified successfully');
  
  // Signal ready state
  self.postMessage({ type: 'ready' });
  
} catch (error) {
  console.error('Failed to load lamejs:', error);
  self.postMessage({ 
    type: 'error', 
    error: `Failed to load audio encoder: ${error.message}` 
  });
  throw error;
}

// Define MPEGMode constants
const MPEGMode = {
  STEREO: 0,
  JOINT_STEREO: 1,
  DUAL_CHANNEL: 2,
  MONO: 3
};

// Make MPEGMode globally available
(self as any).MPEGMode = MPEGMode;

interface WorkerData {
  audioData: {
    sampleRate: number;
    length: number;
    duration: number;
    numberOfChannels: number;
    channels: Float32Array[];
  };
}

// Add test function to verify encoder
function testEncoder(encoder: any) {
  // Create a simple test buffer
  const testLeft = new Int16Array([0, 32767, -32768]);
  const testRight = new Int16Array([0, 32767, -32768]);
  
  // Try to encode it
  try {
    const result = encoder.encodeBuffer(testLeft, testRight);
    if (!(result instanceof Int8Array)) {
      throw new Error('Encoder returned invalid data type');
    }
    console.log('Encoder test successful');
  } catch (error) {
    console.error('Encoder test failed:', error);
    throw error;
  }
}

const lameWrapper: LameEncoder = {
  createEncoder: (channels: number, sampleRate: number, bitRate: number) => {
    try {
      console.log('Creating encoder with settings:', { channels, sampleRate, bitRate });
      
      // Create encoder instance
      const Encoder = self.lamejs.Mp3Encoder;
      const encoder = new Encoder(channels, sampleRate, bitRate);
      
      if (!encoder || typeof encoder.encodeBuffer !== 'function') {
        throw new Error('Invalid encoder instance');
      }

      // Test the encoder
      testEncoder(encoder);

      console.log('Encoder created and tested successfully');
      return encoder;
    } catch (error) {
      console.error('Failed to create encoder:', error);
      throw new Error('Failed to initialize audio encoder');
    }
  }
};

// Modify the message handler to properly handle initialization
self.onmessage = async (e: MessageEvent<WorkerData | { type: string }>) => {
  try {
    console.log('Received message in worker:', e.data);
    
    // Handle initialization message
    if ('type' in e.data && e.data.type === 'init') {
      console.log('Worker initialized');
      self.postMessage({ type: 'ready' });
      return;
    }
    
    // Handle audio processing
    if (!('audioData' in e.data)) {
      throw new Error('Invalid message format - expected audioData');
    }
    
    const { audioData } = e.data;
    
    // Validate audio data
    if (!audioData || !audioData.channels || !audioData.channels.length) {
      throw new Error('Invalid audio data received');
    }

    console.log('Audio data received:', {
      sampleRate: audioData.sampleRate,
      channels: audioData.numberOfChannels,
      duration: audioData.duration,
      length: audioData.length,
      channelLengths: audioData.channels.map(ch => ch.length),
      channelTypes: audioData.channels.map(ch => ch.constructor.name)
    });

    const reportProgress = (progress: number) => {
      self.postMessage({ type: 'progress', progress });
    };

    console.log('Starting audio processing...');
    const segments = await processAudioSegments(audioData, lameWrapper, reportProgress);
    console.log('Audio processing complete, segments:', segments.length);
    self.postMessage({ type: 'complete', segments });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Processing failed' 
    });
  }
};

export default {} as typeof Worker & { new (): Worker }; 