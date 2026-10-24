import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Crop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SubmissionCamera } from '@/components/cards/SubmissionCamera'
import { ImageCropper } from '@/components/cards/ImageCropper'
import { StreetCard, type EditableCardField } from '@/components/cards/StreetCard'
import { supabase } from '@/lib/supabase'
import { errorMessage, submissionAction } from '@/lib/submissions'
import { getSubmissionPlace } from '@/lib/submission-place'
import { hasSubmissionConsent, saveSubmissionConsent } from '@/lib/submission-consent'
import type { SubmissionPlace } from '@/lib/submission-place'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { DEFAULT_STATS } from '@/types/submissions'
import { STAT_FIELDS } from '@/types/card-stats'
import type { Card, CardStats } from '@/types'
import '@/submission.css'

const STAT_SUMMARIES: Record<keyof CardStats, string> = {
  witterung: 'Sichtbare Spuren von Regen, Sonne und Straßenleben.',
  flecken: 'Anzahl, Größe und Intensität sichtbarer Flecken.',
  ambiente: 'Fundszene und Besonderheit der Umgebung.',
  komfort: 'Wie intakt und bequem wirkt sie?',
  charakter: 'Muster, Form und besondere Konstruktion.',
}

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
  const [place, setPlace] = useState<SubmissionPlace | null>(null)
  const [placeError, setPlaceError] = useState('')
  const [locationAttempt, setLocationAttempt] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingField, setEditingField] = useState<EditableCardField | null>(null)
  const [consentAccount, setConsentAccount] = useState<string | null>(null)
  const [privacyCheckedAccount, setPrivacyCheckedAccount] = useState<string | null>(null)
  const [privacyError, setPrivacyError] = useState('')
  const consent = !!user && consentAccount === user.id
  const privacyReady = !!user && privacyCheckedAccount === user.id
  const [busy, setBusy] = useState(false)
  const requestId = useRef(crypto.randomUUID())
  const uploaded = useRef(false)
  const submitting = useRef(false)
  const screen = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    try {
      setConsentAccount(hasSubmissionConsent(user.id) ? user.id : null)
      setPrivacyError('')
    } catch (error) {
      setConsentAccount(null)
      setPrivacyError(`Die Datenschutzeinstellung konnte nicht geladen werden: ${errorMessage(error)}`)
    }
    setPrivacyCheckedAccount(user.id)
  }, [user])

  function acceptPrivacy() {
    if (!user) return
    try {
      saveSubmissionConsent(user.id)
      setConsentAccount(user.id)
      setPrivacyError('')
    } catch (error) {
      setPrivacyError(`Deine Zustimmung konnte nicht gespeichert werden. Bitte Browserspeicher erlauben und erneut versuchen: ${errorMessage(error)}`)
    }
  }

  useEffect(() => {
    const viewport = window.visualViewport
    const element = screen.current
    if (step !== 1 || !viewport || !element) return
    const resize = () => {
      element.style.setProperty('--submission-height', `${viewport.height}px`)
      element.style.setProperty('--submission-top', `${viewport.offsetTop}px`)
    }
    resize()
    viewport.addEventListener('resize', resize)
    viewport.addEventListener('scroll', resize)
    return () => {
      viewport.removeEventListener('resize', resize)
      viewport.removeEventListener('scroll', resize)
      element.style.removeProperty('--submission-height')
      element.style.removeProperty('--submission-top')
    }
  }, [step])

  useEffect(() => {
    if (!photo) { setPreview(''); return }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  useEffect(() => {
    if (!capturedAt || !consent) return
    const controller = new AbortController()
    setPlace(null)
    setPlaceError('')
    getSubmissionPlace(controller.signal).then((result) => {
      if (!controller.signal.aborted) setPlace(result)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setPlaceError(errorMessage(error))
    })
    return () => controller.abort()
  }, [capturedAt, locationAttempt, consent])

  function back() {
    if (busy) return
    if (editingField) { setEditingField(null); return }
    if (step === 1) { setStep(0); return }
    if (cropping) { setCropping(false); if (!photo) setSource(null); return }
    if (photo && !uploaded.current) { setPhoto(null); setSource(null); setCapturedAt(''); return }
    navigate('/')
  }

  const detailsValid = !!place && name.trim().length >= 2 && name.trim().length <= 80
    && description.trim().length >= 10 && description.trim().length <= 1000
    && Object.values(stats).filter((value) => value === 100).length <= 1 && consent

  const previewCard: Card = {
    id: 'submission-preview',
    name: name.trim() || 'Deine Matratze',
    description: description.trim() || 'Deine Beschreibung erscheint hier …',
    rarity: 'common',
    image_url: preview,
    location: place?.location ?? 'Wird ermittelt',
    city: place?.city ?? 'Standort wird ermittelt',
    country: place?.country ?? 'DE',
    stats,
    photographer_id: user?.id ?? '',
    photographer_username: 'Du',
    created_at: capturedAt,
    is_approved: false,
    report_count: 0,
    attributes: [],
  }
  const editingStat = editingField && editingField !== 'name' && editingField !== 'description'
    ? STAT_FIELDS.find(({ key }) => key === editingField)
    : undefined

  async function submit() {
    if (!user || !photo || !place || cropping || !detailsValid || submitting.current) return
    submitting.current = true
    setEditingField(null)
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
          captured_at: capturedAt, ...place, found_on: capturedAt.slice(0, 10),
          observations: description.trim(), surroundings: `Fundort: ${place.location}`,
          discovery_story: '', proposed_stats: { ...stats },
          name: name.trim(), description: description.trim(),
        },
      })
      if (error) throw error
      toast({ title: 'Fund gespeichert', description: 'Die KI prüft deinen Text und die Stat-Vorschläge. Dein Original bleibt erhalten.' })
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

  return <div ref={screen} className="submission-screen">
    {isLoading ? <p className="m-auto p-6" role="status">Anmeldung wird geprüft …</p>
      : !user ? <div className="m-auto max-w-lg space-y-4 p-6">
        <p>Für echte Einreichungen und deine Belohnungskopie brauchst du ein Konto.</p>
        <Button asChild><Link to="/auth">Anmelden</Link></Button>
        <Button asChild variant="outline"><Link to="/auth/register">Registrieren</Link></Button>
      </div>
      : !privacyReady ? <p className="m-auto p-6" role="status">Einstellungen werden geladen …</p>
      : !consent ? null
      : step === 0 ? (
        cropping && source ? <ImageCropper source={source} outputType="image/jpeg" fullscreen
          onApply={(file) => { setPhoto(file); setCropping(false); setStep(1) }}
          onCancel={() => { setCropping(false); if (!photo) setSource(null) }} />
          : photo ? <div className="absolute inset-0 bg-black">
            {preview && <img src={preview} alt="Dein frisches Matratzenfoto" className="h-full w-full object-contain" />}
            <div className="submission-photo-actions">
              <Button className="submission-tool" variant="outline" disabled={uploaded.current} onClick={() => setCropping(true)}><Crop className="h-4 w-4" />Ausschnitt</Button>
              <Button className="submission-tool" variant="outline" disabled={uploaded.current} onClick={() => { setPhoto(null); setSource(null); setCapturedAt('') }}><Camera className="h-4 w-4" />Neu</Button>
            </div>
            <div className="submission-preview-footer">
              <div className="submission-submit">
                <Button className="submission-tool submission-tool--confirm" onClick={() => setStep(1)}>Karte gestalten<ArrowRight aria-hidden="true" className="h-6 w-6" /></Button>
              </div>
            </div>
          </div> : <SubmissionCamera onCapture={(file, date) => { setSource(file); setCapturedAt(date); setCropping(true) }} />
      ) : <form className="submission-form submission-form--card" aria-label="Karte bearbeiten" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        <div className="submission-editor">
          <section className="submission-card-panel" aria-label="Live-Vorschau deiner Karte">
            <header className="submission-card-header">
              <span>KARTE GESTALTEN</span>
              <p>Zum Bearbeiten antippen</p>
            </header>
            <div className="collection-detail-card submission-card-preview">
              <StreetCard card={previewCard} detailed owned={false} editable={busy ? undefined : {
                field: editingField,
                onEdit: setEditingField,
              }} />
            </div>
            {placeError && <p className="submission-card-error" role="alert">
              {placeError} <button type="button" className="underline" onClick={() => setLocationAttempt((value) => value + 1)}>Erneut versuchen</button>
            </p>}
          </section>
        </div>
        {editingField && <section className="submission-edit-panel" aria-label={`${editingStat?.label ?? (editingField === 'name' ? 'Kartenname' : 'Beschreibung')} bearbeiten`}>
          <div className="submission-edit-panel__heading">
            <label htmlFor="submission-edit-input">{editingStat?.label ?? (editingField === 'name' ? 'Kartenname' : 'Beschreibung')}</label>
            {editingStat && <output htmlFor="submission-edit-input">{stats[editingStat.key]} / 100</output>}
            <button type="button" onClick={() => setEditingField(null)}>Fertig</button>
          </div>
          {editingField === 'name'
            ? <input id="submission-edit-input" autoFocus required minLength={2} maxLength={80}
              placeholder="Kartenname" value={name} onChange={(event) => setName(event.target.value)} />
            : editingField === 'description'
              ? <textarea id="submission-edit-input" autoFocus required minLength={10} maxLength={1000}
                placeholder="Beschreibe die Matratze" value={description} onChange={(event) => setDescription(event.target.value)} />
              : editingStat && <input id="submission-edit-input" autoFocus className="submission-edit-panel__range"
                type="range" min="0" max="100" step="1" value={stats[editingStat.key]}
                aria-label={editingStat.label}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  const hasMaximum = Object.entries(stats).some(([other, score]) => other !== editingStat.key && score === 100)
                  setStats({ ...stats, [editingStat.key]: hasMaximum ? Math.min(99, next) : next })
                }} />}
          {editingStat && <p className="submission-edit-panel__hint" title={editingStat.hint}>
            {STAT_SUMMARIES[editingStat.key]}
            {Object.entries(stats).some(([key, value]) => key !== editingStat.key && value === 100)
              && ' · Ein anderer Wert ist bereits auf 100.'}
          </p>}
        </section>}
        <div className="submission-submit">
          <Button type="submit" className="submission-tool submission-tool--confirm" disabled={!detailsValid || busy}>{busy ? 'Wird gespeichert …' : 'Fund einreichen'}</Button>
        </div>
      </form>}
    <Dialog open={!isLoading && privacyReady && !consent} onOpenChange={(open) => { if (!open) navigate('/') }}>
      <DialogContent className="submission-privacy flex flex-col">
        <DialogTitle className="pr-6">Dein Fund. Deine Entscheidung.</DialogTitle>
        <div className="submission-privacy-copy">
          <DialogDescription className="leading-relaxed">
            Nur eigene Fotos ohne Gesichter, Kennzeichen, private Adressen oder vertrauliche Daten einreichen.
            Dein Foto darf im Spiel veröffentlicht werden, wird aber nicht an OpenAI gesendet.
            Kartenname, Beschreibung, Stadt und Stat-Vorschläge werden zur Text- und Balancing-Prüfung an OpenAI übermittelt.
            Für Stadt und Viertel erhält OpenStreetMap/Nominatim nur grob gerundete Koordinaten; genaue Koordinaten und Straßenadressen werden nicht gespeichert.
          </DialogDescription>
          <p className="text-xs leading-relaxed text-slate-400">Mit deiner Zustimmung erlaubst du diese Verarbeitung für deine Einreichungen. Wir merken uns deine Entscheidung für dieses Konto in diesem Browser.</p>
          {privacyError && <p role="alert" className="text-sm text-red-300">{privacyError}</p>}
        </div>
        <div className="submission-privacy-actions">
          <Button type="button" className="submission-tool submission-tool--confirm" onClick={acceptPrivacy}>Zustimmen &amp; Kamera öffnen</Button>
          <button type="button" className="min-h-11 text-sm text-slate-400 hover:text-white" onClick={() => navigate('/')}>Nicht jetzt</button>
        </div>
      </DialogContent>
    </Dialog>
    <button type="button" className="page-back" onClick={back} disabled={busy}
      aria-label={step === 1 || cropping || photo ? 'Zurück zum Foto' : 'Zurück zu Home'} title="Zurück">
      <ArrowLeft aria-hidden="true" />
    </button>
  </div>
}
