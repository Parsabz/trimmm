export interface AudioSegment {
  blob: Blob;
  duration: number;
  index: number;
  name: string;
}

export interface AudioData {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  channels: Float32Array[];
  channelData?: Float32Array[];
} 