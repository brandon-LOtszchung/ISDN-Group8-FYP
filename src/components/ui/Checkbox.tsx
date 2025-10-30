import { InputHTMLAttributes, forwardRef } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <div className="flex items-start space-x-3">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              'h-5 w-5 rounded border-2 border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200',
              className
            )}
            {...props}
          />
          {props.checked && (
            <Check className="absolute h-3 w-3 text-white pointer-events-none" />
          )}
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label className="text-sm font-medium text-neutral-900 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
