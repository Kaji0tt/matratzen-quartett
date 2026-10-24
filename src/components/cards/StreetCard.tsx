import { Crown, Flag, MapPin, SignalZero, SignalLow, SignalMedium, SignalHigh, Signal, LockKeyhole, PenTool } from 'lucide-react'
import { useId, useState } from 'react'
import { getRarityLabel } from '@/lib/utils'
import { applyCardStatModifiers, COLLECTIBLE_CONDITIONS, EDITOR_CONDITION, getModifierTotal, type CollectibleCondition } from '@/lib/card-condition'
import type { Card, CardStats } from '@/types'
import { STAT_FIELDS } from '@/types/card-stats'

export type EditableCardField = 'name' | 'description' | keyof CardStats

interface EditableCardProps {
  field: EditableCardField | null
  onEdit: (field: EditableCardField | null) => void
}

const conditionIcons = {
  mint: Signal, near_mint: SignalHigh, excellent: SignalHigh, good: SignalMedium,
  light_played: SignalLow, played: SignalLow, poor: SignalZero, editor: Flag,
}

function signedValue(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}

function CardStatDetail({ card, stat, label, value, open, onOpenChange }: {
  card: Card
  stat: keyof CardStats
  label: string
  value: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const id = useId()
  const base = card.stats[stat]
  const modifier = card.stat_modifiers?.[stat] ?? 0
  const modifiers = Object.values(card.stat_modifiers ?? {})
  const positive = modifiers.reduce((sum, amount) => sum + Math.max(0, amount), 0)
  const negative = modifiers.reduce((sum, amount) => sum + Math.min(0, amount), 0)
  const total = card.stat_modifiers ? getModifierTotal(card.stat_modifiers) : 0
  const tone = modifier > 0 ? 'positive' : modifier < 0 ? 'negative' : 'neutral'
  return (
    <span className="street-card__stat-detail">
      <button type="button" className="street-card__stat-inspect"
        aria-label={`${label}: ${value}. Originalwert ${base}, Modifikator ${signedValue(modifier)}. Details anzeigen`}
        aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={(event) => { event.stopPropagation(); onOpenChange(!open) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) { event.stopPropagation(); onOpenChange(false) }
        }}
        onBlur={() => onOpenChange(false)}>
        <span>{label}</span>
        <span className="street-card__value">
          <span className="street-card__meter">
            <i style={{ width: `${Math.min(Math.max(value, 0), 105) / 105 * 100}%` }} />
            <span className={`street-card__base-marker street-card__base-marker--${tone}`}
              style={{ left: `${Math.min(Math.max(base, 0), 105) / 105 * 100}%` }}
              aria-hidden="true" />
          </span>
          <b>{value}</b>
        </span>
      </button>
      {open && <span id={id} role="tooltip" className="street-card__stat-tooltip">
        <strong>{label}</strong>
        <span>Originalwert <b>{base}</b></span>
        <span>Modifikator <b className={`street-card__modifier--${tone}`}>{signedValue(modifier)}</b></span>
        <span>Endwert <b>{value}</b></span>
        {base + modifier < 0 && <span className="street-card__stat-note">Rechnerisch {base + modifier}, spielbar 0. Der volle Modifikator bleibt erhalten.</span>}
        <span className="street-card__stat-card-total">Karte gesamt <b>{signedValue(total)}</b></span>
        <span><span className="street-card__modifier--positive">Boni {signedValue(positive)}</span><span className="street-card__modifier--negative">Abzüge {signedValue(negative)}</span></span>
        {card.copy_kind === 'editor' && <span className="street-card__stat-note">Editor-Original: keine Modifikatoren.</span>}
      </span>}
    </span>
  )
}

export function CardConditionBadge({ condition, card }: {
  condition?: CollectibleCondition | null
  card?: Pick<Card, 'stats' | 'stat_modifiers'>
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const grade = condition === 'editor' ? EDITOR_CONDITION : COLLECTIBLE_CONDITIONS.find(({ value }) => value === condition)
  const Icon = condition ? conditionIcons[condition] : SignalZero
  const text = grade ? `${grade.label} (${grade.code}) - ${grade.description}` : 'Noch nicht bewertet'
  const total = card?.stat_modifiers ? getModifierTotal(card.stat_modifiers) : null
  const tone = total !== null && total > 0 ? 'positive' : total !== null && total < 0 ? 'negative' : 'neutral'
  return (
    <span className={`street-card__grade street-card__grade--${condition ?? 'ungraded'}`}>
      <button type="button" className="street-card__grade-trigger" aria-label={`${text}${total !== null ? ` (${signedValue(total)})` : ''}`}
        aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={(event) => { event.stopPropagation(); setOpen(!open) }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false) }
        }}
        onBlur={() => setOpen(false)}>
        <Icon aria-hidden="true" />
      </button>
      {open && <span id={id} role="tooltip" className="street-card__grade-tooltip">
        {text}{total !== null && <> <strong className={`street-card__modifier--${tone}`}>({signedValue(total)})</strong></>}
      </span>}
    </span>
  )
}

