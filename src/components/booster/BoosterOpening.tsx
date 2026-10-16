import { useRef, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Crown, ScanLine, Sparkles } from 'lucide-react'
import { StreetCard } from '@/components/cards/StreetCard'
import { getRarityLabel } from '@/lib/utils'
import { useBoosterCarousel } from './use-booster-carousel'
import type { Card, CardStats } from '@/types'

interface BoosterOpeningProps {
  cards: Card[]
  onComplete: () => void
}

const STAT_LABELS: Record<keyof CardStats, string> = {
  alter: 'Alter', flecken: 'Flecken', witterung: 'Witterung', geruch: 'Geruch', kontaminierung: 'Kontamination',
}

const FRACTURE_EDGE = [
  [0, 0], [32, 0], [73, 0], [100, 0], [100, 34], [100, 76],
  [100, 100], [68, 100], [27, 100], [0, 100], [0, 68], [0, 29],
] as const

export function BoosterOpening({ cards, onComplete }: BoosterOpeningProps) {
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const { carouselRef, activeIndex, isCarouselMoving, selectItem } = useBoosterCarousel()
  const pressedCard = useRef<{ index: number; x: number; y: number; selected: boolean } | null>(null)
  const allRevealed = revealed.size === cards.length

  return (
    <div className="booster-opening">
      <div className="booster-reveal-status">
        <span><Sparkles aria-hidden="true" /> DEIN DROP</span>
        <span role="status" aria-live="polite">{revealed.size} / {cards.length} aufgedeckt</span>
      </div>
      <p id="booster-card-instructions" className="sr-only">Wische oder nutze die Pfeiltasten, um eine Karte auszuwählen. Pos1 und Ende wählen die erste und letzte Karte. Tippe die mittige Karte an oder drücke die Eingabetaste, um sie aufzudecken.</p>
      <div ref={carouselRef} className="booster-pack-grid booster-drop-carousel" role="group" aria-label="Erhaltene Karten auswählen">
        {cards.map((card, index) => (
          <div className="booster-pack-slot" key={`${card.id}-${index}`}>
            <button
              type="button"
              className={`booster-option booster-drop-card${index === activeIndex ? ' is-selected' : ''}${revealed.has(index) ? ' is-revealed' : ''}`}
              aria-pressed={index === activeIndex}
              aria-label={revealed.has(index) ? `Karte ${index + 1}: ${card.name}, ${getRarityLabel(card.rarity)}, aufgedeckt. ${card.city}, ${card.country}. ${Object.entries(STAT_LABELS).map(([key, label]) => `${label}: ${card.stats[key as keyof CardStats]}`).join(', ')}` : `Karte ${index + 1}, verdeckt, ${index === activeIndex ? 'zum Aufdecken antippen' : 'auswählen'}`}
              aria-describedby="booster-card-instructions"
              onPointerDown={event => {
                pressedCard.current = { index, x: event.clientX, y: event.clientY, selected: index === activeIndex && !isCarouselMoving }
              }}
              onPointerCancel={() => { pressedCard.current = null }}
              onClick={event => {
                const start = pressedCard.current
                pressedCard.current = null
                if (event.detail > 0 && (!start || start.index !== index || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)) return
                if (index !== activeIndex || (event.detail > 0 && !start?.selected) || isCarouselMoving) selectItem(index)
                else setRevealed(previous => new Set([...previous, index]))
              }}
              onKeyDown={event => {
                const next = event.key === 'ArrowRight' ? Math.min(index + 1, cards.length - 1)
                  : event.key === 'ArrowLeft' ? Math.max(index - 1, 0)
                    : event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : null
                if (next === null) return
                event.preventDefault()
                selectItem(next)
                carouselRef.current?.children[next]?.querySelector('button')?.focus({ preventScroll: true })
              }}
            >
              <span className="booster-card-reveal" aria-hidden="true">
                {revealed.has(index) ? <CardReveal card={card} /> : (
                  <span className="booster-card-back">
                    <CardSleeve />
                    <span className="booster-card-number">{String(index + 1).padStart(2, '0')}</span>
                  </span>
                )}
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="booster-reveal-actions">
        {allRevealed ? (
          <>
            <p><Check aria-hidden="true" /> Alle Karten sind in deiner Demo-Sammlung.</p>
            <Link to="/collection" className="home-cta">Zur Sammlung<ArrowRight aria-hidden="true" /></Link>
            <button className="booster-text-button" onClick={onComplete}>Nächstes Pack wählen<ArrowRight aria-hidden="true" /></button>
          </>
        ) : (
          <p>Wähle eine Karte und tippe sie zum Aufdecken an.</p>
        )}
      </div>
    </div>
  )
}

function CardReveal({ card }: { card: Card }) {
  const [shattering, setShattering] = useState(true)
  const reduceMotion = useReducedMotion()
  const animate = shattering && !reduceMotion

  return (
    <>
      <span
        className={`booster-card-front${animate ? ' is-materializing' : ''}`}
        onAnimationEnd={event => {
          if (event.target === event.currentTarget && event.animationName === 'booster-card-materialize') setShattering(false)
        }}
      ><StreetCard card={card} /></span>
      {animate && (
        <span className="booster-shatter">
          {FRACTURE_EDGE.map((edge, piece) => {
            const next = FRACTURE_EDGE[(piece + 1) % FRACTURE_EDGE.length]
            return (
              <span key={piece} className="booster-shard" style={{
                clipPath: `polygon(52% 48%, ${edge[0]}% ${edge[1]}%, ${next[0]}% ${next[1]}%)`,
                '--shard-x': `${((edge[0] + next[0]) / 2 - 52) * 1.7}%`,
                '--shard-y': `${((edge[1] + next[1]) / 2 - 48) * 1.7}%`,
                '--shard-turn': `${(piece % 2 ? 1 : -1) * (12 + piece * 3)}deg`,
                '--shard-delay': `${piece % 4 * 22}ms`,
              } as CSSProperties}><CardSleeve /></span>
            )
          })}
          <span className="booster-glitch-line" />
        </span>
      )}
    </>
  )
}

function CardSleeve() {
  return (
    <span className="booster-sleeve">
      <span className="booster-sleeve__serial">MQ / STREET ARCHIVE</span>
      <span className="booster-sleeve__emblem"><Crown /><strong>MQ</strong><span>FUNDSTÜCK</span></span>
      <span className="booster-sleeve__tap"><ScanLine /> ZUM AUFDECKEN TIPPEN</span>
    </span>
  )
}
