import { Crown, MapPin } from 'lucide-react'
import { getRarityLabel } from '@/lib/utils'
import type { Card, CardStats } from '@/types'

const STAT_LABELS: Record<keyof CardStats, string> = {
  alter: 'Alter', flecken: 'Flecken', witterung: 'Witterung', geruch: 'Geruch', kontaminierung: 'Kontamination',
}

export function StreetCard({ card }: { card: Card }) {
  return (
    <span className={`street-card street-card--${card.rarity}`}>
      <span className="street-card__image">
        <img src={card.image_url || '/art/street-mattress.svg'} alt={card.image_url ? card.name : 'Illustrierte Straßenmatratze als Beispielmotiv'} />
        <span className="street-card__topline"><Crown /><span>MQ / STREET FINDS</span><Crown /></span>
        <span className="street-card__rarity">{getRarityLabel(card.rarity)}</span>
        {!card.image_url && <span className="street-card__sample">DEMO ART</span>}
      </span>
      <span className="street-card__info">
        <strong className="street-card__name">{card.name}</strong>
        <span className="street-card__location"><MapPin aria-hidden="true" />{card.city}<span> / {card.country}</span></span>
        <span className="street-card__stats">{Object.entries(STAT_LABELS).map(([key, label]) => {
          const value = card.stats[key as keyof CardStats]
          return <span className="street-card__stat" key={key}><span>{label}</span><span className="street-card__value"><span className="street-card__meter"><i style={{ width: `${value}%` }} /></span><b>{value}</b></span></span>
        })}</span>
      </span>
      <span className="street-card__footer"><span>MATRATZEN QUARTETT</span><span>{card.edition_number ? `#${card.edition_number}/${card.total_editions ?? '–'}` : 'VOL. 01'}</span></span>
    </span>
  )
}
