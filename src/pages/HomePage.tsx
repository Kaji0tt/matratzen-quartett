import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Coins, Crown, Plus, Swords } from 'lucide-react'
import { AccountMenu } from '@/components/layout/AccountMenu'
import { PlayingCards } from '@/components/ui/playing-cards'
import { useAuthStore } from '@/store/auth-store'
import { useDemoGameStore } from '@/store/demo-game-store'

function PreviewCard({ variant = 'purple' }: { variant?: 'purple' | 'blue' | 'gold' }) {
  return (
    <div className={`home-preview-card home-preview-card--${variant}`}>
      <div className="home-preview-card__corners"><Crown /><Crown /></div>
      <img src="/art/street-mattress.svg" alt="" />
      <span className="home-preview-card__rarity">{variant === 'gold' ? 'LEGENDÄR' : 'SELTEN'}</span>
    </div>
  )
}

export function HomePage() {
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)
  const demoCoins = useDemoGameStore((state) => state.coins)
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
      wordmark.style.fontSize = '100px'
      for (let pass = 0; pass < 3; pass++) {
        const size = Number.parseFloat(wordmark.style.fontSize)
        wordmark.style.fontSize = `${size * availableWidth / wordmark.getBoundingClientRect().width}px`
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
  }, [])

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="home-brand" ref={brandRef}>
          <h1 className="home-wordmark" ref={wordmarkRef} aria-label="Matratzen Quartett">
            <Crown aria-hidden="true" />
            <span className="home-wordmark__first">MATRATZEN<span className="home-subline">MATTRESS MATTERS</span></span>{' '}
            <span>QUARTETT</span>
          </h1>
        </div>
        <section className="home-profile" aria-label="Profilbereich">
          <div className="home-account"><AccountMenu /></div>
          <Link to="/shop" className="home-wallet" aria-label="Zum Demo-Münzen-Shop">
            <Coins aria-hidden="true" />
            <span role="status" aria-label={isLoading ? 'Kontostand wird geladen' : `${profile ? 'Münzen' : 'Demo-Münzen'}: ${profile?.coins ?? demoCoins}`}>
              {isLoading ? '…' : (profile?.coins ?? demoCoins).toLocaleString('de-DE')}
            </span>
            <Plus aria-hidden="true" className="home-wallet__plus" />
          </Link>
        </section>
      </header>

      <div className="home-actions">
      <section className="home-panel home-hero" aria-labelledby="submit-heading">
        <div className="home-hero__skyline" aria-hidden="true" />
        <div className="home-panel__content">
          <span className="home-brush-label">EINREICHEN</span>
          <h2 id="submit-heading" className="home-hero__title">Dein Fund.<br /><span>Deine Karte.</span></h2>
          <Link to="/submit" className="home-cta"><Plus aria-hidden="true" />Matratze einreichen</Link>
        </div>
        <div className="home-hero__art" aria-hidden="true">
          <span className="home-art-orbit" />
          <PreviewCard />
          <span className="home-spark home-spark--one" />
          <span className="home-spark home-spark--two" />
        </div>
      </section>

      <section className="home-panel home-duel" aria-label="Training">
        <Swords className="home-duel__icon" aria-hidden="true" />
        <div className="home-panel__content">
          <span className="home-brush-label home-brush-label--small">TRAINING</span>
          <Link to="/training" className="home-cta" aria-label="Jetzt spielen – Training gegen simulierten Gegner">Jetzt spielen<ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="home-duel__art" aria-hidden="true">
          <span className="home-duel__slash" />
          <div className="home-duel__back-card"><PreviewCard variant="blue" /></div>
          <PreviewCard />
          <span className="home-duel__vs">VS</span>
        </div>
      </section>
      </div>

      <div className="home-discover">
        <Link to="/collection" className="home-panel home-collection">
          <div className="home-collection__cards" aria-hidden="true">
            <PreviewCard variant="blue" /><PreviewCard variant="gold" /><PreviewCard />
          </div>
          <span className="home-cta">Sammlung ansehen<ArrowRight aria-hidden="true" /></span>
        </Link>

        <Link to="/boosters" className="home-panel home-boosters">
          <div className="home-booster-window" aria-hidden="true">
          <div className="home-booster-art">
            <span className="home-booster-art__halo" />
            <div className="home-booster-pack">
              <div className="home-booster-pack__brand"><Crown /><span>MATRATZEN</span><strong>QUARTETT</strong></div>
              <PlayingCards className="home-booster-pack__cards" />
              <span className="home-booster-pack__label">5 KARTEN · 1 PACK</span>
            </div>
          </div>
          </div>
          <span className="home-cta">Booster entdecken<ArrowRight aria-hidden="true" /></span>
        </Link>
      </div>
    </div>
  )
}
