export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export interface CropSelection {
  zoom: number
  horizontal: number
  vertical: number
  aspect: number
}

export function getImageCrop(width: number, height: number, selection: CropSelection) {
  const { zoom, horizontal, vertical, aspect } = selection
  if (![width, height, zoom, horizontal, vertical, aspect].every(Number.isFinite)
    || width <= 0 || height <= 0 || aspect <= 0 || zoom < 1 || zoom > 4
    || horizontal < 0 || horizontal > 100 || vertical < 0 || vertical > 100) {
    throw new Error('Ungültiger Bildausschnitt.')
  }
  const cropWidth = Math.min(width, height * aspect) / zoom
  const cropHeight = cropWidth / aspect
  return {
    x: (width - cropWidth) * horizontal / 100,
    y: Math.max(0, height - cropHeight) * vertical / 100,
    width: cropWidth,
    height: cropHeight,
  }
}

export async function validateCardImage(file: File): Promise<void> {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Bitte ein PNG oder JPG/JPEG mit maximal 5 MB auswählen.')
  }
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!png && !jpeg) throw new Error('Die Datei ist kein gültiges PNG oder JPG/JPEG.')
  if (file.type && file.type !== (png ? 'image/png' : 'image/jpeg')) {
    throw new Error('Dateityp und Bildinhalt stimmen nicht überein. Bitte ein PNG oder JPG/JPEG auswählen.')
  }
}

export async function exportImageCrop(
  image: HTMLImageElement, selection: CropSelection, type: 'image/png' | 'image/jpeg'
): Promise<File> {
  const crop = getImageCrop(image.naturalWidth, image.naturalHeight, selection)
  const canvas = document.createElement('canvas')
  let scale = Math.min(1, 1600 / Math.max(crop.width, crop.height))
  for (let attempt = 0; attempt < 4; attempt += 1) {
    canvas.width = Math.max(1, Math.round(crop.width * scale))
    canvas.height = Math.max(1, Math.round(crop.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Dein Browser kann den Bildausschnitt nicht verarbeiten.')
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result || result.type !== type) reject(new Error('Der Bildausschnitt konnte nicht gespeichert werden.'))
        else resolve(result)
      }, type, 0.9)
    })
    if (blob.size <= MAX_IMAGE_BYTES) {
      return new File([blob], `matratze.${type === 'image/png' ? 'png' : 'jpg'}`, { type })
    }
    scale *= 0.75
  }
  throw new Error('Der Bildausschnitt ist größer als 5 MB. Bitte einen kleineren Ausschnitt wählen.')
}
