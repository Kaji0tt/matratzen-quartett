import { Link } from 'react-router-dom'
import { Coins, Crown, Plus } from 'lucide-react'
import { useFittedWordmark } from '@/hooks/use-fitted-wordmark'

export function StreetPageHeader({ first, accent, subtitle, coins }: {
  first: string
  accent: string
  subtitle?: string
  coins?: number
}) {
  const { brandRef, wordmarkRef } = useFittedWordmark(64)

  return (
    <header className={`street-header${subtitle ? ' street-header--with-subtitle' : ''}`}>
      <div className="street-header__brand" ref={brandRef}>
        <h1 className="home-wordmark" ref={wordmarkRef} aria-label={`${first} ${accent}`}>
          <Crown aria-hidden="true" />
          <span className="street-header__first">{first}
            {subtitle && <span className="street-header__subtitle" aria-hidden="true">{subtitle}</span>}
          </span>{' '}<span>{accent}</span>
        </h1>
        {subtitle && <p className="sr-only">{subtitle}</p>}
      </div>
      {coins !== undefined && (
        <div className="street-header__meta">
          <Link to="/shop" className="home-wallet" aria-label="Zum Demo-Münzen-Shop">
            <Coins aria-hidden="true" />
            <span role="status" aria-label={`Demo-Münzen: ${coins}`}>{coins.toLocaleString('de-DE')}</span>
            <Plus aria-hidden="true" className="home-wallet__plus" />
          </Link>
        </div>
      )}
    </header>
  )
}
