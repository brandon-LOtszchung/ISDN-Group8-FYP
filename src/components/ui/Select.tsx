import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'input-field appearance-none pr-10',
              error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
