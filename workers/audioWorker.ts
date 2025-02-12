import { processAudioSegments } from '../utils/audioProcessor';

self.onmessage = async (e) => {
  try {
    const { audioData } = e.data;
    const segments = await processAudioSegments(audioData);
    self.postMessage({ type: 'complete', segments });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Processing failed' 
    });
  }
}; 