'use client'

import { useState } from 'react'
import AudioUploader from '../components/AudioUploader'
import ProcessingStatus from '../components/ProcessingStatus'
import DownloadSection from '../components/DownloadSection'
import { AudioSegment } from '../types'

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [segments, setSegments] = useState<AudioSegment[]>([])
  const [error, setError] = useState<string>('')

  const handleProcessingStart = () => {
    setIsProcessing(true)
    setError('')
  }

  const handleProcessingComplete = (processedSegments: AudioSegment[]) => {
    setSegments(processedSegments)
    setIsProcessing(false)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setIsProcessing(false)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Audio File Trimmer</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <AudioUploader
        onProcessingStart={handleProcessingStart}
        onProcessingComplete={handleProcessingComplete}
        onError={handleError}
      />
      
      {isProcessing && <ProcessingStatus />}
      
      {segments.length > 0 && <DownloadSection segments={segments} />}
    </main>
  )
} 