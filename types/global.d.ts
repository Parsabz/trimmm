declare module 'lamejs';

interface Window {
  webkitAudioContext: typeof AudioContext
}

interface DedicatedWorkerGlobalScope {
  importScripts(...urls: string[]): void;
} 