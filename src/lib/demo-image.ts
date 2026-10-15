const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function createDemoImageDataUrl(file: File): Promise<string> {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Nur JPEG-, PNG- und WEBP-Bilder können lokal verarbeitet werden.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Das Bild darf höchstens 5 MB groß sein.')
  }

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Das Bild konnte im Browser nicht verarbeitet werden.')

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.55)
    if (dataUrl.length > 240_000) {
      throw new Error('Das komprimierte Bild ist für den lokalen Demo-Speicher noch zu groß.')
    }
    return dataUrl
  } finally {
    bitmap.close()
  }
}