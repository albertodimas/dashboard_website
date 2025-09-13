"use client"

import { useEffect, RefObject } from 'react'

// Focus the first text-like input inside the given container whenever `enabled` is true.
// Text-like inputs include: text, email, url, search, password, number and textarea.
export function useAutoFocusFirstInput(enabled: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!enabled) return
    const node = containerRef.current || (typeof document !== 'undefined' ? (document.body as HTMLElement) : null)
    if (!node) return
    const selector = 'input[type="text"],input[type="email"],input[type="url"],input[type="search"],input[type="password"],input[type="number"],textarea'
    const focus = () => {
      const target = node.querySelector(selector) as HTMLElement | null
      if (target) {
        // Use rAF to ensure the element is visible/mounted (e.g., after modal animates in)
        requestAnimationFrame(() => {
          try { target.focus() } catch {}
        })
      }
    }
    focus()
  }, [enabled, containerRef])
}

