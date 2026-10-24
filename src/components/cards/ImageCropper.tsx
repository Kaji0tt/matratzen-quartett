import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportImageCrop, getImageCrop, moveImageCrop } from '@/lib/image-crop'
import { errorMessage } from '@/lib/submissions'

export function ImageCropper({ source, outputType, onApply, onCancel, fullscreen = false }: {
  source: Blob
  outputType: 'image/png' | 'image/jpeg'
  onApply: (file: File) => void
  onCancel: () => void
  fullscreen?: boolean
}) {
  const image = useRef<HTMLImageElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const active = useRef(true)
  const exporting = useRef(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const [url, setUrl] = useState('')
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [selection, setSelection] = useState({ zoom: 1, horizontal: 50, vertical: 50 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    active.current = true
    const objectUrl = URL.createObjectURL(source)
    setUrl(objectUrl)
    setDimensions(null)
    setSelection({ zoom: 1, horizontal: 50, vertical: 50 })
    pointers.current.clear()
    return () => {
      active.current = false
      URL.revokeObjectURL(objectUrl)
    }
  }, [source])

  const crop = dimensions ? getImageCrop(dimensions.width, dimensions.height, selection) : null

  function gesture(bounds: DOMRect) {
    const [first, second = first] = [...pointers.current.values()]
    return {
      x: ((first.x + second.x) / 2 - bounds.left) / bounds.width,
      y: ((first.y + second.y) / 2 - bounds.top) / bounds.height,
      distance: Math.hypot(first.x - second.x, first.y - second.y),
    }
  }

  async function apply() {
    if (!image.current || !dimensions || exporting.current) return
    exporting.current = true
    setBusy(true)
    setError('')
    try {
      const file = await exportImageCrop(image.current, selection, outputType)
      if (active.current) onApply(file)
    } catch (err) {
      if (active.current) setError(errorMessage(err))
    } finally {
      exporting.current = false
      if (active.current) setBusy(false)
    }
  }

  return <section aria-label="Bildausschnitt wählen" className={fullscreen ? 'submission-crop' : 'space-y-4 rounded-xl border border-purple-400/40 bg-slate-900 p-4'}>
    {fullscreen && url && <img src={url} alt="" aria-hidden="true" className="submission-crop-backdrop" />}
    <div className={fullscreen ? 'submission-crop-stage touch-none' : 'touch-none'}
        onPointerDown={(event) => {
          if (busy || !dimensions || event.button !== 0 || pointers.current.size >= 2) return
          event.currentTarget.setPointerCapture(event.pointerId)
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId) || !dimensions || !surface.current || busy) return
          const bounds = surface.current.getBoundingClientRect()
          const before = gesture(bounds)
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
          const after = gesture(bounds)
          setSelection((current) => moveImageCrop(dimensions.width, dimensions.height, current, before, after))
        }}
        onPointerUp={(event) => pointers.current.delete(event.pointerId)}
        onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
        onLostPointerCapture={(event) => pointers.current.delete(event.pointerId)}
    >
      {url && <div ref={surface} className={fullscreen ? 'submission-crop-window' : 'relative mx-auto aspect-square w-full overflow-hidden bg-black'}
        style={fullscreen ? undefined : { maxWidth: 'min(100%, 45dvh)' }}>
        <img ref={image} src={url} alt="Vorschau des gewählten Bildausschnitts" draggable={false}
          className="pointer-events-none absolute max-w-none select-none"
          style={crop && dimensions ? {
            width: `${dimensions.width / crop.width * 100}%`, height: `${dimensions.height / crop.height * 100}%`,
            left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%`,
          } : { width: '100%', height: '100%', objectFit: 'contain' }}
          onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
          onError={() => { setDimensions(null); setError('Das Bild konnte nicht geöffnet werden. Bitte ein anderes Foto wählen.') }} />
        <div aria-hidden="true" className={fullscreen ? 'submission-crop-mask' : 'pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border-2 border-purple-300/80'}>
          {!fullscreen && Array.from({ length: 9 }, (_, index) => <span key={index} className="border border-white/20" />)}
        </div>
      </div>}
    </div>
    <div className={fullscreen ? 'submission-crop-tools' : 'flex justify-center gap-3'}>
      <Button type="button" variant="outline" className={fullscreen ? 'submission-tool submission-tool--round' : undefined} aria-label="Verkleinern" disabled={busy || !dimensions || selection.zoom <= 1}
        onClick={() => setSelection((current) => ({ ...current, zoom: Math.max(1, current.zoom - 0.25) }))}><Minus className="h-4 w-4" /></Button>
      <Button type="button" variant="outline" className={fullscreen ? 'submission-tool submission-tool--round' : undefined} aria-label="Ausschnitt zurücksetzen" disabled={busy || !dimensions}
        onClick={() => setSelection({ zoom: 1, horizontal: 50, vertical: 50 })}><RotateCcw className="h-4 w-4" /></Button>
      <Button type="button" variant="outline" className={fullscreen ? 'submission-tool submission-tool--round' : undefined} aria-label="Vergrößern" disabled={busy || !dimensions || selection.zoom >= 4}
        onClick={() => setSelection((current) => ({ ...current, zoom: Math.min(4, current.zoom + 0.25) }))}><Plus className="h-4 w-4" /></Button>
    </div>
    {error && <p role="alert" className={fullscreen ? 'submission-crop-error' : 'text-sm text-red-300'}>{error}</p>}
    <div className={fullscreen ? 'submission-crop-actions' : 'flex flex-wrap gap-3'}>
      <Button type="button" className={fullscreen ? 'submission-tool submission-tool--confirm' : undefined} aria-label="Ausschnitt übernehmen" disabled={busy || !dimensions} onClick={apply}>
        {fullscreen && <Check aria-hidden="true" className="h-5 w-5" />}{busy ? 'Verarbeitet …' : fullscreen ? 'Übernehmen' : 'Ausschnitt übernehmen'}
      </Button>
      {!fullscreen && <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Abbrechen</Button>}
    </div>
  </section>
}
