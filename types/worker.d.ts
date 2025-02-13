declare module '*?worker' {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}

declare module '*.worker.ts' {
  const content: any;
  export default content;
}

declare module 'lamejs' {
  interface Mp3EncoderOptions {
    channels: number;
    sampleRate: number;
    kbps: number;
  }

  export interface Mp3Encoder {
    encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    public encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
    public flush(): Int8Array;
  }

  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
  };

  export default lamejs;
} 