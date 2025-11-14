import { useState, useRef } from 'react'
import { Camera, X, Check } from 'lucide-react'
import Button from './ui/Button'

interface CameraCaptureProps {
  onPhotosCapture: (photos: string[]) => void
  maxPhotos?: number
}

export default function CameraCapture({ onPhotosCapture, maxPhotos = 5 }: CameraCaptureProps) {
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return
    if (capturedPhotos.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    const newPhotos: string[] = []

    for (const file of files) {
      if (capturedPhotos.length + newPhotos.length >= maxPhotos) break

      try {
        const base64 = await fileToBase64(file)
        newPhotos.push(base64)
      } catch (error) {
        console.error('Failed to process photo:', error)
      }
    }

    setCapturedPhotos((prev) => [...prev, ...newPhotos])
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just base64
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (capturedPhotos.length === 0) {
      alert('Please capture at least one photo')
      return
    }
    onPhotosCapture(capturedPhotos)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Capture Button */}
      {capturedPhotos.length < maxPhotos && (
        <Button
          onClick={triggerFileInput}
          className="w-full flex items-center justify-center gap-2"
          variant="secondary"
        >
          <Camera className="w-5 h-5" strokeWidth={2} />
          Take Photo {capturedPhotos.length > 0 && `(${capturedPhotos.length}/${maxPhotos})`}
        </Button>
      )}

      {/* Photo Previews */}
      {capturedPhotos.length > 0 && (
        <div className="space-y-3">
          <p className="text-warm-600 text-center" style={{ fontSize: '13px' }}>
            {capturedPhotos.length} photo{capturedPhotos.length > 1 ? 's' : ''} captured
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-warm-200">
                <img
                  src={`data:image/jpeg;base64,${photo}`}
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

