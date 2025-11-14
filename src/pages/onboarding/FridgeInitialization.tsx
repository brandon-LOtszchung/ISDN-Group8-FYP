import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { dataService } from '@/services/dataService'
import { visionService } from '@/services/visionService'
import { inventoryService } from '@/services/database'
import Button from '@/components/ui/Button'
import CameraCapture from '@/components/CameraCapture'
import { InventoryItem } from '@/types'
import { AlertCircle, CheckCircle, Refrigerator, Sparkles, Edit3, Camera, X, Check } from 'lucide-react'

type InitStep = 'instructions' | 'capture' | 'analyzing' | 'review' | 'complete'

const DEFAULT_FAMILY_ID = '00000000-0000-0000-0000-000000000001'

export default function FridgeInitialization() {
  const { setLoading, setError, initializeFridge, setInventory } = useApp()
  const [currentStep, setCurrentStep] = useState<InitStep>('instructions')
  const [detectedItems, setDetectedItems] = useState<InventoryItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePhotosCapture = async (photos: string[]) => {
    setCurrentStep('analyzing')
    setIsProcessing(true)

    try {
      // Analyze photos with OpenAI Vision
      const items = await visionService.analyzeMultiplePhotos(photos)
      setDetectedItems(items)
      setCurrentStep('review')
    } catch (error: any) {
      console.error('Photo analysis failed:', error)
      setError(error.message || 'Failed to analyze photos')
      
      // Fallback to mock data
      const mockInventory = await dataService.getInventory()
      setDetectedItems(mockInventory)
      setCurrentStep('review')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmItems = async () => {
    try {
      setIsProcessing(true)
      setLoading(true)

      // Save all items to Supabase
      for (const item of detectedItems) {
        await inventoryService.addItem(DEFAULT_FAMILY_ID, item)
      }

      // Reload inventory from database
      const updatedInventory = await dataService.getInventory()
      setInventory(updatedInventory)
      
      setCurrentStep('complete')
    } catch (error) {
      console.error('Failed to save inventory:', error)
      setError('Failed to save inventory items')
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  const handleEditQuantity = (index: number, newQuantity: number) => {
    setDetectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item))
    )
  }

  const handleRemoveItem = (index: number) => {
    setDetectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleComplete = () => {
    initializeFridge()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'instructions':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Refrigerator className="w-9 h-9 text-primary-600" strokeWidth={2} />
            </div>
            <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '21px' }}>
              Smart Fridge Setup
            </h1>
            <p className="text-warm-600 mb-6" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Take photos of your fridge contents and let AI identify items automatically
            </p>
            
            <div className="bg-warm-50 rounded-xl p-5 mb-6 text-left">
              <h3 className="font-bold text-warm-900 mb-3" style={{ fontSize: '15px' }}>
                Tips for Best Results:
              </h3>
              <div className="space-y-2" style={{ fontSize: '14px' }}>
                <div className="flex items-start gap-3 text-warm-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: '12px' }}>1</span>
                  <span>Take clear, well-lit photos</span>
                </div>
                <div className="flex items-start gap-3 text-warm-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: '12px' }}>2</span>
                  <span>Capture different shelves/sections</span>
                </div>
                <div className="flex items-start gap-3 text-warm-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: '12px' }}>3</span>
                  <span>Make sure labels are visible</span>
                </div>
                <div className="flex items-start gap-3 text-warm-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold" style={{ fontSize: '12px' }}>4</span>
                  <span>Take 3-5 photos from different angles</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setCurrentStep('capture')} className="w-full">
              Start Photo Capture
            </Button>
          </div>
        )

      case 'capture':
        return (
          <div>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-9 h-9 text-primary-600" strokeWidth={2} />
              </div>
              <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '21px' }}>
                Capture Fridge Photos
              </h1>
              <p className="text-warm-600" style={{ fontSize: '14px' }}>
                Take photos of your fridge contents
              </p>
            </div>

            <CameraCapture onPhotosCapture={handlePhotosCapture} maxPhotos={5} />
          </div>
        )

      case 'analyzing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Sparkles className="w-9 h-9 text-primary-600" strokeWidth={2} />
            </div>
            <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '21px' }}>
              Analyzing Photos...
            </h1>
            <p className="text-warm-600 mb-6" style={{ fontSize: '14px' }}>
              AI is identifying items in your fridge
            </p>
            
            <div className="animate-spin w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full mx-auto"></div>
          </div>
        )

      case 'review':
        return (
          <div>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-fresh-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit3 className="w-9 h-9 text-fresh-600" strokeWidth={2} />
              </div>
              <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '21px' }}>
                Review Detected Items
              </h1>
              <p className="text-warm-600" style={{ fontSize: '14px' }}>
                {detectedItems.length} items found. Review and adjust quantities.
              </p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-primary-700" style={{ fontSize: '13px' }}>
                Review the items and quantities. You can edit or remove items.
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {detectedItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-warm-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-warm-900" style={{ fontSize: '15px' }}>
                        {item.name}
                      </p>
                      <p className="text-warm-600" style={{ fontSize: '12px' }}>
                        {item.category} • {Math.round(item.confidence * 100)}% confident
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-coral-500 hover:text-coral-700"
                    >
                      <X className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleEditQuantity(index, Number(e.target.value))}
                      className="w-20 px-3 py-1.5 border border-warm-300 rounded-lg text-center font-semibold"
                      style={{ fontSize: '14px' }}
                      min="0.1"
                      step="0.1"
                    />
                    <span className="text-warm-600" style={{ fontSize: '14px' }}>{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleConfirmItems}
              className="w-full flex items-center justify-center gap-2"
              isLoading={isProcessing}
              disabled={detectedItems.length === 0}
            >
              <Check className="w-5 h-5" strokeWidth={2} />
              {isProcessing ? 'Saving...' : `Confirm ${detectedItems.length} Items`}
            </Button>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-fresh-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-9 h-9 text-fresh-600" strokeWidth={2} />
            </div>
            <h1 className="font-bold text-warm-900 mb-2" style={{ fontSize: '21px' }}>
              All Set!
            </h1>
            <p className="text-warm-600 mb-6" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {detectedItems.length} items added to your fridge inventory
            </p>
            
            <div className="bg-fresh-50 border border-fresh-200 rounded-xl p-4 mb-6">
              <p className="text-fresh-700" style={{ fontSize: '13px' }}>
                Your smart fridge is ready to use!
              </p>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Start Using App
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg border border-warm-100">
        {renderStep()}
      </div>
    </div>
  )
}
