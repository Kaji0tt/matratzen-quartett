import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatInputs } from '@/components/cards/StatInputs'
import { supabase } from '@/lib/supabase'
import { errorMessage, submissionAction } from '@/lib/submissions'
import { useAuthStore } from '@/store/auth-store'
import { toast } from '@/hooks/use-toast'
import { readStats, STAT_FIELDS, STATUS_LABELS } from '@/types/submissions'
import type { Submission } from '@/types/submissions'
import type { Rarity } from '@/types'

export function SubmissionsPage() {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <p role="status" className="p-6">Anmeldung wird geprüft …</p>
  if (!user) return <div className="p-6"><p>Bitte melde dich an, um deine Einreichungen zu sehen.</p><Link to="/auth" className="text-purple-300 underline">Anmelden</Link></div>
  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
    <header><h1 className="text-2xl font-bold">Meine Einreichungen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Deine Bordsteinjuwelen auf dem Weg ins Spiel. Nach Freigabe gehört dir eine Kopie.</p></header>
    <Button asChild><Link to="/submit">Neue Matratze einreichen</Link></Button>
    <SubmissionsPanel />
  </div>
}

export function SubmissionsPanel({ moderation = false }: { moderation?: boolean }) {
  const { user } = useAuthStore()
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('open')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['submissions', user?.id, moderation, page, filter],
    enabled: !!user,
    queryFn: async () => {
      let request = supabase.from('card_submissions').select('*').order('created_at', { ascending: false })
      if (!moderation) request = request.eq('user_id', user!.id)
      else if (filter === 'open') request = request.not('status', 'in', '(approved,rejected)')
      const { data, error } = await request.range(page * 20, page * 20 + 19)
      if (error) throw error
      return data
    },
    refetchInterval: (q) => q.state.data?.some((s) => ['pending_ai', 'ai_reviewing', 'publishing'].includes(s.status)) ? 6000 : false,
  })
  const images = useQuery({
    queryKey: ['submission-images', user?.id, query.data?.map((s) => s.image_path)],
    enabled: !!query.data?.length,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('submission-images')
        .createSignedUrls(query.data!.map((s) => s.image_path), 600)
      if (error) throw error
      const failed = data.find((image) => image.error)
      if (failed) throw new Error(`Foto konnte nicht geladen werden: ${failed.error}`)
      return Object.fromEntries(data.map((image) => [image.path, image.signedUrl]))
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['catalogue'] }),
    ])
  }
  return <div className="space-y-5">
    {moderation && <label className="block text-sm">Moderationsliste
      <select className="ml-3 rounded-lg bg-slate-900 p-3" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0) }}>
        <option value="open">Offene Einreichungen</option><option value="all">Alle Zustände</option>
      </select>
    </label>}
    {query.isPending && <p role="status">Einreichungen werden geladen …</p>}
    {query.isError && <div role="alert"><p>{errorMessage(query.error)}</p><Button variant="outline" onClick={() => query.refetch()}>Erneut laden</Button></div>}
    {images.isError && <p role="alert" className="text-red-300">{errorMessage(images.error)}</p>}
    {query.data?.length === 0 && <p className="text-muted-foreground">Hier liegen noch keine {moderation ? 'passenden ' : ''}Einreichungen.</p>}
    {query.data?.map((submission) => <SubmissionItem key={`${submission.id}:${submission.updated_at}`}
      submission={submission} imageUrl={images.data?.[submission.image_path]} moderation={moderation} onChanged={refresh} />)}
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Vorherige</Button>
      <span className="text-sm">Seite {page + 1}</span>
      <Button variant="outline" disabled={!query.data || query.data.length < 20} onClick={() => setPage(page + 1)}>Weitere</Button>
    </div>
  </div>
}

