import { useLayoutEffect, useRef } from 'react'

export function useFittedWordmark(maxFontSize?: number) {
  const brandRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const brand = brandRef.current
    const wordmark = wordmarkRef.current
    if (!brand || !wordmark) return
    let active = true
    let previousWidth = -1

    const fitWordmark = () => {
      if (!active || brand.clientWidth === 0) return
      const availableWidth = brand.clientWidth - 2
      const scale = brand.getBoundingClientRect().width / brand.offsetWidth
      wordmark.style.fontSize = '100px'
      for (let pass = 0; pass < 3; pass++) {
        const size = Number.parseFloat(wordmark.style.fontSize)
        wordmark.style.fontSize = `${size * availableWidth * scale / wordmark.getBoundingClientRect().width}px`
      }
      if (maxFontSize !== undefined && Number.parseFloat(wordmark.style.fontSize) > maxFontSize) {
        wordmark.style.fontSize = `${maxFontSize}px`
      }
    }
    const observer = new ResizeObserver(() => {
      if (brand.clientWidth === previousWidth) return
      previousWidth = brand.clientWidth
      fitWordmark()
    })
    observer.observe(brand)
    fitWordmark()
    void document.fonts.ready.then(fitWordmark)
    document.fonts.addEventListener('loadingdone', fitWordmark)
    return () => {
      active = false
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', fitWordmark)
    }
  }, [maxFontSize])

  return { brandRef, wordmarkRef }
}
