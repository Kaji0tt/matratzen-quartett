import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { applyCardStatModifiers } from '@/lib/card-condition'
import { StreetCard } from './StreetCard'
import type { Card } from '@/types'

export interface CollectionCarouselSlide {
  id: string
  card: Card
  owned: boolean
  copyNumber?: number
  copyTotal?: number
}

function slideLabel(slide: CollectionCarouselSlide): string {
  return slide.copyNumber && slide.copyTotal
    ? `${slide.card.name}, Exemplar ${slide.copyNumber} von ${slide.copyTotal}`
    : slide.card.name
}

export function CardDetailModal({ slides, onClose }: {
  slides: CollectionCarouselSlide[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const [opening, setOpening] = useState(true)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [direction, setDirection] = useState(1)
  const transitionTarget = useRef<string | null>(null)
  const reducedMotion = useReducedMotion()
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  useEffect(() => {
    const timeout = window.setTimeout(() => setOpening(false), 650)
    return () => window.clearTimeout(timeout)
  }, [])
  useEffect(() => {
    const timeout = window.setTimeout(() => { transitionTarget.current = null }, reducedMotion ? 0 : 650)
    return () => window.clearTimeout(timeout)
  }, [index, reducedMotion])
  const activeIndex = Math.max(0, Math.min(index, slides.length - 1))
  const activeSlide = slides[activeIndex]
  const effectiveStats = activeSlide
    ? applyCardStatModifiers(activeSlide.card.stats, activeSlide.card.stat_modifiers)
    : null
  const totalPoints = effectiveStats
    ? Object.values(effectiveStats).reduce((total, value) => total + value, 0)
    : 0

  if (!activeSlide) return null

  const move = (offset: number) => {
    if (transitionTarget.current) return
    const nextIndex = Math.max(0, Math.min(activeIndex + offset, slides.length - 1))
    if (nextIndex === activeIndex) return
    setDirection(offset)
    transitionTarget.current = slides[nextIndex].id
    setIndex(nextIndex)
  }
  const resetSwipe = () => {
    swipeStart.current = null
    setDragging(false)
    setSwipeOffset(0)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) return
    if (event.key === 'ArrowLeft' && activeIndex > 0) {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'ArrowRight' && activeIndex < slides.length - 1) {
      event.preventDefault()
      move(1)
    }
  }
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (transitionTarget.current) return
    if (!event.isPrimary || event.button !== 0) {
      resetSwipe()
      return
    }
    suppressClick.current = false
    swipeStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current
    resetSwipe()
    if (!start || start.id !== event.pointerId) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return
    suppressClick.current = true
    move(deltaX < 0 ? 1 : -1)
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="street-card-dialog" onKeyDown={handleKeyDown}
        onEscapeKeyDown={(event) => {
          if (event.target instanceof Element && event.target.closest('.street-card__stat-inspect[aria-expanded="true"], .street-card__grade-trigger[aria-expanded="true"]')) {
            event.preventDefault()
          }
        }}>
        <DialogTitle className="sr-only">{activeSlide.card.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {activeSlide.copyNumber
            ? `Exemplar ${activeSlide.copyNumber} von ${activeSlide.copyTotal}. ${activeSlide.card.description}`
            : activeSlide.card.description}
        </DialogDescription>
        <div className={`collection-carousel${opening ? ' collection-carousel--opening' : ''}`}>
          <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div key={activeSlide.id}
            className={`collection-detail-card${dragging ? ' collection-detail-card--dragging' : ''}`}
            custom={direction}
            initial="enter"
            animate={{ x: reducedMotion ? 0 : swipeOffset, rotate: reducedMotion ? 0 : swipeOffset / 24 }}
            exit="exit"
            variants={{
              enter: (travel: number) => ({ x: reducedMotion ? 0 : travel * window.innerWidth, rotate: reducedMotion ? 0 : travel * 4 }),
              exit: (travel: number) => ({
                x: reducedMotion ? 0 : -travel * window.innerWidth,
                rotate: reducedMotion ? 0 : -travel * 4,
                transition: { duration: reducedMotion ? 0 : .2, ease: 'easeIn' },
              }),
            }}
            transition={reducedMotion || dragging
              ? { duration: 0 }
              : { type: 'spring', duration: .4, bounce: .12 }}
            onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
            onPointerMove={(event) => {
              const start = swipeStart.current
              if (!start || start.id !== event.pointerId) return
              const deltaX = event.clientX - start.x
              const deltaY = event.clientY - start.y
              if (Math.abs(deltaX) >= 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
                const atEnd = deltaX > 0 ? activeIndex === 0 : activeIndex === slides.length - 1
                setDragging(true)
                setSwipeOffset(Math.tanh(deltaX / 120) * (atEnd ? 10 : 28))
                event.currentTarget.setPointerCapture(event.pointerId)
              } else if (!dragging) {
                setSwipeOffset(0)
              }
            }}
            onPointerCancel={resetSwipe}
            onLostPointerCapture={(event) => {
              if (event.target === event.currentTarget) resetSwipe()
            }}
            onDragStart={(event) => event.preventDefault()}
            onClickCapture={(event) => {
              if (suppressClick.current) {
                event.preventDefault()
                event.stopPropagation()
                suppressClick.current = false
              }
            }}>
            <StreetCard key={activeSlide.id} card={activeSlide.card} owned={activeSlide.owned} detailed />
          </motion.div>
          </AnimatePresence>
          {activeIndex > 0 && (
            <button
              type="button"
              className="collection-carousel__nav collection-carousel__nav--next"
              aria-label={`Vorheriges Exemplar: ${slideLabel(slides[activeIndex - 1])}`}
              onClick={() => move(-1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          )}
          {activeIndex < slides.length - 1 && (
            <button
              type="button"
              className="collection-carousel__nav collection-carousel__nav--previous"
              aria-label={`Nächstes Exemplar: ${slideLabel(slides[activeIndex + 1])}`}
              onClick={() => move(1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
          )}
          <div className="collection-carousel__position" aria-live="polite" aria-atomic="true">
            {activeSlide.copyNumber && <span>Exemplar {activeSlide.copyNumber} von {activeSlide.copyTotal}</span>}
            <span className="collection-carousel__score">Gesamtpunkte <strong>{totalPoints}</strong></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
