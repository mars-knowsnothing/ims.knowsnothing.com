'use client'

import React, { useEffect, useMemo, useState } from 'react'

interface MatrixRainProps {
  className?: string
}

export default function MatrixRain({ className = '' }: MatrixRainProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const characters = useMemo(() => {
    // Matrix characters including Japanese katakana and numbers
    return 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }, [])

  const drops = useMemo(() => {
    if (!mounted) return []

    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      char: characters[Math.floor(Math.random() * characters.length)],
    }))
  }, [characters, mounted])

  if (!mounted) {
    return (
      <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute text-green-400 font-mono text-sm animate-pulse"
          style={{
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            opacity: drop.opacity,
            animationDelay: `${drop.id * 0.1}s`,
            animationDuration: `${2 + (drop.id % 3)}s`,
          }}
        >
          {drop.char}
        </div>
      ))}

      {/* Gradient overlay for fade effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </div>
  )
}