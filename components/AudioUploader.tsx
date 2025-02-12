'use client'

import { useState, useEffect } from 'react'
import { AudioUploaderProps } from '../types'

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function AudioUploader({ 
  onProcessingStart, 
  onProcessingComplete,
  onError 
}: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    if (typeof Window !== 'undefined') {
      const newWorker = new Worker(new URL('../workers/lameWorker.ts', import.meta.url))
      setWorker(newWorker)

      return () => {
        newWorker.terminate()
      }
    }
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      onError('Please upload an audio file')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      onError('File size exceeds 100MB limit')
      return
    }

    try {
      onProcessingStart()
      
      // Decode audio in main thread
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Send audio data to worker
      if (worker) {
        worker.onmessage = (e) => {
          const { type, segments, error } = e.data
          if (type === 'complete') {
            onProcessingComplete(segments)
          } else if (type === 'error') {
            onError(error)
          }
        }

        // Convert AudioBuffer to transferable format
        const audioData = {
          sampleRate: audioBuffer.sampleRate,
          length: audioBuffer.length,
          duration: audioBuffer.duration,
          numberOfChannels: audioBuffer.numberOfChannels,
          channels: Array.from({ length: audioBuffer.numberOfChannels }, 
            (_, i) => audioBuffer.getChannelData(i)
          )
        }

        worker.postMessage({ audioData }, audioData.channels.map(channel => channel.buffer))
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process audio file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/wave,audio/ogg,audio/opus,.mp3,.wav,.ogg"
        className="hidden"
        id="audio-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleFileSelect(file)
          }
        }}
      />
      <label
        htmlFor="audio-input"
        className="cursor-pointer block"
      >
        <div className="text-gray-600">
          <p className="mb-2">Drag and drop an audio file here, or click to select</p>
          <p className="text-sm">Supported formats: MP3, WAV, OGG</p>
        </div>
      </label>
    </div>
  )
} 