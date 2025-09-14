"use client"

import { useEffect, useRef, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export interface LightboxItem {
  src: string
  title?: string
  description?: string
}

interface LightboxProps {
  items: LightboxItem[]
  index?: number
  onClose: () => void
}

export default function Lightbox({ items, index = 0, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(index)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const pointersRef = useRef<Map<number, PointerEvent>>(new Map())
  const pinchRef = useRef<{ dist: number; baseScale: number } | null>(null)

  const total = items?.length || 0

  const goPrev = () => setCurrent((c) => (c - 1 + total) % total)
  const goNext = () => setCurrent((c) => (c + 1) % total)

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const currentItem = items[current]

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [current])

  if (!currentItem) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 text-white">
        <div className="text-sm opacity-80">
          {current + 1} / {total}
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image area */}
      <div
        className="relative flex-1 flex items-center justify-center select-none"
        onWheel={(e) => {
          e.preventDefault()
          const dir = e.deltaY > 0 ? -0.15 : 0.15
          setScale((s) => Math.max(1, Math.min(4, s + dir)))
        }}
      >
        <button
          aria-label="Previous"
          onClick={goPrev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <img
          ref={imgRef}
          src={currentItem.src}
          alt={currentItem.title || "Image"}
          className={`max-h-[80vh] max-w-[95vw] object-contain ${scale > 1 ? 'cursor-grab' : ''}`}
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`, transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}
          draggable={false}
          onDoubleClick={() => {
            setScale((s) => (s > 1 ? 1 : 2))
            setOffset({ x: 0, y: 0 })
          }}
          onPointerDown={(e) => {
            ;(e.target as Element).setPointerCapture(e.pointerId)
            pointersRef.current.set(e.pointerId, e)
            if (pointersRef.current.size === 1) {
              setIsPanning(true)
              lastPosRef.current = { x: e.clientX, y: e.clientY }
            } else if (pointersRef.current.size === 2) {
              const [a, b] = Array.from(pointersRef.current.values())
              const dx = a.clientX - b.clientX
              const dy = a.clientY - b.clientY
              const dist = Math.hypot(dx, dy)
              pinchRef.current = { dist, baseScale: scale }
            }
          }}
          onPointerMove={(e) => {
            if (!pointersRef.current.has(e.pointerId)) return
            pointersRef.current.set(e.pointerId, e)
            if (pointersRef.current.size === 2 && pinchRef.current) {
              const [a, b] = Array.from(pointersRef.current.values())
              const dx = a.clientX - b.clientX
              const dy = a.clientY - b.clientY
              const dist = Math.hypot(dx, dy)
              const factor = dist / pinchRef.current.dist
              setScale(() => Math.max(1, Math.min(4, pinchRef.current!.baseScale * factor)))
            } else if (isPanning && scale > 1) {
              const dx = e.clientX - lastPosRef.current.x
              const dy = e.clientY - lastPosRef.current.y
              lastPosRef.current = { x: e.clientX, y: e.clientY }
              setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
            }
          }}
          onPointerUp={(e) => {
            pointersRef.current.delete(e.pointerId)
            if (pointersRef.current.size < 2) pinchRef.current = null
            if (pointersRef.current.size === 0) setIsPanning(false)
          }}
          onPointerCancel={(e) => {
            pointersRef.current.delete(e.pointerId)
            pinchRef.current = null
            setIsPanning(false)
          }}
        />

        <button
          aria-label="Next"
          onClick={goNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Caption */}
      {(currentItem.title || currentItem.description) && (
        <div className="p-4 text-center text-white/90">
          {currentItem.title && <div className="font-semibold">{currentItem.title}</div>}
          {currentItem.description && (
            <div className="text-sm opacity-80 mt-1">{currentItem.description}</div>
          )}
        </div>
      )}
    </div>
  )
}
