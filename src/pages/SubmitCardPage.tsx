import { useState, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, X, ChevronRight, ChevronLeft, Check, Loader2, Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { CardCondition } from '@/types'

const STAT_LABELS: Record<string, { label: string; hint: string }> = {
  alter:           { label: 'Alter',           hint: 'Wie alt wirkt die Matratze?' },
  flecken:         { label: 'Flecken',         hint: 'Wie viele/intensive Flecken sind sichtbar?' },
  witterung:       { label: 'Witterung',       hint: 'Wie stark ist sie den Elementen ausgesetzt?' },
  geruch:          { label: 'Geruch',          hint: 'Wie intensiv ist der Muffgeruch?' },
  kontaminierung:  { label: 'Kontaminierung',  hint: 'Wie hoch ist das Hygiene-Risiko?' },
}

const CONDITIONS: { value: CardCondition; label: string; emoji: string }[] = [
  { value: 'mint',      label: 'Mint',      emoji: '✨' },
  { value: 'excellent', label: 'Excellent', emoji: '👍' },
  { value: 'good',      label: 'Good',      emoji: '👌' },
  { value: 'fair',      label: 'Fair',      emoji: '🤏' },
  { value: 'poor',      label: 'Poor',      emoji: '💀' },
]

const STEPS = ['Foto', 'Details', 'Stats']

export function SubmitCardPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Step 0 – Photo
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Step 1 – Details
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('DE')
  const [condition, setCondition] = useState<CardCondition>('good')
  const [notes, setNotes] = useState('')

  // Step 2 – Stats
  const [stats, setStats] = useState({
    alter: 50,
    flecken: 50,
    witterung: 50,
    geruch: 50,
    kontaminierung: 50,
  })

  if (!user || !profile) return <Navigate to="/auth" replace />

  // ── Handlers ────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Nur Bilder erlaubt', description: 'JPG, PNG oder WEBP.', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Bild zu groß', description: 'Maximal 5 MB erlaubt.', variant: 'destructive' })
      return
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async () => {
    if (!imageFile || !user) return
    setIsSubmitting(true)

    try {
      // 1. Upload image → card-images/{user_id}/{uuid}.ext
      const ext = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(fileName)

      // 2. Insert card record (is_approved defaults to false → goes to moderation queue)
      const { error: insertError } = await supabase.from('cards').insert({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        city: city.trim(),
        country: country.trim().toUpperCase(),
        condition,
        image_url: urlData.publicUrl,
        photographer_id: user.id,
        stat_alter: stats.alter,
        stat_flecken: stats.flecken,
        stat_witterung: stats.witterung,
        stat_geruch: stats.geruch,
        stat_kontaminierung: stats.kontaminierung,
        notes: notes.trim(),
      })

      if (insertError) throw insertError

      // 3. Bump cards_contributed on profile
      await supabase
        .from('profiles')
        .update({ cards_contributed: (profile.cards_contributed ?? 0) + 1 })
        .eq('id', user.id)

      toast({
        title: '🛏️ Karte eingereicht!',
        description: 'Ein Moderator prüft deine Matratze. Du wirst benachrichtigt.',
      })
      navigate('/collection')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      toast({ title: 'Fehler beim Einreichen', description: message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = [
    imagePreview !== null,
    name.trim().length >= 2 && location.trim().length >= 2 && city.trim().length >= 2,
    true, // stats always valid
  ]

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="container mx-auto max-w-lg px-4 py-6 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">Karte einreichen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fotografiere eine Straßenmatratze — nach Freigabe wird sie Teil des Spiels.
        </p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                step > i  ? 'bg-primary text-primary-foreground scale-90'
                          : step === i ? 'bg-primary/20 border-2 border-primary text-primary'
                          : 'bg-muted text-muted-foreground'
              )}>
                {step > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                step === i ? 'text-primary' : 'text-muted-foreground'
              )}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mb-4 transition-colors duration-300', step > i ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {/* ── Step 0: Photo ── */}
        {step === 0 && (
          <motion.div key="step0"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={cn(
                'relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden',
                dragOver ? 'border-primary bg-primary/10 scale-[1.01]'
                         : imagePreview ? 'border-primary/40 border-solid' : 'border-border hover:border-primary/50',
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative group cursor-default">
                  <img
                    src={imagePreview}
                    alt="Vorschau"
                    className="w-full h-72 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (imagePreview) URL.revokeObjectURL(imagePreview)
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-16 px-4 text-center cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-white mb-1">Foto auswählen</p>
                  <p className="text-xs text-muted-foreground">Antippen oder Bild hierher ziehen</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP · max. 5 MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            />

            {imagePreview && (
              <Button
                variant="outline"
                className="w-full mt-3 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Anderes Foto wählen
              </Button>
            )}
          </motion.div>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Name der Karte *</Label>
              <Input
                id="name"
                placeholder="z.B. Berliner Bürgersteig-Bett"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="mt-1.5"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{name.length}/60</p>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <textarea
                id="description"
                placeholder="Was macht diese Matratze besonders?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={3}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/300</p>
            </div>

            <div>
              <Label htmlFor="notes">Persönliche Notizen (optional)</Label>
              <textarea
                id="notes"
                placeholder="z.B. Funknummer, spezielle Gegebenheiten, Kontakt zum Fotograf..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={2}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{notes.length}/200</p>
            </div>

            <div>
              <Label htmlFor="location">Fundort (Straße / Ecke) *</Label>
              <Input
                id="location"
                placeholder="Schönhauser Allee, Ecke Kastanienallee"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="city">Stadt *</Label>
                <Input
                  id="city"
                  placeholder="Berlin"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  placeholder="DE"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  className="mt-1.5 uppercase"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Zustand</Label>
              <div className="grid grid-cols-5 gap-2">
                {CONDITIONS.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCondition(value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all',
                      condition === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-border/70'
                    )}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Stats ── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <p className="text-sm text-muted-foreground">
              Bewerte die Matratze auf einer Skala von 0–100. Diese Werte bestimmen ihre Stärke im Quartett-Kampf.
            </p>

            {(Object.keys(stats) as Array<keyof typeof stats>).map((key) => (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div>
                    <span className="text-sm font-semibold text-white">{STAT_LABELS[key].label}</span>
                    <p className="text-xs text-muted-foreground">{STAT_LABELS[key].hint}</p>
                  </div>
                  <span className="text-xl font-bold text-primary tabular-nums w-10 text-right">
                    {stats[key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={stats[key]}
                  onChange={(e) => setStats(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full h-2 accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>
        )}

        {step < 2 ? (
          <Button
            variant="gaming"
            className="flex-1 gap-2"
            disabled={!canProceed[step]}
            onClick={() => setStep(s => s + 1)}
          >
            Weiter
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="gaming"
            className="flex-1 gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird eingereicht…</>
              : <><Check className="w-4 h-4" /> Karte einreichen</>
            }
          </Button>
        )}
      </div>

      {step === 2 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Nach der Einreichung wird deine Karte von einem Moderator geprüft.<br />
          Bei Genehmigung erhältst du <span className="text-amber-400 font-semibold">+200 🪙</span> und <span className="text-blue-400 font-semibold">+XP</span>.
        </p>
      )}
    </div>
  )
}
