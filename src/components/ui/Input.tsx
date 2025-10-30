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
          <label className="block text-sm font-medium text-warm-700 mb-2 font-chinese">
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
          <p className="mt-1 text-sm text-coral-600 font-chinese">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-warm-500 font-chinese">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
