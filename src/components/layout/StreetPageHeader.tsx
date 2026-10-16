import { Link } from 'react-router-dom'
import { ArrowLeft, Coins, Crown, Plus } from 'lucide-react'
import { useFittedWordmark } from '@/hooks/use-fitted-wordmark'

export function StreetPageHeader({ first, accent, subtitle, coins }: {
  first: string
  accent: string
  subtitle: string
  coins?: number
}) {
  const { brandRef, wordmarkRef } = useFittedWordmark()

  return (
    <header className="street-header">
      <Link to="/" className="street-back"><ArrowLeft aria-hidden="true" /> Home</Link>
      <div className="street-header__brand" ref={brandRef}>
        <h1 className="home-wordmark" ref={wordmarkRef}>
          <Crown aria-hidden="true" />
          <span>{first}</span>{' '}<span>{accent}</span>
        </h1>
      </div>
      <div className="street-header__meta">
        <p>{subtitle}</p>
        {coins !== undefined && (
          <Link to="/shop" className="home-wallet" aria-label="Zum Demo-Münzen-Shop">
            <Coins aria-hidden="true" />
            <span role="status" aria-label={`Demo-Münzen: ${coins}`}>{coins.toLocaleString('de-DE')}</span>
            <Plus aria-hidden="true" className="home-wallet__plus" />
          </Link>
        )}
      </div>
    </header>
  )
}
