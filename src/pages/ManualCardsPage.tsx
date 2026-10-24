import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatInputs } from '@/components/cards/StatInputs'
import { ImageCropper } from '@/components/cards/ImageCropper'
import { validateCardImage } from '@/lib/image-crop'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/submissions'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { DEFAULT_STATS } from '@/types/submissions'
import type { Rarity } from '@/types'

async function loadManualCards(page: number) {
  const { data, error } = await supabase.from('manual_card_entries')
    .select('*, cards!inner(*,profiles!cards_photographer_id_fkey(username)), user_cards(id,user_id,profiles!user_cards_user_id_fkey(username))')
    .order('updated_at', { ascending: false }).order('card_id')
    .range(page * 20, page * 20 + 19)
  if (error) throw error
  return data
}
type EditorRecord = Awaited<ReturnType<typeof loadManualCards>>[number]
type Owner = { id: string; username: string }

export function ManualCardsPage() {
  const { user, profile, isLoading } = useAuthStore()
  if (isLoading) return <p role="status" className="p-6">Berechtigung wird geprüft …</p>
  if (!user || !profile || profile.is_banned || (!profile.is_admin && !profile.is_moderator)) return <Navigate to="/" replace />
  return <ManualCardsEditor />
}

function ManualCardsEditor() {
  const userId = useAuthStore((state) => state.user!.id)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<EditorRecord | 'new' | null>(null)
  const query = useQuery({
    queryKey: ['manual-cards', userId, page],
    queryFn: () => loadManualCards(page),
    staleTime: 0,
  })
  async function saved() {
    setEditing(null)
    setPage(0)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['manual-cards'] }),
      queryClient.invalidateQueries({ queryKey: ['catalogue'] }),
    ])
    const { data, error } = await supabase.from('profiles').select('cards_collected').eq('id', userId).single()
    if (error) {
      toast({ title: 'Karte gespeichert · Profilanzeige nicht aktualisiert', description: error.message, variant: 'destructive' })
      return
    }
    const state = useAuthStore.getState()
    if (state.user?.id === userId && state.profile) state.setProfile({ ...state.profile, cards_collected: data.cards_collected })
  }
  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
    <header className="space-y-2"><h1 className="text-2xl font-bold">Manueller Karteneditor</h1>
      <p className="text-sm text-muted-foreground">PNG oder JPG/JPEG hochladen, Bildausschnitt wählen, Werte setzen und optional eine Besitzkopie vergeben. Nur für Admins und Moderatoren.</p>
      <Link to="/admin" className="inline-block text-sm text-purple-300 underline">Zur Administration</Link></header>
    {editing !== null ? <ManualCardForm key={editing === 'new' ? 'new' : `${editing.card_id}:${editing.revision}`}
      entry={editing === 'new' ? undefined : editing} onSaved={saved} onClose={() => setEditing(null)} />
      : <Button onClick={() => setEditing('new')}>Neue Karte erstellen</Button>}
    <section className="space-y-4" aria-label="Manuell erstellte Karten">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Vorhandene Editor-Karten</h2>
        <Button variant="outline" disabled={editing !== null || query.isFetching} onClick={() => query.refetch()}>Liste neu laden</Button>
      </div>
      {query.isPending && <p role="status">Karten werden geladen …</p>}
      {query.isError && <div role="alert"><p>{errorMessage(query.error)}</p><Button variant="outline" onClick={() => query.refetch()}>Erneut laden</Button></div>}
      {query.data?.length === 0 && <p className="text-sm text-muted-foreground">Noch keine manuell erstellten Karten vorhanden.</p>}
      {query.data?.map((entry) => <article key={entry.card_id} className="flex items-center gap-4 rounded-xl border border-purple-400/25 bg-slate-950/80 p-4">
        <img src={entry.cards.image_url} alt="" className="h-20 w-16 shrink-0 rounded-lg object-contain bg-black/30" />
        <div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{entry.cards.name}</h3>
          <p className="break-words text-sm text-muted-foreground">Besitzer: {entry.user_cards?.profiles?.username ?? entry.user_cards?.user_id ?? 'Keiner'}</p>
          <p className="text-xs text-muted-foreground">Version {entry.revision}</p></div>
        {entry.cards.stats_need_review && <span className="text-xs text-amber-200">Neue Attribute prüfen</span>}
        <Button variant="outline" disabled={editing !== null} onClick={() => setEditing(entry)}>Bearbeiten</Button>
      </article>)}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={page === 0 || editing !== null} onClick={() => setPage(page - 1)}>Vorherige</Button>
        <span className="text-sm">Seite {page + 1}</span>
        <Button variant="outline" disabled={!query.data || query.data.length < 20 || editing !== null} onClick={() => setPage(page + 1)}>Weitere</Button>
      </div>
    </section>
  </div>
}

