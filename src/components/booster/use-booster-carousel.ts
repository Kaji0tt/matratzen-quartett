import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

function getNearestIndex(carousel: HTMLDivElement) {
  let nearestIndex = 0
  let nearestDistance = Infinity
  Array.from(carousel.children).forEach((slot, index) => {
    if (!(slot instanceof HTMLElement)) return
    const distance = Math.abs(slot.offsetLeft + slot.offsetWidth / 2 - carousel.scrollLeft - carousel.clientWidth / 2)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })
  return nearestIndex
}

export function useBoosterCarousel(enabled = true) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCarouselMoving, setIsCarouselMoving] = useState(false)
  const reduceMotion = useReducedMotion()

  const selectItem = (index: number) => {
    const carousel = carouselRef.current
    const item = carousel?.children[index]
    if (!carousel || !(item instanceof HTMLElement)) return
    const left = item.offsetLeft + item.offsetWidth / 2 - carousel.clientWidth / 2
    if (Math.abs(carousel.scrollLeft - left) > 1) setIsCarouselMoving(true)
    carousel.scrollTo({ left, behavior: reduceMotion ? 'instant' : 'smooth' })
    setActiveIndex(index)
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel || !enabled) return
    let frame: number | null = null
    let settleTimer: number | undefined
    let pointer: { id: number; x: number; y: number; swiping: boolean } | null = null
    const settle = () => {
      window.clearTimeout(settleTimer)
      if (pointer?.swiping) return
      const index = getNearestIndex(carousel)
      const slot = carousel.children[index]
      if (!(slot instanceof HTMLElement)) return
      const distance = slot.offsetLeft + slot.offsetWidth / 2 - carousel.scrollLeft - carousel.clientWidth / 2
      setActiveIndex(index)
      setIsCarouselMoving(Math.abs(distance) > 1)
    }
    const scheduleSettle = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, 180)
    }
    const update = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        setActiveIndex(getNearestIndex(carousel))
      })
    }
    const handleScroll = () => {
      setIsCarouselMoving(true)
      update()
      scheduleSettle()
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, swiping: false }
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return
      const dx = Math.abs(event.clientX - pointer.x)
      const dy = Math.abs(event.clientY - pointer.y)
      if (dx > 8 && dx > dy) {
        pointer.swiping = true
        window.clearTimeout(settleTimer)
        setIsCarouselMoving(true)
      }
    }
    const handlePointerEnd = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return
      pointer = null
      scheduleSettle()
    }
    const observer = new ResizeObserver(update)
    observer.observe(carousel)
    carousel.addEventListener('scroll', handleScroll, { passive: true })
    carousel.addEventListener('scrollend', settle)
    carousel.addEventListener('pointerdown', handlePointerDown, { passive: true })
    carousel.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
    update()
    settle()
    return () => {
      observer.disconnect()
      carousel.removeEventListener('scroll', handleScroll)
      carousel.removeEventListener('scrollend', settle)
      carousel.removeEventListener('pointerdown', handlePointerDown)
      carousel.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
      window.clearTimeout(settleTimer)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [enabled])

  return { carouselRef, activeIndex, setActiveIndex, isCarouselMoving, selectItem }
}
