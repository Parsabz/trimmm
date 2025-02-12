// Import lamejs using importScripts since regular import might not work in worker context
importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');

import { processAudioSegments } from '../utils/audioProcessor';

declare const lamejs: any; // Declare lamejs as available in global scope

self.onmessage = async (e) => {
  try {
    const { audioData } = e.data;
    // Pass lamejs instance to the processor
    const segments = await processAudioSegments(audioData, lamejs);
    self.postMessage({ type: 'complete', segments });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Processing failed' 
    });
  }
}; 