function ManualCardForm({ entry, onSaved, onClose }: {
  entry?: EditorRecord; onSaved: () => Promise<void>; onClose: () => void
}) {
  const currentUsername = useAuthStore((state) => state.profile?.username ?? '')
  const [id] = useState(() => entry?.card_id ?? crypto.randomUUID())
  const [name, setName] = useState(entry?.cards.name ?? '')
  const [description, setDescription] = useState(entry?.cards.description ?? '')
  const [photographerUsername, setPhotographerUsername] = useState(
    entry?.cards.photographer_username ?? entry?.cards.profiles?.username ?? currentUsername,
  )
  const [city, setCity] = useState(entry?.cards.city ?? '')
  const [location, setLocation] = useState(entry?.cards.location ?? '')
  const [country, setCountry] = useState(entry?.cards.country ?? 'DE')
  const [rarity, setRarity] = useState<Rarity>(entry?.cards.rarity ?? 'common')
  const [notes, setNotes] = useState(entry?.cards.notes ?? '')
  const [stats, setStats] = useState(entry ? {
    witterung: entry.cards.stat_witterung, flecken: entry.cards.stat_flecken, ambiente: entry.cards.stat_ambiente,
    komfort: entry.cards.stat_komfort, charakter: entry.cards.stat_charakter,
  } : { ...DEFAULT_STATS })
  const [owner, setOwner] = useState<Owner | null>(entry?.user_cards ? {
    id: entry.user_cards.user_id, username: entry.user_cards.profiles?.username ?? entry.user_cards.user_id,
  } : null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [source, setSource] = useState<Blob | null>(null)
  const [cropSource, setCropSource] = useState<Blob | null>(null)
  const cropping = cropSource !== null
  const [preview, setPreview] = useState(entry?.cards.image_url ?? '')
  const [busy, setBusy] = useState(false)
  const [imageError, setImageError] = useState('')
  const [validatingImage, setValidatingImage] = useState(false)
  const [saveError, setSaveError] = useState('')
  const saving = useRef(false)
  const selecting = useRef(0)
  const uploaded = useRef<{ file: File; path: string } | null>(null)
  const originalOwner = entry?.user_cards?.user_id ?? null
  const total = Object.values(stats).reduce((sum, value) => sum + value, 0)
  const balanced = total <= 300 && Object.values(stats).filter((value) => value > 85).length <= 1
  const valid = name.trim().length >= 2 && description.trim().length >= 10 && city.trim().length >= 2
    && location.trim().length >= 2 && /^[A-Z]{2}$/.test(country) && balanced && !validatingImage && !imageError && !cropping
    && photographerUsername.length <= 50 && !/[\r\n]/.test(photographerUsername)
    && (!!photo || !!entry?.image_path)

  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])
  useEffect(() => () => { selecting.current += 1 }, [])

  async function selectImage(file: File | undefined) {
    const attempt = ++selecting.current
    if (!file) return
    setImageError('')
    setValidatingImage(true)
    try {
      await validateCardImage(file)
      if (selecting.current === attempt) {
        setCropSource(file)
      }
    } catch (err) {
      if (selecting.current === attempt) setImageError(errorMessage(err))
    } finally {
      if (selecting.current === attempt) setValidatingImage(false)
    }
  }

  async function editCrop() {
    setImageError('')
    if (source) { setCropSource(source); return }
    if (!entry) return
    const attempt = ++selecting.current
    setValidatingImage(true)
    try {
      const { data, error } = await supabase.storage.from('manual-card-images').download(entry.image_path)
      if (error) throw error
      if (selecting.current === attempt) {
        setCropSource(data)
      }
    } catch (err) {
      if (selecting.current === attempt) setImageError(errorMessage(err))
    } finally {
      if (selecting.current === attempt) setValidatingImage(false)
    }
  }

  async function save() {
    if (!valid || saving.current) return
    saving.current = true
    setBusy(true)
    setSaveError('')
    try {
      let path = entry?.image_path ?? ''
      if (photo) {
        if (uploaded.current?.file === photo) path = uploaded.current.path
        else {
          path = `${id}/${crypto.randomUUID()}.png`
          const { error } = await supabase.storage.from('manual-card-images').upload(path, photo, { contentType: 'image/png', upsert: false })
          if (error) throw error
          uploaded.current = { file: photo, path }
        }
      }
      const { data: image } = supabase.storage.from('manual-card-images').getPublicUrl(path)
      const { data, error } = await supabase.rpc('save_manual_card', {
        p_id: id, p_expected_revision: entry?.revision ?? 0, p_image_path: path, p_owner_id: owner?.id,
        p_data: {
          name: name.trim(), description: description.trim(), city: city.trim(), location: location.trim(),
          country, rarity, notes: notes.trim(), stats: { ...stats }, image_url: image.publicUrl,
          photographer_username: photographerUsername.trim() || null,
        },
      })
      if (error) throw error
      if (data !== id) throw new Error('Der Server hat das Speichern nicht bestätigt.')
      toast({ title: entry ? 'Karte aktualisiert' : 'Karte erstellt', description: 'Die Karte ist im Spiel. Die verknüpfte Besitzkopie wurde entsprechend deiner Auswahl zugeordnet.' })
      await onSaved()
    } catch (err) {
      setSaveError(errorMessage(err))
      toast({ title: 'Karte nicht gespeichert', description: errorMessage(err), variant: 'destructive' })
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return <form className="space-y-5 rounded-xl border border-purple-400/25 bg-slate-950/80 p-5"
    onSubmit={(event) => { event.preventDefault(); void save() }}>
    <h2 className="text-lg font-semibold">{entry ? 'Karte bearbeiten' : 'Neue Karte'}</h2>
    <fieldset disabled={busy} className="space-y-4">
      <label className="block text-sm">Kartenbild (PNG oder JPG/JPEG, maximal 5 MB)
        <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" disabled={cropping} className="mt-2 block w-full text-sm" onChange={(event) => {
          void selectImage(event.target.files?.[0])
          event.target.value = ''
        }} />
      </label>
      <p className="text-xs text-muted-foreground">Der bestätigte Ausschnitt wird als PNG gespeichert und ist öffentlich. JPG/JPEG wird automatisch umgewandelt. Nur eigene oder freigegebene Bilder ohne private Daten nutzen. Änderungen gelten für alle Kopien dieser Karte.</p>
      {imageError && <p role="alert" className="text-sm text-red-300">{imageError}</p>}
      {validatingImage && <p role="status" className="text-sm">Bild wird geladen und geprüft …</p>}
      {cropSource ? <ImageCropper source={cropSource} outputType="image/png"
        onApply={(file) => { setPhoto(file); setSource(cropSource); uploaded.current = null; setCropSource(null); setImageError('') }}
        onCancel={() => { setCropSource(null); setImageError('') }} />
        : <>
          {preview && <img src={preview} alt="Kartenbild-Vorschau" className="max-h-80 w-full rounded-lg bg-black/30 object-contain" />}
          {(source || entry) && <Button type="button" variant="outline" disabled={validatingImage} onClick={editCrop}>Ausschnitt ändern</Button>}
        </>}
      <label className="block text-sm">Kartenname<Input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="block text-sm">Kartentext<textarea required minLength={10} maxLength={1000} className="mt-1 min-h-28 w-full rounded-lg border border-input bg-background p-3 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label className="block text-sm">Fotograf:in (@-Credit)<Input maxLength={50} value={photographerUsername}
        onChange={(event) => setPhotographerUsername(event.target.value)} /></label>
      <p className="-mt-3 text-xs text-muted-foreground">Wird auf der Karte mit @ angezeigt. Leer lassen, um den Profilnamen zu verwenden.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Stadt<Input required minLength={2} maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} /></label>
        <label className="block text-sm">Fundort / Viertel<Input required minLength={2} maxLength={150} value={location} onChange={(event) => setLocation(event.target.value)} /></label>
        <label className="block text-sm">Land (Ländercode)<Input required pattern="[A-Z]{2}" maxLength={2} value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} /></label>
        <label className="block text-sm">Seltenheit<select className="mt-1 w-full rounded-lg border border-input bg-background p-3" value={rarity} onChange={(event) => setRarity(event.target.value as Rarity)}>
          <option value="common">Gewöhnlich</option><option value="rare">Selten</option><option value="epic">Episch</option><option value="legendary">Legendär</option>
        </select></label>
      </div>
      <StatInputs value={stats} onChange={setStats} />
      <p role="status" className={balanced ? 'text-sm text-muted-foreground' : 'text-sm text-red-300'}>{total} / 300 Punkte · höchstens ein Wert über 85.</p>
      <label className="block text-sm">Notizen (optional)<textarea maxLength={1500} className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background p-3 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <OwnerPicker selected={owner} onChange={setOwner} />
      {originalOwner !== (owner?.id ?? null) && <p className="rounded-lg border border-amber-300/30 p-3 text-sm text-amber-200">
        {originalOwner ? 'Beim Speichern wird die verknüpfte Kopie beim bisherigen Besitzer entfernt.' : 'Bisher ist keine Besitzkopie zugeordnet.'}
        {owner ? ` Genau eine Editor-Kopie wird ${owner.username} zugeordnet.` : ' Es wird keine neue Kopie vergeben.'} Andere Kopien bleiben unverändert.
      </p>}
    </fieldset>
    {saveError && <div role="alert" className="space-y-2 text-sm text-red-300"><p>{saveError}</p>
      <p>Bei einem veralteten Stand oder unklarem Netzwerkfehler den Editor schließen und die Kartenliste neu laden, bevor du erneut speicherst.</p></div>}
    <p className="text-xs text-muted-foreground">Speichern veröffentlicht die Karte direkt ohne KI-Prüfung. Kartenwerte gelten für alle Kopien; der Besitzer steuert nur die einzelne, nicht handelbare Editor-Kopie.</p>
    <div className="flex flex-wrap gap-3">
      <Button type="submit" disabled={busy || !valid}>{busy ? 'Speichert …' : entry ? 'Änderungen speichern' : 'Karte erstellen & veröffentlichen'}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Editor schließen</Button>
    </div>
  </form>
}

