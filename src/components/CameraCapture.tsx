import { useState, useRef } from 'react'
import { Camera, X, Check } from 'lucide-react'
import Button from './ui/Button'

interface CameraCaptureProps {
  onPhotosCapture: (photos: File[]) => void
  maxPhotos?: number
}

interface CapturedPhoto {
  file: File
  preview: string
}

export default function CameraCapture({ onPhotosCapture, maxPhotos = 5 }: CameraCaptureProps) {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = maxPhotos - capturedPhotos.length
    const filesToAdd = files.slice(0, remainingSlots)

    const newPhotos: CapturedPhoto[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setCapturedPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = () => {
    if (capturedPhotos.length === 0) return
    onPhotosCapture(capturedPhotos.map((p) => p.file))
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {capturedPhotos.length < maxPhotos && (
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2"
          variant="secondary"
        >
          <Camera className="w-5 h-5" strokeWidth={2} />
          Take Photo {capturedPhotos.length > 0 && `(${capturedPhotos.length}/${maxPhotos})`}
        </Button>
      )}

      {capturedPhotos.length > 0 && (
        <div className="space-y-3">
          <p className="text-warm-600 text-center" style={{ fontSize: '13px' }}>
            {capturedPhotos.length} photo{capturedPhotos.length > 1 ? 's' : ''} captured
          </p>

          <div className="grid grid-cols-2 gap-2">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-warm-200">
                <img
                  src={photo.preview}
                  alt={`Fridge ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-coral-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
                <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 text-white rounded text-xs font-bold">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" strokeWidth={2} />
            Analyze Photos ({capturedPhotos.length})
          </Button>
        </div>
      )}
    </div>
  )
}
