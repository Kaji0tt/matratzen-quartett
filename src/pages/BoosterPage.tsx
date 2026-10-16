import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Coins, Crown, Plus, Zap } from 'lucide-react'
import { BoosterOpening } from '@/components/booster/BoosterOpening'
import { useBoosterCarousel } from '@/components/booster/use-booster-carousel'
import { PlayingCards } from '@/components/ui/playing-cards'
import { useDemoGameStore } from '@/store/demo-game-store'
import { toast } from '@/hooks/use-toast'
import { useFittedWordmark } from '@/hooks/use-fitted-wordmark'
import type { BoosterPack, Card } from '@/types'

const BOOSTERS: BoosterPack[] = [
  {
    id: '1', name: 'Standard Pack',
    description: 'Dein Einstieg in den Kiez. Fünf Fundstücke, unendlich viel Geschichte.',
    image_url: '', price_coins: 100, card_count: 5,
    rarity_weights: { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 },
    is_available: true, limited_edition: false,
  },
  {
    id: '2', name: 'Premium Pack',
    description: 'Mehr Neon. Mehr Seltenes. Erhöhte Chancen auf die Schätze der Straße.',
    image_url: '', price_coins: 250, card_count: 5,
    rarity_weights: { common: 40, uncommon: 30, rare: 20, epic: 8, legendary: 2 },
    is_available: true, limited_edition: false,
  },
  {
    id: '3', name: 'Mega Pack',
    description: 'Der große Straßenfund. Zehn Karten, davon mindestens eine selten oder besser.',
    image_url: '', price_coins: 400, card_count: 10,
    rarity_weights: { common: 35, uncommon: 30, rare: 25, epic: 8, legendary: 2 },
    is_available: true, limited_edition: false,
  },
  {
    id: '4', name: 'Legendary Pack',
    description: 'Für die Legenden des Kiezes. Mindestens eine epische oder legendäre Karte.',
    image_url: '', price_coins: 1000, card_count: 5,
    rarity_weights: { common: 0, uncommon: 20, rare: 40, epic: 30, legendary: 10 },
    is_available: true, limited_edition: true,
  },
]

const PACK_STYLES = ['cyan', 'violet', 'pink', 'gold'] as const
type Phase = 'selecting' | 'opening' | 'charging' | 'burst' | 'revealing'
const GRID_FLIGHT_MS = 620

