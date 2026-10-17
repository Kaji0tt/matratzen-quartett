import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubmissionCamera } from '@/components/cards/SubmissionCamera'
import { ImageCropper } from '@/components/cards/ImageCropper'
import { StatInputs } from '@/components/cards/StatInputs'
import { supabase } from '@/lib/supabase'
import { errorMessage, submissionAction } from '@/lib/submissions'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { DEFAULT_STATS } from '@/types/submissions'
import type { CardCondition } from '@/types'

const STEPS = ['Kamerafoto', 'Stat-Vorschläge', 'Funddetails']
const textAreaClass = 'w-full min-h-24 rounded-lg border border-input bg-background p-3 text-sm'

export function SubmitCardPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuthStore()
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [source, setSource] = useState<File | null>(null)
  const [cropping, setCropping] = useState(false)
  const [preview, setPreview] = useState('')
  const [capturedAt, setCapturedAt] = useState('')
  const [stats, setStats] = useState({ ...DEFAULT_STATS })
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('DE')
  const [foundOn, setFoundOn] = useState(new Date().toLocaleDateString('en-CA'))
  const [condition, setCondition] = useState<CardCondition>('good')
  const [observations, setObservations] = useState('')
  const [surroundings, setSurroundings] = useState('')
  const [story, setStory] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const requestId = useRef(crypto.randomUUID())
  const uploaded = useRef(false)
  const submitting = useRef(false)

  useEffect(() => {
    if (!photo) { setPreview(''); return }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  if (isLoading) return <p className="p-6" role="status">Anmeldung wird geprüft …</p>
  if (!user) return <div className="container mx-auto max-w-lg space-y-4 px-4 py-8">
    <h1 className="text-2xl font-bold">Matratze einreichen</h1>
    <p>Für echte Einreichungen und deine Belohnungskopie brauchst du ein Konto.</p>
    <Button asChild><Link to="/auth">Anmelden</Link></Button>
    <Button asChild variant="outline"><Link to="/auth/register">Registrieren</Link></Button>
  </div>

  async function submit() {
    if (!user || !photo || cropping || !consent || submitting.current) return
    submitting.current = true
    setBusy(true)
    try {
      const imagePath = `${user.id}/${requestId.current}.jpg`
      if (!uploaded.current) {
        const { error } = await supabase.storage.from('submission-images').upload(imagePath, photo, { contentType: 'image/jpeg', upsert: false })
        if (error) throw error
        uploaded.current = true
      }
      const { error } = await supabase.rpc('create_card_submission', {
        p_id: requestId.current,
        p_data: {
          captured_at: capturedAt, city: city.trim(), location: location.trim(), country: country.toUpperCase(),
          found_on: foundOn, condition, observations: observations.trim(), surroundings: surroundings.trim(),
          discovery_story: story.trim(), proposed_stats: { ...stats },
        },
      })
      if (error) throw error
      toast({ title: 'Fund gespeichert', description: 'Die KI prüft jetzt deine Stichpunkte und Stat-Vorschläge.' })
      try {
        await submissionAction({ id: requestId.current, action: 'generate' })
        toast({ title: 'KI-Prüfung abgeschlossen', description: 'Deine Karte wartet jetzt auf die manuelle Freigabe.' })
      } catch (aiError) {
        toast({ title: 'Fund gespeichert · KI-Prüfung noch offen', description: errorMessage(aiError), variant: 'destructive' })
      }
      navigate('/submissions')
    } catch (err) {
      toast({ title: 'Einreichung fehlgeschlagen', description: errorMessage(err), variant: 'destructive' })
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const detailsValid = city.trim().length >= 2 && location.trim().length >= 2 && /^[A-Z]{2}$/.test(country)
    && !!foundOn && foundOn <= new Date().toLocaleDateString('en-CA') && foundOn >= '2000-01-01'
    && observations.trim().length >= 10 && surroundings.trim().length >= 3 && consent

  return <div className="container mx-auto max-w-lg space-y-6 px-4 py-8">
    <header><h1 className="text-2xl font-bold">Matratze einreichen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vom Bordstein ins Quartett. Nach KI-Prüfung und manueller Freigabe erhältst du eine Kopie.</p></header>
    <ol aria-label="Einreichungsschritte" className="flex gap-3 text-sm">
      {STEPS.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}
        className={step === index ? 'font-bold text-purple-300' : 'text-muted-foreground'}>{index + 1}. {label}</li>)}
    </ol>
    <section className="rounded-xl border border-purple-400/25 bg-slate-950/70 p-5 space-y-5">
      <h2 className="text-lg font-semibold">{STEPS[step]}</h2>
      {step === 0 && (cropping && source ? <ImageCropper source={source} outputType="image/jpeg"
        onApply={(file) => { setPhoto(file); setCropping(false) }}
        onCancel={() => { setCropping(false); if (!photo) setSource(null) }} />
        : photo ? <div className="space-y-4">
        {preview && <img src={preview} alt="Dein frisches Matratzenfoto" className="max-h-96 w-full rounded-lg object-contain" />}
        <Button variant="outline" disabled={uploaded.current} onClick={() => setCropping(true)}>Ausschnitt ändern</Button>
        <Button variant="outline" disabled={uploaded.current} onClick={() => { setPhoto(null); setSource(null) }}>Neu aufnehmen</Button>
      </div> : <SubmissionCamera onCapture={(file, date) => { setSource(file); setCapturedAt(date); setCropping(true) }} />)}
      {step === 1 && <>
        <p className="text-sm text-muted-foreground">Deine Wunschwerte, nicht die finalen Stats. Die KI prüft sie auf Plausibilität und Spielbalance; die Moderation entscheidet abschließend.</p>
        <StatInputs value={stats} onChange={setStats} />
      </>}
      {step === 2 && <div className="space-y-4">
        <label className="block text-sm">Stadt<Input value={city} maxLength={100} onChange={(e) => setCity(e.target.value)} /></label>
        <label className="block text-sm">Fundort / Viertel (keine private Adresse)<Input value={location} maxLength={150} onChange={(e) => setLocation(e.target.value)} /></label>
        <label className="block text-sm">Land (Ländercode)<Input value={country} maxLength={2} onChange={(e) => setCountry(e.target.value.toUpperCase())} /></label>
        <label className="block text-sm">Funddatum<Input type="date" min="2000-01-01" max={new Date().toLocaleDateString('en-CA')} value={foundOn} onChange={(e) => setFoundOn(e.target.value)} /></label>
        <label className="block text-sm">Zustand
          <select className="mt-1 w-full rounded-lg border border-input bg-background p-3" value={condition} onChange={(e) => setCondition(e.target.value as CardCondition)}>
            <option value="mint">Wie neu</option><option value="excellent">Sehr gut</option><option value="good">Gebraucht</option>
            <option value="fair">Mitgenommen</option><option value="poor">Bordstein-Endboss</option>
          </select>
        </label>
        <label className="block text-sm">Was fällt auf? (mind. 10 Zeichen)
          <textarea className={textAreaClass} maxLength={1200} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Flecken, Muster, Form, Schäden, auffällige Details – Stichpunkte reichen." />
        </label>
        <label className="block text-sm">Wie lag sie da? (mind. 3 Zeichen)
          <textarea className={textAreaClass} maxLength={600} value={surroundings} onChange={(e) => setSurroundings(e.target.value)} placeholder="An die Laterne gelehnt, im Regen, zwischen Sperrmüll …" />
        </label>
        <label className="block text-sm">Die Geschichte zum Fund (optional)
          <textarea className={textAreaClass} maxLength={600} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Was macht diesen Fund besonders? Keine Namen oder privaten Chats." />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>Das Foto ist von mir und darf im Spiel veröffentlicht werden. Meine Fund-Stichpunkte, Stadt und Stat-Vorschläge dürfen zur Text- und Balancing-Prüfung an OpenAI übermittelt werden. Ich habe keine personenbezogenen oder vertraulichen Daten angegeben. Das Foto selbst wird nicht an OpenAI gesendet.</span>
        </label>
      </div>}
    </section>
    <div className="flex justify-between gap-3">
      <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>Zurück</Button>
      {step < 2 ? <Button disabled={!photo || cropping} onClick={() => setStep(step + 1)}>Weiter</Button>
        : <Button disabled={!detailsValid || busy} onClick={submit}>{busy ? 'Wird gespeichert …' : 'Fund einreichen'}</Button>}
    </div>
    <Link className="block text-sm text-purple-300 underline" to="/submissions">Meine Einreichungen ansehen</Link>
  </div>
}
