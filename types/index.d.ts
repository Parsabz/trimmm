declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
    flush(): Int8Array;
    MPEGMode?: {
      STEREO: number;
      JOINT_STEREO: number;
      DUAL_CHANNEL: number;
      MONO: number;
    };
  }
  
  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
  };
  
  export default lamejs;
}

interface Window {
  webkitAudioContext: typeof AudioContext;
}

declare module '*.worker.ts' {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
} 