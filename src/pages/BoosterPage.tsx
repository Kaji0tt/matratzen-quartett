import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Coins, Crown, Plus, Zap } from 'lucide-react'
import { BoosterOpening } from '@/components/booster/BoosterOpening'
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
type Phase = 'selecting' | 'opening' | 'revealing'

function getNearestPackIndex(carousel: HTMLDivElement) {
  const width = carousel.clientWidth
  const scrollLeft = carousel.scrollLeft
  let nearestIndex = 0
  let nearestDistance = Infinity
  Array.from(carousel.children).forEach((slot, index) => {
    if (!(slot instanceof HTMLElement)) return
    const center = slot.offsetLeft + slot.offsetWidth / 2
    const distance = center - scrollLeft - width / 2
    if (Math.abs(distance) < nearestDistance) {
      nearestDistance = Math.abs(distance)
      nearestIndex = index
    }
  })
  return nearestIndex
}

function RetrowaveScene() {
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
        </svg>
      </div>
    </div>
  )
}

export function BoosterPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isCarouselMoving, setIsCarouselMoving] = useState(false)
  const [phase, setPhase] = useState<Phase>('selecting')
  const [cards, setCards] = useState<Card[]>([])
  const purchaseLock = useRef(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const pullStart = useRef<{ x: number; y: number; pointerId: number; pulling: boolean; maxDistance: number } | null>(null)
  const suppressClick = useRef(false)
  const pressedSelectedPack = useRef(false)
  const { brandRef, wordmarkRef: headingRef } = useFittedWordmark()
  const reduceMotion = useReducedMotion()
  const coins = useDemoGameStore((state) => state.coins)
  const openBooster = useDemoGameStore((state) => state.openBooster)
  const selected = BOOSTERS[activeIndex]
  const canAfford = coins >= selected.price_coins

  const selectPack = (index: number) => {
    const carousel = carouselRef.current
    const item = carousel?.children[index]
    if (!carousel || !(item instanceof HTMLElement)) return
    const left = item.offsetLeft + item.offsetWidth / 2 - carousel.clientWidth / 2
    if (Math.abs(carousel.scrollLeft - left) > 1) setIsCarouselMoving(true)
    carousel.scrollTo({
      left,
      behavior: reduceMotion ? 'instant' : 'smooth',
    })
    setActiveIndex(index)
  }

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
    }
    target.classList.remove('is-pulling')
    stage?.classList.remove('is-pulling')
    stage?.style.removeProperty('--pull-progress')
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
    const carousel = carouselRef.current
    if (!carousel || phase !== 'selecting') return
    let frame: number | null = null
    let settleTimer: number | undefined
    let pointer: { id: number; x: number; y: number; swiping: boolean } | null = null
    const settle = () => {
      window.clearTimeout(settleTimer)
      if (pointer?.swiping) return
      const index = getNearestPackIndex(carousel)
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
        setActiveIndex(getNearestPackIndex(carousel))
      })
    }
    const handleScroll = () => {
      setIsCarouselMoving(true)
      update()
      scheduleSettle()
    }
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, swiping: false }
    }
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return
      const dx = Math.abs(event.clientX - pointer.x)
      const dy = Math.abs(event.clientY - pointer.y)
      if (dx > 8 && dx > dy) {
        pointer.swiping = true
        window.clearTimeout(settleTimer)
        setIsCarouselMoving(true)
      }
    }
    const handlePointerEnd = (event: globalThis.PointerEvent) => {
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
  }, [phase])

  useEffect(() => {
    if (phase !== 'opening') return
    const timer = window.setTimeout(() => setPhase('revealing'), reduceMotion ? 80 : 780)
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

      <section className={`booster-stage booster-stage--${phase}`} aria-label="Booster-Bühne" aria-busy={phase === 'opening'}>
        <RetrowaveScene />
        {phase !== 'revealing' ? (
          <>
            <div className={`booster-snap-overlay booster-tone--${PACK_STYLES[activeIndex]}${isCarouselMoving ? ' is-moving' : ''}`} aria-hidden="true">
              <div className="booster-snap-overlay__pack" />
            </div>
            <div className="booster-floor-line" aria-hidden="true">
              <div className="booster-floor-line__glow" />
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
            {phase === 'opening' && <span className="sr-only" role="status">Pack wird geöffnet</span>}
          </>
        ) : <BoosterOpening cards={cards} onComplete={handleComplete} />}
      </section>
      <div className="booster-back-row">
        <Link to="/" className="booster-back">{'<- Zurück'}</Link>
      </div>
    </div>
  )
}
