import { STAT_FIELDS } from '@/types/submissions'
import type { CardStats } from '@/types'

export function StatInputs({ value, onChange }: { value: CardStats; onChange: (stats: CardStats) => void }) {
  return <div className="space-y-4">{STAT_FIELDS.map(({ key, label, hint }) => (
    <label key={key} className="block text-sm">
      <span className="flex justify-between text-white"><span>{label}</span><span>{value[key]} / 100</span></span>
      <input className="mt-2 w-full accent-purple-500" type="range" min="0" max="100" step="1"
        value={value[key]} onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })} />
      <span className="text-xs text-muted-foreground">{hint}</span>
    </label>
  ))}</div>
}