function RetrowaveScene({ onHorizonReached }: { onHorizonReached: () => void }) {
  return (
    <div className="booster-retrowave" aria-hidden="true">
      <svg className="booster-retrowave__stars" viewBox="0 0 1000 180" preserveAspectRatio="none">
        <path d="M100 48v10m-5-5h10" />
        <circle cx="205" cy="110" r="1.8" />
        <circle cx="65" cy="145" r="1.5" />
        <path d="M805 78v10m-5-5h10" />
        <circle cx="925" cy="34" r="2" />
        <circle cx="875" cy="145" r="1.5" />
      </svg>
      <div className="booster-retrowave__sun" />
      <svg className="booster-retrowave__skyline" viewBox="0 0 1000 180" preserveAspectRatio="none">
        <path d="M0 180V115H45V85H78V135H120V65H150V45H160V65H185V125H220V95H260V145H310V80H340V25H348V80H375V135H420V110H450V180H550V115H590V135H630V65H655V5H662V65H685V105H725V140H770V80H810V55H835V80H860V125H910V95H950V135H1000V180Z" />
        <g className="booster-retrowave__windows">
          <path d="M128 84h48m-48 12h48m-48 12h48" />
          <path d="M336 99h30m-30 12h30" />
          <path d="M633 83h40m-40 12h40m-40 12h40" />
          <path d="M788 99h44m-44 12h44" />
        </g>
      </svg>
      <div className="booster-retrowave__floor">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none">
          {Array.from({ length: 21 }, (_, index) => (
            <path key={`ray-${index}`} d={`M${440 + index * 6} 0L${-1500 + index * 200} 400`} />
          ))}
          {[0, 7, 18, 35, 60, 96, 146, 214, 302, 399].map(y => <path key={y} d={`M0 ${y}H1000`} />)}
          <g className="booster-retrowave__impulses">
            {[8, 9, 11, 12].map((ray, index) => (
              <path
                key={ray}
                d={`M${-1500 + ray * 200} 400L${440 + ray * 6} 0`}
                pathLength="100"
                style={{ animationDelay: `${-index * 1.9}s`, animationDuration: `${7 + index * .8}s` }}
              />
            ))}
          </g>
          <g
            className="booster-retrowave__opening-impulses"
            onAnimationEnd={event => {
              if (event.animationName === 'booster-grid-opening-impulse' && event.target === event.currentTarget.firstElementChild) onHorizonReached()
            }}
          >
            {Array.from({ length: 21 }, (_, ray) => (
              <path
                key={ray}
                d={`M${-1500 + ray * 200} 400L${440 + ray * 6} 0`}
                pathLength="100"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}

export function BoosterPage() {
  const [phase, setPhase] = useState<Phase>('selecting')
  const { carouselRef, activeIndex, setActiveIndex, isCarouselMoving, selectItem: selectPack } = useBoosterCarousel(phase === 'selecting')
  const [cards, setCards] = useState<Card[]>([])
  const purchaseLock = useRef(false)
  const pullStart = useRef<{ x: number; y: number; pointerId: number; pulling: boolean; maxDistance: number } | null>(null)
  const suppressClick = useRef(false)
  const pressedSelectedPack = useRef(false)
  const { brandRef, wordmarkRef: headingRef } = useFittedWordmark()
  const reduceMotion = useReducedMotion()
  const coins = useDemoGameStore((state) => state.coins)
  const openBooster = useDemoGameStore((state) => state.openBooster)
  const selected = BOOSTERS[activeIndex]
  const canAfford = coins >= selected.price_coins

  const handlePullStart = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    suppressClick.current = false
    pressedSelectedPack.current = index === activeIndex
    if (index !== activeIndex || phase !== 'selecting' || !canAfford || !selected.is_available || !event.isPrimary || event.button !== 0) return
    const slotGap = Number.parseFloat(getComputedStyle(event.currentTarget).getPropertyValue('--slot-gap'))
    pullStart.current = {
      x: event.clientX, y: event.clientY, pointerId: event.pointerId, pulling: false,
      maxDistance: event.currentTarget.offsetHeight + slotGap + 8,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const resetPull = (target: HTMLButtonElement) => {
    pullStart.current = null
    const stage = target.closest<HTMLElement>('.booster-stage')
    if (!purchaseLock.current) {
      target.style.removeProperty('--pack-pull')
      stage?.style.removeProperty('--snap-pull')
      stage?.style.removeProperty('--pull-progress')
    }
    target.classList.remove('is-pulling')
    stage?.classList.remove('is-pulling')
  }

  const handlePullMove = (event: PointerEvent<HTMLButtonElement>) => {
    const start = pullStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.pulling) {
      if (Math.hypot(dx, dy) <= 8) return
      if (Math.abs(dx) >= Math.abs(dy) || dy <= 0) {
        suppressClick.current = true
        resetPull(event.currentTarget)
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        return
      }
      start.pulling = true
    }
    const distance = Math.max(0, Math.min(start.maxDistance, dy))
    event.currentTarget.style.setProperty('--pack-pull', `${distance}px`)
    event.currentTarget.classList.toggle('is-pulling', distance > 8)
    const stage = event.currentTarget.closest<HTMLElement>('.booster-stage')
    stage?.style.setProperty('--snap-pull', `${distance}px`)
    stage?.style.setProperty('--pull-progress', `${distance / start.maxDistance}`)
    stage?.classList.toggle('is-pulling', distance > 8)
  }

  const handlePullEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const start = pullStart.current
    if (!start || start.pointerId !== event.pointerId) return
    suppressClick.current = Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
    if (start.pulling && event.clientY - start.y >= 72 && Math.abs(event.clientX - start.x) < 45) handleOpen()
    resetPull(event.currentTarget)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  useEffect(() => {
    if (phase !== 'opening' && phase !== 'charging' && phase !== 'burst') return
    const nextPhase = phase === 'opening' ? 'charging' : phase === 'charging' ? 'burst' : 'revealing'
    // Animation completion drives the impact; keep a timeout if motion is disabled mid-flight.
    const duration = reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 40 : phase === 'opening' ? 180 : phase === 'charging' ? GRID_FLIGHT_MS + 100 : 560
    const timer = window.setTimeout(() => setPhase(nextPhase), duration)
    return () => window.clearTimeout(timer)
  }, [phase, reduceMotion])

  useEffect(() => {
    if (phase === 'revealing') headingRef.current?.focus()
  }, [phase, headingRef])

  const handleOpen = () => {
    if (purchaseLock.current) return
    purchaseLock.current = true
    try {
      const received = openBooster(selected, globalThis.crypto.randomUUID())
      setCards(received)
      setPhase('opening')
    } catch (error) {
      purchaseLock.current = false
      console.error('Failed to open booster:', error)
      toast({
        title: 'Booster konnte nicht geöffnet werden',
        description: error instanceof Error ? error.message : 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    }
  }

  const handleComplete = () => {
    setActiveIndex(0)
    setPhase('selecting')
    setCards([])
    purchaseLock.current = false
    toast({ title: `${cards.length} Karten sind in deiner Demo-Sammlung!` })
    window.requestAnimationFrame(() => carouselRef.current?.querySelector<HTMLButtonElement>('button')?.focus())
  }

  return (
    <div className="booster-screen">
      <header className="home-header booster-header">
        <div className="home-brand" ref={brandRef}>
          <h1 className="home-wordmark" ref={headingRef} tabIndex={-1} aria-label="Frisch von der Straße">
            <Crown aria-hidden="true" />
            <span className="home-wordmark__first">Frisch<span className="home-subline">Neue Ware</span></span>{' '}
            <span>von der Straße</span>
          </h1>
        </div>
        <Link to="/shop" className="home-wallet booster-wallet" aria-label="Zum Demo-Münzen-Shop">
          <Coins aria-hidden="true" />
          <span role="status" aria-label={`Demo-Münzen: ${coins}`}>
            {coins.toLocaleString('de-DE')}
          </span>
          <Plus aria-hidden="true" className="home-wallet__plus" />
        </Link>
      </header>

      <section
        className={`booster-stage booster-stage--${phase}`}
        style={{ '--grid-flight': `${GRID_FLIGHT_MS}ms` } as CSSProperties}
        aria-label="Booster-Bühne"
        aria-busy={phase !== 'selecting' && phase !== 'revealing'}
      >
        <RetrowaveScene onHorizonReached={() => setPhase(previous => previous === 'charging' ? 'burst' : previous)} />
        {phase !== 'revealing' ? (
          <>
            <div className={`booster-snap-overlay booster-tone--${PACK_STYLES[activeIndex]}${isCarouselMoving ? ' is-moving' : ''}`} aria-hidden="true">
              <div className="booster-snap-overlay__pack" />
            </div>
            <div className="booster-floor-line" aria-hidden="true">
              <div className="booster-floor-line__glow" />
              {Array.from({ length: 7 }, (_, index) => (
                <span className="booster-floor-line__ray" key={index} />
              ))}
            </div>
            <p id="booster-instructions" className="sr-only">Wische oder nutze die Pfeiltasten, um ein Pack auszuwählen. Tippe das mittige Pack erneut an oder ziehe es nach unten zur violett leuchtenden Grid-Linie, um es zum aufgedruckten Preis zu öffnen. Die Drop-Gewichte pro zufälliger Karte stehen in der Pack-Beschreibung.</p>
            <div ref={carouselRef} className="booster-pack-grid" role="group" aria-label="Booster-Pack auswählen">
              {BOOSTERS.map((pack, index) => (
                <div className="booster-pack-slot" key={pack.id}>
                  <button
                    type="button"
                    className={`booster-option booster-tone--${PACK_STYLES[index]}${index === activeIndex ? ' is-selected' : ''}${index === activeIndex && canAfford && pack.is_available && phase === 'selecting' ? ' is-pullable' : ''}`}
                    aria-pressed={index === activeIndex}
                    aria-label={`${pack.name}, ${pack.card_count} Karten, ${pack.price_coins} Demo-Münzen${index === activeIndex ? ', zum Öffnen antippen' : ', auswählen'}`}
                    aria-describedby={`booster-instructions booster-details-${pack.id}`}
                    disabled={phase !== 'selecting'}
                    onClick={event => {
                      if (suppressClick.current) {
                        suppressClick.current = false
                        return
                      }
                      if (index !== activeIndex || (event.detail > 0 && !pressedSelectedPack.current)) selectPack(index)
                      else if (!canAfford) toast({ title: 'Nicht genug Demo-Münzen', description: `Dir fehlen ${selected.price_coins - coins} Demo-Münzen. Du kannst sie über das Guthaben im Header aufladen.`, variant: 'destructive' })
                      else if (selected.is_available) handleOpen()
                      else toast({ title: 'Dieses Pack ist aktuell nicht verfügbar.', variant: 'destructive' })
                    }}
                    onKeyDown={event => {
                      const next = event.key === 'ArrowRight' ? Math.min(index + 1, BOOSTERS.length - 1)
                        : event.key === 'ArrowLeft' ? Math.max(index - 1, 0)
                          : event.key === 'Home' ? 0 : event.key === 'End' ? BOOSTERS.length - 1 : null
                      if (next === null) return
                      event.preventDefault()
                      selectPack(next)
                      carouselRef.current?.children[next]?.querySelector('button')?.focus({ preventScroll: true })
                    }}
                    onPointerDown={event => handlePullStart(event, index)}
                    onPointerMove={handlePullMove}
                    onPointerUp={handlePullEnd}
                    onPointerCancel={event => {
                      suppressClick.current = true
                      resetPull(event.currentTarget)
                    }}
                    onLostPointerCapture={event => resetPull(event.currentTarget)}
                  >
                    <span className="booster-foil" aria-hidden="true">
                      <span className="booster-foil__seam" />
                      <span className="booster-foil__brand"><Crown /><span>MATRATZEN</span><strong>QUARTETT</strong></span>
                      <span className="booster-foil__art"><PlayingCards /><Zap /></span>
                      <span className="booster-foil__edition">{pack.name.replace(' Pack', '').toUpperCase()}<small>STREET FINDS / SERIES 01</small></span>
                      <span className="booster-foil__count">{pack.card_count} KARTEN <span>///</span> <Coins /> {pack.price_coins.toLocaleString('de-DE')}</span>
                      <span className="booster-foil__seam booster-foil__seam--bottom" />
                    </span>
                  </button>
                  <span id={`booster-details-${pack.id}`} className="sr-only">{pack.description} Drop-Gewichte: Common {pack.rarity_weights.common}, Uncommon {pack.rarity_weights.uncommon}, Rare {pack.rarity_weights.rare}, Epic {pack.rarity_weights.epic}, Legendary {pack.rarity_weights.legendary} Prozent. Garantiekarten werden innerhalb der garantierten Seltenheiten nach denselben Gewichten gezogen.</span>
                </div>
              ))}
            </div>
            {phase !== 'selecting' && <span className="sr-only" role="status">Pack wird geöffnet</span>}
          </>
        ) : <BoosterOpening cards={cards} onComplete={handleComplete} />}
      </section>
      <div className="booster-back-row">
        <Link to="/" className="booster-back">{'<- Zurück'}</Link>
      </div>
    </div>
  )
}
