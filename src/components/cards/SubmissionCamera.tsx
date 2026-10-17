import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/submissions'

export function SubmissionCamera({ onCapture }: { onCapture: (file: File, capturedAt: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const mounted = useRef(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stream.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function start() {
    setError('')
    setReady(false)
    setStarting(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Die Live-Kamera benötigt HTTPS und einen Browser mit Kamerazugriff.')
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current?.getTracks().forEach((track) => track.stop())
      stream.current = media
      if (!video.current) throw new Error('Die Kameravorschau konnte nicht geöffnet werden.')
      video.current.srcObject = media
      await video.current.play()
    } catch (err) {
      stream.current?.getTracks().forEach((track) => track.stop())
      stream.current = null
      if (mounted.current) setReady(false)
      if (mounted.current) setError(`Kamera nicht verfügbar: ${errorMessage(err)}. Bitte Kameraberechtigung prüfen.`)
    } finally {
      if (mounted.current) setStarting(false)
    }
  }

  function capture() {
    const source = video.current
    if (!source?.videoWidth || !source.videoHeight || source.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError('Noch kein Kamerabild verfügbar. Bitte erneut versuchen.')
      return
    }
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1600 / Math.max(source.videoWidth, source.videoHeight))
    canvas.width = Math.round(source.videoWidth * scale)
    canvas.height = Math.round(source.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) { setError('Dein Browser kann das Kamerafoto nicht verarbeiten.'); return }
    try {
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
    } catch (err) {
      setError(`Das Kamerafoto konnte nicht aufgenommen werden: ${errorMessage(err)}`)
      return
    }
    canvas.toBlob((blob) => {
      if (!mounted.current) return
      if (!blob || blob.size > 5 * 1024 * 1024) {
        setError('Foto konnte nicht verarbeitet werden oder ist größer als 5 MB.')
        return
      }
      onCapture(new File([blob], 'matratze.jpg', { type: 'image/jpeg' }), new Date().toISOString())
    }, 'image/jpeg', 0.85)
  }

  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Nur ein frisches Kamerafoto. Keine Galerie, keine Uploads. Bitte keine Gesichter, Kennzeichen oder privaten Daten aufnehmen.</p>
    <video ref={video} autoPlay muted playsInline aria-label="Live-Kamera"
      onLoadedData={() => setReady(true)} className="aspect-[3/4] w-full rounded-xl bg-black object-cover" />
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <Button type="button" className="w-full gap-2" onClick={ready ? capture : start} disabled={starting}>
      <Camera className="h-4 w-4" />{starting ? 'Kamera wird geöffnet …' : ready ? 'Foto aufnehmen' : 'Kamera aktivieren'}
    </Button>
  </div>
}
