import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Crown, MapPin, ScanLine, Sparkles } from 'lucide-react'
import { getRarityLabel } from '@/lib/utils'
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
  const [revealAll, setRevealAll] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const completeRef = useRef<HTMLButtonElement>(null)
  const allRevealed = revealed.size === cards.length

  useEffect(() => {
    if (allRevealed) completeRef.current?.focus()
  }, [allRevealed])

  return (
    <div className="booster-opening">
      <div className="booster-reveal-status">
        <span><Sparkles aria-hidden="true" /> DEIN DROP</span>
        <span role="status" aria-live="polite">{revealed.size} / {cards.length} aufgedeckt</span>
      </div>
      <div className="booster-card-grid">
        {cards.map((card, index) => (
          <ShatterCard key={card.id} card={card} index={index} revealAll={revealAll} onRevealed={() => setRevealed(previous => new Set([...previous, index]))} />
        ))}
      </div>
      <div className="booster-reveal-actions">
        {allRevealed ? (
          <>
            <p><Check aria-hidden="true" /> Alle Karten sind in deiner Demo-Sammlung.</p>
            <Link to="/collection" className="home-cta">Zur Sammlung<ArrowRight aria-hidden="true" /></Link>
            <button ref={completeRef} className="booster-text-button" onClick={onComplete}>Nächstes Pack wählen<ArrowRight aria-hidden="true" /></button>
          </>
        ) : (
          <button className="booster-text-button" onClick={() => setRevealAll(true)} disabled={revealAll}><ScanLine aria-hidden="true" />{revealAll ? 'Karten werden aufgedeckt …' : 'Alle Karten aufdecken'}</button>
        )}
      </div>
    </div>
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

function ShatterCard({ card, index, revealAll, onRevealed }: { card: Card; index: number; revealAll: boolean; onRevealed: () => void }) {
  const [phase, setPhase] = useState<'covered' | 'shattering' | 'revealed'>('covered')
  const reduceMotion = useReducedMotion()
  const onRevealedRef = useRef(onRevealed)
  onRevealedRef.current = onRevealed

  useEffect(() => {
    if (!revealAll || phase !== 'covered') return
    const timer = window.setTimeout(() => setPhase('shattering'), reduceMotion ? 0 : index * 110)
    return () => window.clearTimeout(timer)
  }, [revealAll, phase, index, reduceMotion])

  useEffect(() => {
    if (phase !== 'shattering') return
    const timer = window.setTimeout(() => {
      setPhase('revealed')
      onRevealedRef.current()
    }, reduceMotion ? 40 : 700)
    return () => window.clearTimeout(timer)
  }, [phase, reduceMotion])

  return (
    <div className={`booster-card-slot booster-card-slot--${phase}`} style={{ '--card-delay': `${index * 65}ms` } as CSSProperties}>
      {phase !== 'covered' && <div className="booster-card-front" aria-hidden={phase !== 'revealed'}><StreetCard card={card} /></div>}
      {phase === 'covered' && (
        <button className="booster-covered-card" onClick={() => setPhase('shattering')} aria-label={`Karte ${index + 1} aufdecken`}>
          <CardSleeve />
          <span className="booster-card-number">{String(index + 1).padStart(2, '0')}</span>
        </button>
      )}
      {phase === 'shattering' && (
        <div className="booster-shatter" aria-hidden="true">
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
        </div>
      )}
    </div>
  )
}

function StreetCard({ card }: { card: Card }) {
  return (
    <article className={`street-card street-card--${card.rarity}`} aria-label={`${card.name}, ${getRarityLabel(card.rarity)}`}>
      <div className="street-card__image">
        <img src={card.image_url || '/art/street-mattress.svg'} alt={card.image_url ? card.name : 'Illustrierte Straßenmatratze als Beispielmotiv'} />
        <span className="street-card__topline"><Crown /><span>MQ / STREET FINDS</span><Crown /></span>
        <span className="street-card__rarity">{getRarityLabel(card.rarity)}</span>
        {!card.image_url && <span className="street-card__sample">DEMO ART</span>}
      </div>
      <div className="street-card__info">
        <h2>{card.name}</h2>
        <p><MapPin aria-hidden="true" />{card.city}<span> / {card.country}</span></p>
        <dl>{Object.entries(STAT_LABELS).map(([key, label]) => {
          const value = card.stats[key as keyof CardStats]
          return <div key={key}><dt>{label}</dt><dd><span className="street-card__meter" aria-hidden="true"><i style={{ width: `${value}%` }} /></span><b>{value}</b></dd></div>
        })}</dl>
      </div>
      <footer className="street-card__footer"><span>MATRATZEN QUARTETT</span><span>{card.edition_number ? `#${card.edition_number}/${card.total_editions ?? '–'}` : 'VOL. 01'}</span></footer>
    </article>
  )
}
