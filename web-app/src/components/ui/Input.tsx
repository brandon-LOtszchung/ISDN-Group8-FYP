import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-bold text-warm-700 mb-2" style={{ fontSize: '14px' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'input-field',
            error && 'border-coral-500 focus:border-coral-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-coral-600" style={{ fontSize: '13px' }}>{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-warm-500" style={{ fontSize: '13px' }}>{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
