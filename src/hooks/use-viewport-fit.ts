import { useLayoutEffect, useRef, useState } from 'react'

export function useViewportFit() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const fit = () => {
      const padding = Number.parseFloat(getComputedStyle(viewport).paddingBottom)
      const availableHeight = viewport.clientHeight - padding
      if (availableHeight <= 0 || content.offsetHeight <= 0) return
      // Layout dimensions stay unscaled; allow one pixel for rounding.
      setScale(Math.min(1, availableHeight / (content.offsetHeight + 1)))
    }
    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    observer.observe(content)
    fit()
    return () => observer.disconnect()
  }, [])

  return { viewportRef, contentRef, scale }
}
