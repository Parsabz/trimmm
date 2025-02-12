import { AudioSegment } from '../types'

const SEGMENT_DURATION = 120 // 2 minutes in seconds
const MP3_QUALITY = 192 // kbps (high quality)
const SAMPLE_RATE = 44100 // CD quality

function convertToMp3(
  audioData: {
    numberOfChannels: number;
    sampleRate: number;
    length: number;
    channelData: Float32Array[];
  }, 
  kbps: number,
  lameLib: any
): Int8Array {
  try {
    const channels = audioData.numberOfChannels
    console.log('Creating encoder with:', { channels, SAMPLE_RATE, kbps }) // Debug log
    
    // Create encoder with just the required parameters
    const mp3encoder = new lameLib.Mp3Encoder(
      channels, // number of channels (1 for mono, 2 for stereo)
      SAMPLE_RATE, // sample rate (44.1kHz)
      kbps, // bitrate in kbps
      channels === 1 ? 3 : 1 // 3=MONO, 1=JOINT_STEREO
    )
    
    // Convert audio data to samples
    const channelData = audioData.channelData
    
    // Convert Float32Array to Int16Array
    const sampleSize = channelData[0].length
    const left = new Int16Array(sampleSize)
    const right = channels > 1 ? new Int16Array(sampleSize) : left
    
    for (let i = 0; i < sampleSize; i++) {
      // Scale to 16-bit integer (-32768 to 32767)
      left[i] = Math.max(-32768, Math.min(32767, channelData[0][i] * 32768))
      if (channels > 1) {
        right[i] = Math.max(-32768, Math.min(32767, channelData[1][i] * 32768))
      }
    }
    
    // Process in smaller chunks
    const CHUNK_SIZE = 1152; // Must be multiple of 576 for MP3
    const mp3Data = [];
    let chunkOffset = 0;

    while (chunkOffset < sampleSize) {
      const chunkSize = Math.min(CHUNK_SIZE, sampleSize - chunkOffset);
      const leftChunk = left.subarray(chunkOffset, chunkOffset + chunkSize);
      const rightChunk = channels > 1 
        ? right.subarray(chunkOffset, chunkOffset + chunkSize)
        : leftChunk;

      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      chunkOffset += chunkSize;
    }
    
    // Get the last chunk of data
    const final = mp3encoder.flush()
    if (final.length > 0) {
      mp3Data.push(final)
    }
    
    // Combine all chunks
    const totalLength = mp3Data.reduce((acc, buf) => acc + buf.length, 0)
    const result = new Int8Array(totalLength)
    let writeOffset = 0;
    
    for (const buf of mp3Data) {
      result.set(buf, writeOffset)
      writeOffset += buf.length
    }
    
    return result
  } catch (error) {
    console.error('MP3 conversion error:', error);
    throw new Error('Failed to convert audio to MP3 format');
  }
}

export function processAudioSegments(
  audioData: {
    sampleRate: number;
    length: number;
    duration: number;
    numberOfChannels: number;
    channels: Float32Array[];
  },
  lameLib: any
): Promise<AudioSegment[]> {
  try {
    const segments: AudioSegment[] = [];
    const numberOfSegments = Math.ceil(audioData.duration / SEGMENT_DURATION);

    for (let i = 0; i < numberOfSegments; i++) {
      const startTime = i * SEGMENT_DURATION;
      const endTime = Math.min((i + 1) * SEGMENT_DURATION, audioData.duration);
      const startSample = Math.floor(startTime * audioData.sampleRate);
      const endSample = Math.floor(endTime * audioData.sampleRate);
      const segmentLength = endSample - startSample;

      // Create segment buffer
      const segmentChannels = audioData.channels.map(channel => 
        channel.slice(startSample, endSample)
      );

      // Convert to MP3
      const mp3Data = convertToMp3({
        numberOfChannels: audioData.numberOfChannels,
        sampleRate: audioData.sampleRate,
        length: segmentLength,
        channelData: segmentChannels
      }, MP3_QUALITY, lameLib);

      const blob = new Blob([mp3Data], { type: 'audio/mp3' });
      
      segments.push({
        blob,
        duration: endTime - startTime,
        index: i + 1,
        name: `segment_${i + 1}.mp3`
      });
    }

    return segments;
  } catch (error) {
    console.error('Audio processing error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process audio file');
  }
} 