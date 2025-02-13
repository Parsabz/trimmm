'use client'

import { useState, useEffect } from 'react'
import { AudioUploaderProps } from '../types'
import { createWorker } from '../utils/workerFactory'

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function AudioUploader({ 
  onProcessingStart, 
  onProcessingComplete,
  onError,
  onProcessingProgress
}: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let mounted = true

    const initWorker = async () => {
      try {
        const newWorker = await createWorker()
        if (mounted && newWorker) {
          setWorker(newWorker)
        }
      } catch (error) {
        console.error('Failed to initialize worker:', error)
        if (mounted) {
          onError('Failed to initialize audio processor')
        }
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    initWorker()

    return () => {
      mounted = false
      if (worker) {
        worker.terminate()
      }
    }
  }, [onError])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      onError('Please upload a valid audio file (MP3, WAV, or OGG)')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      onError('File size exceeds 100MB limit')
      return
    }

    try {
      onProcessingStart()
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Failed to read audio file')
      }
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        .catch(err => {
          throw new Error(`Failed to decode audio: ${err.message}`)
        })

      // Send audio data to worker
      if (worker) {
        worker.onmessage = (e) => {
          const { type, segments, error, progress } = e.data
          if (type === 'complete') {
            onProcessingComplete(segments)
          } else if (type === 'error') {
            onError(error)
          } else if (type === 'progress') {
            onProcessingProgress(progress)
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
      const errorMessage = error instanceof Error ? 
        error.message : 
        'An unexpected error occurred while processing the audio file'
      onError(errorMessage)
      console.error('Audio processing error:', error)
    } finally {
      // Clean up AudioContext if needed
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close()
      }
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
      {isInitializing ? (
        <div className="text-gray-600">
          Initializing audio processor...
        </div>
      ) : (
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
      )}
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