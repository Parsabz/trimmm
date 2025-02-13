interface ProcessingStatusProps {
  progress?: number;
}

export default function ProcessingStatus({ progress = 0 }: ProcessingStatusProps) {
  return (
    <div className="mt-8 text-center">
      <div className="relative h-12 w-12 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        <div 
          className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"
          style={{
            transform: `rotate(${progress * 360}deg)`,
            transition: 'transform 0.4s ease'
          }}
        ></div>
      </div>
      <p className="text-gray-600">
        Processing audio file...{progress > 0 ? ` ${Math.round(progress * 100)}%` : ''}
      </p>
    </div>
  )
} 