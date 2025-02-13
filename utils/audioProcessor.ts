import type { AudioSegment, AudioData } from '../types/audio'
import type { LameEncoder } from './lame-bundle'

const SEGMENT_DURATION = 120 // 2 minutes in seconds
const MP3_QUALITY = 192 // kbps (high quality)
const SAMPLE_RATE = 44100 // CD quality

function validateAudioData(audioData: AudioData): void {
  if (!audioData.channels || !audioData.channels.length) {
    throw new Error('No audio channels found');
  }
  if (!audioData.sampleRate || audioData.sampleRate <= 0) {
    throw new Error('Invalid sample rate');
  }
  if (audioData.channels.some(ch => !(ch instanceof Float32Array))) {
    throw new Error('Invalid channel data type - expected Float32Array');
  }
  if (audioData.channels.some(ch => ch.length !== audioData.channels[0].length)) {
    throw new Error('Channel lengths do not match');
  }
}

function convertToMp3(
  audioData: AudioData,
  kbps: number,
  lame: LameEncoder,
  onProgress: (progress: number) => void
): Int8Array {
  const mp3Data: Int8Array[] = [];
  let left: Int16Array | null = null;
  let right: Int16Array | null = null;
  
  try {
    console.log('Starting MP3 conversion...');
    validateAudioData(audioData);

    const channels = audioData.numberOfChannels;
    const sampleRate = audioData.sampleRate;
    
    console.log('Creating encoder with:', { channels, sampleRate, kbps });
    const mp3encoder = lame.createEncoder(channels, sampleRate, kbps);
    
    // Convert Float32Array to Int16Array with proper scaling
    console.log('Converting audio format...');
    left = new Int16Array(audioData.channels[0].length);
    right = channels > 1 ? new Int16Array(audioData.channels[1].length) : left;

    // Process in smaller chunks to avoid memory issues
    const CHUNK_SIZE = 1152; // Must be multiple of 576 for MP3
    const totalSamples = audioData.channels[0].length;

    console.log(`Processing ${totalSamples} samples in chunks of ${CHUNK_SIZE}`);

    let offset = 0;
    while (offset < totalSamples) {
      const count = Math.min(CHUNK_SIZE, totalSamples - offset);
      
      // Convert chunk to Int16Array
      for (let i = 0; i < count; i++) {
        const idx = offset + i;
        const leftSample = audioData.channels[0][idx];
        left[idx] = Math.max(-32768, Math.min(32767, Math.round(leftSample * 32768)));
        
        if (channels > 1) {
          const rightSample = audioData.channels[1][idx];
          right[idx] = Math.max(-32768, Math.min(32767, Math.round(rightSample * 32768)));
        }
      }

      // Encode chunk
      const leftChunk = left.subarray(offset, offset + count);
      const rightChunk = channels > 1 ? right.subarray(offset, offset + count) : leftChunk;
      
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(mp3buf);
        console.log(`Encoded chunk of ${count} samples, got ${mp3buf.length} bytes`);
      }

      offset += count;
      onProgress(offset / totalSamples);
    }

    console.log('Flushing encoder...');
    const final = mp3encoder.flush();
    if (final && final.length > 0) {
      mp3Data.push(final);
      console.log(`Final flush produced ${final.length} bytes`);
    }

    const totalLength = mp3Data.reduce((acc, buf) => acc + buf.length, 0);
    console.log(`Total MP3 data length: ${totalLength} bytes`);
    
    const result = new Int8Array(totalLength);
    let pos = 0;
    
    for (const buf of mp3Data) {
      result.set(buf, pos);
      pos += buf.length;
      // Clear reference to free memory
      mp3Data.shift();
    }

    return result;
  } finally {
    // Clean up large buffers
    left = null;
    right = null;
  }
}

export function processAudioSegments(
  audioData: AudioData,
  lame: LameEncoder,
  onProgress: (progress: number) => void
): Promise<AudioSegment[]> {
  return new Promise((resolve, reject) => {
    try {
      const segments: AudioSegment[] = [];
      const numberOfSegments = Math.ceil(audioData.duration / SEGMENT_DURATION);
      
      let totalProgress = 0;
      const segmentProgressStep = 1 / numberOfSegments;
      
      // Ensure progress is always between 0 and 1
      const reportProgress = (progress: number) => {
        totalProgress = Math.min(Math.max(progress, 0), 1);
        onProgress(totalProgress);
      };

      for (let i = 0; i < numberOfSegments; i++) {
        const startTime = i * SEGMENT_DURATION
        const endTime = Math.min((i + 1) * SEGMENT_DURATION, audioData.duration)
        const startSample = Math.floor(startTime * audioData.sampleRate)
        const endSample = Math.floor(endTime * audioData.sampleRate)
        const segmentLength = endSample - startSample

        const segmentChannels = audioData.channels.map(channel => 
          channel.slice(startSample, endSample)
        )

        const segmentData: AudioData = {
          numberOfChannels: audioData.numberOfChannels,
          sampleRate: audioData.sampleRate,
          length: segmentLength,
          duration: endTime - startTime,
          channels: segmentChannels,
          channelData: segmentChannels
        };

        const mp3Data = convertToMp3(
          segmentData,
          MP3_QUALITY,
          lame,
          (segmentProgress) => {
            const currentProgress = totalProgress + (segmentProgress * segmentProgressStep)
            reportProgress(currentProgress)
          }
        )

        const blob = new Blob([mp3Data], { type: 'audio/mp3' })
        
        segments.push({
          blob,
          duration: endTime - startTime,
          index: i + 1,
          name: `segment_${i + 1}.mp3`
        })
      }

      reportProgress(1); // Signal completion
      resolve(segments);
    } catch (error) {
      console.error('Audio processing error:', error);
      reject(error);
    }
  });
} 