function SubmissionItem({ submission: s, imageUrl, moderation, onChanged }: {
  submission: Submission; imageUrl?: string; moderation: boolean; onChanged: () => Promise<void>
}) {
  const user = useAuthStore((state) => state.user)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(s.name || '')
  const [description, setDescription] = useState(s.description || '')
  const [notes, setNotes] = useState(s.moderation_notes)
  const [rarity, setRarity] = useState<Rarity>(s.rarity)
  const [stats, setStats] = useState(readStats(s.final_stats))
  const proposed = readStats(s.proposed_stats)
  const aiReasoning = s.ai_result && typeof s.ai_result === 'object' && !Array.isArray(s.ai_result)
    && typeof s.ai_result.reasoning === 'string' ? s.ai_result.reasoning : null
  const ai = s.ai_result && typeof s.ai_result === 'object' && !Array.isArray(s.ai_result) ? s.ai_result : null
  const textReview = ai?.text_review && typeof ai.text_review === 'object' && !Array.isArray(ai.text_review)
    && typeof ai.text_review.needs_review === 'boolean' && typeof ai.text_review.reasoning === 'string'
    ? ai.text_review : null
  const correctedName = textReview && typeof ai?.name === 'string' ? ai.name : null
  const correctedDescription = textReview && typeof ai?.description === 'string' ? ai.description : null
  const hasCorrections = correctedName !== null && correctedDescription !== null
    && (correctedName !== (s.submitted_name ?? s.name) || correctedDescription !== (s.submitted_description ?? s.description))
  const canRetry = ['pending_ai', 'ai_failed'].includes(s.status)
    || (s.status === 'ai_reviewing' && !!s.ai_started_at && Date.now() - Date.parse(s.ai_started_at) > 120_000)

  async function act(action: 'generate' | 'save' | 'approve' | 'reject') {
    setBusy(true)
    try {
      if (action === 'generate') await submissionAction({ id: s.id, action })
      else {
        const data = { name, description, notes, rarity, stats: stats ? { ...stats } : null }
        if (action === 'approve') await submissionAction({ id: s.id, action, updated_at: s.updated_at, data })
        else {
          const { error } = await supabase.rpc('moderate_card_submission', { p_id: s.id, p_updated_at: s.updated_at, p_action: action, p_data: data })
          if (error) throw error
        }
      }
      toast({ title: action === 'generate' ? 'KI-Prüfung abgeschlossen' : action === 'approve' ? 'Freigegeben · Kopie vergeben' : action === 'reject' ? 'Einreichung abgelehnt' : 'Änderungen gespeichert' })
      await onChanged()
    } catch (err) {
      toast({ title: 'Aktion fehlgeschlagen', description: errorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return <article className="space-y-4 rounded-xl border border-purple-400/25 bg-slate-950/80 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold">{s.name || `Fund aus ${s.city}`}</h2>
        <p className="text-xs text-muted-foreground">{s.city} · {new Date(s.created_at).toLocaleString('de-DE')}</p></div>
      <span className={s.status === 'approved' ? 'text-sm text-green-300' : s.status === 'rejected' || s.status === 'ai_failed' ? 'text-sm text-red-300' : 'text-sm text-purple-200'}>{STATUS_LABELS[s.status]}</span>
    </div>
    {imageUrl && <img src={imageUrl} alt={`Eingereichtes Kamerafoto aus ${s.city}`} className="max-h-80 w-full rounded-lg object-contain bg-black/30" />}
    {s.stats_need_review && <p role="status" className="text-sm text-amber-200">Migrierte Werte: Frühere Fleckenwerte wurden wiederhergestellt; ohne frühere Bewertung gilt vorläufig 50. Vor der Freigabe bitte Werte und Balance anhand der Funddetails prüfen.</p>}
    {s.submitted_name && s.submitted_description && <details className="text-sm">
      <summary className="cursor-pointer text-purple-200">Unveränderter Spielertext</summary>
      <p className="mt-2 font-semibold">{s.submitted_name}</p>
      <p className="whitespace-pre-wrap">{s.submitted_description}</p>
    </details>}
    <details className="text-sm"><summary className="cursor-pointer text-purple-200">Funddetails und Stat-Vergleich</summary>
      <dl className="mt-3 space-y-2">
        <div><dt className="text-muted-foreground">Fundort / Funddatum</dt><dd>{s.location}, {s.city}, {s.country} · {s.found_on}</dd></div>
        <div><dt className="text-muted-foreground">Auffälligkeiten</dt><dd className="whitespace-pre-wrap">{s.observations}</dd></div>
        <div><dt className="text-muted-foreground">Umgebung</dt><dd className="whitespace-pre-wrap">{s.surroundings}</dd></div>
        {s.discovery_story && <div><dt className="text-muted-foreground">Fundgeschichte</dt><dd className="whitespace-pre-wrap">{s.discovery_story}</dd></div>}
      </dl>
      <table className="mt-4 w-full text-left"><thead><tr><th>Stat</th><th>Vorschlag</th><th>Geprüft</th></tr></thead>
        <tbody>{STAT_FIELDS.map(({ key, label }) => <tr key={key}><td>{label}</td><td>{proposed?.[key] ?? '–'}</td><td>{stats?.[key] ?? '–'}</td></tr>)}</tbody>
      </table>
    </details>
    {s.description && <p className="text-sm whitespace-pre-wrap">{s.description}</p>}
    {aiReasoning && <p className="text-sm text-cyan-200"><strong>KI-Balancing:</strong> {aiReasoning}</p>}
    {textReview && <div className={`rounded-lg border p-3 text-sm ${textReview.needs_review ? 'border-amber-400/50 text-amber-200' : 'border-cyan-400/25 text-cyan-200'}`}>
      <strong>{textReview.needs_review ? 'KI-Texthinweis · Moderation prüfen' : 'KI-Textprüfung · unauffällig'}</strong>
      <p className="whitespace-pre-wrap">{String(textReview.reasoning)}</p>
    </div>}
    {hasCorrections && <details className="text-sm">
      <summary className="cursor-pointer text-purple-200">KI-Korrekturvorschlag (nicht automatisch übernommen)</summary>
      <p className="mt-2 font-semibold">{correctedName}</p>
      <p className="whitespace-pre-wrap">{correctedDescription}</p>
      {moderation && s.status === 'pending_review' && correctedName !== null && correctedDescription !== null && <Button variant="outline" disabled={busy} onClick={() => {
        setName(correctedName)
        setDescription(correctedDescription)
      }}>Korrektur in die Moderationsfassung übernehmen</Button>}
    </details>}
    {s.ai_error && <p role="alert" className="text-sm text-red-300">{s.ai_error}</p>}
    {s.moderation_notes && <p className="text-sm text-amber-200"><strong>Moderation:</strong> {s.moderation_notes}</p>}
    {s.status === 'approved' && <Link to="/collection" className="block text-sm text-green-300 underline">Deine Kopie in der Sammlung ansehen</Link>}
    {user?.id === s.user_id && canRetry && s.ai_attempts < 3 && <Button disabled={busy} onClick={() => act('generate')}>
      {busy ? 'KI prüft …' : s.ai_attempts ? 'KI-Prüfung erneut starten' : 'KI-Prüfung starten'}
    </Button>}
    {s.status === 'ai_failed' && s.ai_attempts >= 3 && <p className="text-sm text-red-300">Drei KI-Versuche ausgeschöpft. Bitte die Moderation kontaktieren; eine Freigabe ohne KI-Prüfung ist nicht möglich.</p>}
    {moderation && s.status === 'publishing' && <Button disabled={busy} onClick={() => act('approve')}>{busy ? 'Veröffentlicht …' : 'Veröffentlichung abschließen / erneut versuchen'}</Button>}
    {moderation && !['publishing', 'approved', 'rejected'].includes(s.status) && <fieldset disabled={busy} className="space-y-4 border-t border-white/10 pt-4">
      <legend className="text-sm font-semibold">Manuelle Prüfung</legend>
      {s.status === 'pending_review' && stats && <>
        <label className="block text-sm">Kartenname<Input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block text-sm">Kartentext<textarea className="mt-1 min-h-28 w-full rounded-lg border border-input bg-background p-3" maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <StatInputs value={stats} onChange={setStats} />
        <p className="text-xs text-muted-foreground">Verbindliches Budget: maximal 300 Punkte, höchstens ein Wert über 85. Aktuell: {Object.values(stats).reduce((sum, v) => sum + v, 0)}.</p>
        <label className="block text-sm">Seltenheit<select className="ml-3 rounded-lg bg-slate-900 p-3" value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
          <option value="common">Gewöhnlich</option><option value="rare">Selten</option><option value="epic">Episch</option><option value="legendary">Legendär</option>
        </select></label>
      </>}
      <label className="block text-sm">Rückmeldung an den Spieler (bei Ablehnung erforderlich)
        <textarea maxLength={1500} className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background p-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        {s.status === 'pending_review' && <><Button variant="outline" onClick={() => act('save')}>Änderungen speichern</Button>
          <Button onClick={() => act('approve')}>Freigeben & Kopie vergeben</Button></>}
        <Button variant="destructive" disabled={notes.trim().length < 3} onClick={() => act('reject')}>Ablehnen</Button>
      </div>
    </fieldset>}
  </article>
}

export function GenerationSettings() {
  const [guide, setGuide] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['generation-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('card_generation_settings').select('style_guide').eq('id', true).single()
      if (error) throw error
      return data
    },
  })
  async function save() {
    setBusy(true)
    try {
      const { data, error } = await supabase.from('card_generation_settings').update({ style_guide: guide ?? query.data?.style_guide })
        .eq('id', true).select('id').single()
      if (error) throw error
      if (!data) throw new Error('Stilvorgabe wurde nicht gespeichert.')
      setGuide(null)
      await queryClient.invalidateQueries({ queryKey: ['generation-settings'] })
      toast({ title: 'Stilvorgabe gespeichert', description: 'Gilt für zukünftige KI-Prüfungen. Bereits geprüfte Karten bleiben unverändert.' })
    } catch (err) {
      toast({ title: 'Speichern fehlgeschlagen', description: errorMessage(err), variant: 'destructive' })
    } finally { setBusy(false) }
  }
  return <section className="space-y-4 rounded-xl border border-purple-400/25 p-5">
    <h2 className="font-semibold">KI-Stilvorgabe</h2>
    <p className="text-sm text-muted-foreground">Bewertungsmaßstab für Spielertexte, kein Auftrag zum Umschreiben. Hier eine allgemeine Stilbeschreibung und freigegebene, anonymisierte Beispiele hinterlegen – keine privaten WhatsApp-Exporte. Dieser Text wird an OpenAI gesendet. Die KI darf nur Rechtschreibung und Grammatik als Korrektur vorschlagen; deutliche Stilabweichungen markiert sie für die Moderation. Die Sicherheits- und Balancing-Regeln bleiben verbindlich.</p>
    {query.isError && <p role="alert">{errorMessage(query.error)}</p>}
    {query.isPending ? <p role="status">Stilvorgabe wird geladen …</p> : query.data && <>
      <label className="block text-sm">Stilbeschreibung<textarea className="mt-2 min-h-52 w-full rounded-lg border border-input bg-background p-3" maxLength={6000} value={guide ?? query.data.style_guide} onChange={(e) => setGuide(e.target.value)} /></label>
      <Button disabled={busy || (guide ?? query.data.style_guide).trim().length < 20} onClick={save}>{busy ? 'Speichert …' : 'Stilvorgabe speichern'}</Button>
    </>}
  </section>
}
