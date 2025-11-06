import React, { useState, useRef, useEffect } from 'react'
import Button from './Button'

type DropdownButtonProps = {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  items: string[]
  onSelect: (item: string) => void
  children?: React.ReactNode
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  items,
  onSelect,
  children,
}) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      ref={containerRef}
    >
      <Button
        className={className}
        variant={variant}
        size={size}
        style={{ margin: 0 }}
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </Button>
      {open && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            background: 'white',
            border: '1px solid #ccc',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            zIndex: 100,
          }}
        >
          {items.map((item) => (
            <li
              key={item}
              style={{ padding: '8px', cursor: 'pointer' }}
              onClick={() => {
                onSelect(item)
                setOpen(false)
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DropdownButton
