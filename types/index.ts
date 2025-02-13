export interface AudioSegment {
  blob: Blob
  duration: number
  index: number
  name: string
}

export interface AudioUploaderProps {
  onProcessingStart: () => void
  onProcessingProgress: (progress: number) => void
  onProcessingComplete: (segments: AudioSegment[]) => void
  onError: (error: string) => void
}

export interface ProcessingStatusProps {
  progress?: number
}

export interface DownloadSectionProps {
  segments: AudioSegment[]
} 