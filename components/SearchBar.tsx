'use client'
// components/SearchBar.tsx
import { useState, useRef, useEffect } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  onClear:  () => void
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [value, setValue]     = useState('')
  const [focused, setFocused] = useState(false)
  const timeoutRef            = useRef<NodeJS.Timeout | null>(null)

  // Debounce — busca 400ms después de que el usuario deja de escribir
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (value.trim().length >= 2) {
      timeoutRef.current = setTimeout(() => onSearch(value.trim()), 400)
    } else if (value === '') {
      onClear()
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [value])

  const handleClear = () => {
    setValue('')
    onClear()
  }

  return (
    <div className={`flex items-center gap-2 bg-[#0D1B2A]/90 backdrop-blur border rounded-xl px-3 py-2 transition-colors ${
      focused ? 'border-[#D4A017]/60' : 'border-white/10'
    }`}>
      <span className="text-white/30 text-sm shrink-0">🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar por dirección o nombre..."
        className="bg-transparent text-white text-xs placeholder:text-white/25 outline-none w-full min-w-0"
      />
      {value && (
        <button
          onClick={handleClear}
          className="text-white/30 hover:text-white/70 transition-colors shrink-0 text-base leading-none"
        >
          ×
        </button>
      )}
    </div>
  )
}