export function StreetCard({ card, detailed = false, owned = true, editable }: {
  card: Card
  detailed?: boolean
  owned?: boolean
  editable?: EditableCardProps
}) {
  const [inspectedStat, setInspectedStat] = useState<keyof CardStats | null>(null)
  const copyKind = owned ? card.copy_kind : undefined
  const stats = applyCardStatModifiers(card.stats, card.stat_modifiers)
  const name = editable ? <button type="button"
      className={`street-card__editable street-card__name${editable.field === 'name' ? ' is-editing' : ''}`}
      aria-label="Kartenname bearbeiten" aria-pressed={editable.field === 'name'}
      onClick={() => editable.onEdit('name')}>{card.name}</button>
      : <strong className="street-card__name">{card.name}</strong>
  return (
    <span className={`street-card street-card--${card.rarity}${detailed ? ' street-card--detailed' : ''}${!owned ? ' street-card--missing' : ''}${copyKind ? ` street-card--${copyKind}` : ''}`}>
      <span className="street-card__heading">
        <Crown aria-hidden="true" />
        {name}
        {owned ? <CardConditionBadge condition={copyKind === 'editor' ? 'editor' : card.collectible_condition} card={card} /> : <span />}
      </span>
      <span className="street-card__image">
        <img src={card.image_url || '/art/street-mattress.svg'} alt={card.image_url ? card.name : 'Illustrierte Straßenmatratze als Beispielmotiv'} />
        <span className="street-card__location"><MapPin aria-hidden="true" /><span>{card.city} / {card.country}{detailed && card.location ? ` · ${card.location}` : ''}</span></span>
        <span className="street-card__rarity">{getRarityLabel(card.rarity)}</span>
        {copyKind && <span className="street-card__copy-seal" title={copyKind === 'editor' ? 'Editor-Kopie · fest zugeordnet · nicht handelbar' : 'Creator-Kopie · Originalexemplar des Fotografen'}>
          {copyKind === 'editor' ? <LockKeyhole aria-hidden="true" /> : <PenTool aria-hidden="true" />}
          <span>{copyKind === 'editor' ? 'EDITOR · NICHT HANDELBAR' : 'CREATOR'}</span>
        </span>}
        {!card.image_url && <span className="street-card__sample">DEMO ART</span>}
      </span>
      <span className="street-card__info">
        {detailed && (editable
            ? <button type="button"
              className={`street-card__editable street-card__description${editable.field === 'description' ? ' is-editing' : ''}`}
              aria-label="Beschreibung bearbeiten" aria-pressed={editable.field === 'description'}
              onClick={() => editable.onEdit('description')}>
              {card.description}
            </button>
            : <span className="street-card__description">{card.description}</span>)}
        <span className="street-card__stats">{STAT_FIELDS.map(({ key, label }) => {
          const value = stats[key]
          const meter = Math.min(Math.max(value, 0), 105) / 105 * 100
          return <span className="street-card__stat" key={key}>
            {editable
              ? <button type="button"
                className={`street-card__editable street-card__stat-trigger${editable.field === key ? ' is-editing' : ''}`}
                aria-label={`${label} bearbeiten, aktuell ${value}`} aria-pressed={editable.field === key}
                onClick={() => editable.onEdit(key)}>
                <span>{label}</span><span className="street-card__value"><span className="street-card__meter"><i style={{ width: `${meter}%` }} /></span><b>{value}</b></span>
              </button>
              : detailed
                ? <CardStatDetail card={card} stat={key} label={label} value={value}
                    open={inspectedStat === key} onOpenChange={(open) => setInspectedStat(open ? key : null)} />
                : <><span>{label}</span><span className="street-card__value"><span className="street-card__meter"><i style={{ width: `${meter}%` }} /></span><b>{value}</b></span></>}
          </span>
        })}</span>
        {detailed && card.attributes.filter(({ key }) => key === 'Werteprüfung').map(({ key, value }) => (
          <span className="street-card__review" key={key}>{value}</span>
        ))}
      </span>
      <span className="street-card__footer"><span>@{card.photographer_username.replace(/^@/, '')}</span><span>{card.edition_number ? `#${card.edition_number}/${card.total_editions ?? '–'}` : 'VOL. 01'}</span></span>
    </span>
  )
}