function OwnerPicker({ selected, onChange }: { selected: Owner | null; onChange: (owner: Owner | null) => void }) {
  const userId = useAuthStore((state) => state.user!.id)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const query = useQuery({
    queryKey: ['manual-card-owners', userId, search],
    enabled: search.length >= 2,
    queryFn: async () => {
      const term = search.replace(/[\\%_]/g, '\\$&')
      const { data, error } = await supabase.from('profiles').select('id,username')
        .eq('is_banned', false).ilike('username', `%${term}%`).order('username').limit(20)
      if (error) throw error
      return data
    },
  })
  return <section className="space-y-3 rounded-lg border border-white/15 p-4" aria-label="Besitzkopie zuordnen">
    <h3 className="font-semibold">Besitzer (optional)</h3>
    <p className="break-words text-sm">Aktuell gewählt: {selected?.username ?? 'Kein Besitzer'}</p>
    {selected && <Button type="button" variant="outline" onClick={() => onChange(null)}>Besitzer entfernen</Button>}
    <label className="block text-sm">Spieler nach Benutzername suchen<Input maxLength={100} value={input} onChange={(event) => setInput(event.target.value)}
      onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); setSearch(input.trim()) } }} /></label>
    <Button type="button" variant="outline" disabled={input.trim().length < 2 || query.isFetching} onClick={() => {
      if (search === input.trim()) void query.refetch()
      else setSearch(input.trim())
    }}>Spieler suchen</Button>
    {search && query.isFetching && <p role="status" className="text-sm">Spieler werden gesucht …</p>}
    {query.isError && <p role="alert" className="text-sm text-red-300">{errorMessage(query.error)}</p>}
    {query.data?.length === 0 && <p className="text-sm text-muted-foreground">Keine passenden Spieler gefunden.</p>}
    {query.data && query.data.length > 0 && <ul className="space-y-2" aria-label="Gefundene Spieler">
      {query.data.map((owner) => <li key={owner.id}><Button type="button" className="h-auto min-h-11 max-w-full whitespace-normal break-all text-left" variant={owner.id === selected?.id ? 'default' : 'outline'}
        onClick={() => onChange(owner)}>{owner.username}{owner.id === selected?.id ? ' · ausgewählt' : ''}</Button></li>)}
    </ul>}
    {query.data?.length === 20 && <p className="text-xs text-muted-foreground">Die ersten 20 Treffer werden angezeigt. Bitte die Suche eingrenzen.</p>}
  </section>
}
