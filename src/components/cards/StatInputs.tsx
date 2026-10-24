import { STAT_FIELDS } from '@/types/submissions'
import type { CardStats } from '@/types'

export function StatInputs({ value, onChange, compact = false }: {
  value: CardStats
  onChange: (stats: CardStats) => void
  compact?: boolean
}) {
  return <div className={compact ? 'submission-stats' : 'space-y-4'}>{STAT_FIELDS.map(({ key, label, hint }) => (
    <label key={key} className="block text-sm">
      <span className="flex justify-between text-white"><span>{label}</span><span>{value[key]} / 100</span></span>
      <input className="mt-2 w-full accent-purple-500" type="range" min="0" max="100" step="1"
        value={value[key]} onChange={(e) => {
          const next = Number(e.target.value)
          const hasMaximum = Object.entries(value).some(([other, score]) => other !== key && score === 100)
          onChange({ ...value, [key]: compact && hasMaximum ? Math.min(99, next) : next })
        }} />
      {!compact && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  ))}</div>
}
