import { DownloadSectionProps } from '../types'

export default function DownloadSection({ segments }: DownloadSectionProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Download Segments</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {segments.map((segment) => (
          <div
            key={segment.index}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <p className="font-medium mb-2">
              Segment {segment.index} ({segment.duration.toFixed(1)}s)
            </p>
            <a
              href={URL.createObjectURL(segment.blob)}
              download={segment.name}
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  )
} 