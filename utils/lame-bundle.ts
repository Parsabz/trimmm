import type { Mp3Encoder } from 'lamejs';

// Create a type-safe wrapper around lamejs
export interface LameEncoder {
  createEncoder: (channels: number, sampleRate: number, bitRate: number) => Promise<Mp3Encoder>;
}

export const createLameWrapper = (): LameEncoder => {
  return {
    createEncoder: async (channels: number, sampleRate: number, bitRate: number) => {
      if (!self.lamejs?.Mp3Encoder) {
        throw new Error('LAME encoder not properly initialized');
      }

      try {
        const encoder = new self.lamejs.Mp3Encoder(channels, sampleRate, bitRate);
        
        // Verify encoder functionality
        const testBuffer = new Int16Array(1152);
        const testResult = encoder.encodeBuffer(testBuffer, testBuffer);
        
        if (!(testResult instanceof Int8Array)) {
          throw new Error('Encoder producing invalid output');
        }
        
        return encoder;
      } catch (error) {
        throw new Error(`Failed to initialize LAME encoder: ${error.message}`);
      }
    }
  };
};

// Export the interface only
export default {} as LameEncoder; 