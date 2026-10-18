import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportImageCrop, getImageCrop } from '@/lib/image-crop'
import { errorMessage } from '@/lib/submissions'

export function ImageCropper({ source, outputType, onApply, onCancel }: {
  source: Blob
  outputType: 'image/png' | 'image/jpeg'
  onApply: (file: File) => void
  onCancel: () => void
}) {
  const image = useRef<HTMLImageElement>(null)
  const active = useRef(true)
  const exporting = useRef(false)
  const drag = useRef<{ id: number; x: number; y: number; horizontal: number; vertical: number } | null>(null)
  const [url, setUrl] = useState('')
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [horizontal, setHorizontal] = useState(50)
  const [vertical, setVertical] = useState(50)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    active.current = true
    const objectUrl = URL.createObjectURL(source)
    setUrl(objectUrl)
    return () => {
      active.current = false
      URL.revokeObjectURL(objectUrl)
    }
  }, [source])

  const selection = { zoom, horizontal, vertical }
  const crop = dimensions ? getImageCrop(dimensions.width, dimensions.height, selection) : null

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

  return <section aria-label="Bildausschnitt wählen" className="space-y-4 rounded-xl border border-purple-400/40 bg-slate-900 p-4">
    <h3 className="font-semibold">Bildausschnitt wählen</h3>
    <p className="text-sm text-muted-foreground">Der Ausschnitt ist immer quadratisch (1:1). Das sichtbare Bild wird gespeichert. Zum Verschieben ziehen oder die Regler nutzen.</p>
    {url && <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-black touch-none"
      style={{ aspectRatio: 1, width: 'min(100%, 45dvh)' }}
      onPointerDown={(event) => {
        if (busy || !dimensions || event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal, vertical }
      }}
      onPointerMove={(event) => {
        const start = drag.current
        if (!start || start.id !== event.pointerId || !crop || !dimensions || busy) return
        const bounds = event.currentTarget.getBoundingClientRect()
        const extraWidth = dimensions.width - crop.width
        const extraHeight = dimensions.height - crop.height
        const clamp = (value: number) => Math.min(100, Math.max(0, value))
        if (extraWidth > 0) setHorizontal(clamp(start.horizontal - (event.clientX - start.x) / bounds.width * crop.width / extraWidth * 100))
        if (extraHeight > 0) setVertical(clamp(start.vertical - (event.clientY - start.y) / bounds.height * crop.height / extraHeight * 100))
      }}
      onPointerUp={() => { drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
      onLostPointerCapture={() => { drag.current = null }}
    >
      <img ref={image} src={url} alt="Vorschau des gewählten Bildausschnitts" draggable={false}
        className="absolute max-w-none select-none"
        style={crop && dimensions ? {
          width: `${dimensions.width / crop.width * 100}%`, height: `${dimensions.height / crop.height * 100}%`,
          left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%`,
        } : { width: '100%', height: '100%', objectFit: 'contain' }}
        onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        onError={() => { setDimensions(null); setError('Das Bild konnte nicht geöffnet werden. Bitte ein anderes Foto wählen.') }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border-2 border-purple-300/80">
        {Array.from({ length: 9 }, (_, index) => <span key={index} className="border border-white/20" />)}
      </div>
    </div>}
    <fieldset disabled={busy || !dimensions} className="space-y-3">
      <label className="block text-sm">Zoom: {zoom.toFixed(2)}×
        <input className="block w-full accent-purple-500" type="range" min="1" max="4" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
      </label>
      <label className="block text-sm">Horizontaler Ausschnitt
        <input className="block w-full accent-purple-500" type="range" min="0" max="100" step="0.1" value={horizontal}
          disabled={!crop || !dimensions || dimensions.width - crop.width < 0.001} onChange={(event) => setHorizontal(Number(event.target.value))} />
      </label>
      <label className="block text-sm">Vertikaler Ausschnitt
        <input className="block w-full accent-purple-500" type="range" min="0" max="100" step="0.1" value={vertical}
          disabled={!crop || !dimensions || dimensions.height - crop.height < 0.001} onChange={(event) => setVertical(Number(event.target.value))} />
      </label>
      <Button type="button" variant="outline" onClick={() => { setZoom(1); setHorizontal(50); setVertical(50) }}>Ausschnitt zurücksetzen</Button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button type="button" disabled={busy || !dimensions} onClick={apply}>{busy ? 'Verarbeitet …' : 'Ausschnitt übernehmen'}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Abbrechen</Button>
    </div>
  </section>
}
