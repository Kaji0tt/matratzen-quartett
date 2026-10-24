import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exportImageCrop, getImageCrop, moveImageCrop, MAX_IMAGE_BYTES, validateCardImage } from '../src/lib/image-crop.ts'

const centered = { zoom: 1, horizontal: 50, vertical: 50 }

test('one-finger dragging follows the finger and clamps at the source edges', () => {
  const before = { x: 0.5, y: 0.5, distance: 0 }
  const selection = moveImageCrop(1200, 800, centered, before, { x: 0.75, y: 0.5, distance: 0 })
  assert.deepEqual(getImageCrop(1200, 800, selection), { x: 0, y: 0, width: 800, height: 800 })
  const edge = moveImageCrop(1200, 800, centered, before, { x: -10, y: -10, distance: 0 })
  assert.deepEqual(getImageCrop(1200, 800, edge), { x: 400, y: 0, width: 800, height: 800 })
})

test('pinch zoom keeps the source pixel under the two-finger midpoint', () => {
  const before = { x: 0.3, y: 0.6, distance: 100 }
  const after = { x: 0.4, y: 0.5, distance: 200 }
  const original = getImageCrop(1200, 800, centered)
  const selection = moveImageCrop(1200, 800, centered, before, after)
  const crop = getImageCrop(1200, 800, selection)
  assert.equal(selection.zoom, 2)
  assert.equal(original.x + before.x * original.width, crop.x + after.x * crop.width)
  assert.equal(original.y + before.y * original.height, crop.y + after.y * crop.height)
})

test('pinch limits and transitions back to dragging stay square and in bounds', () => {
  for (const [width, height] of [[1200, 800], [800, 1200], [800, 800]]) {
    for (const distance of [0, 1, 10, 100, 1000]) {
      const selection = moveImageCrop(width, height, centered, { x: 0.5, y: 0.5, distance: 100 }, { x: 0.8, y: 0.1, distance })
      const dragged = moveImageCrop(width, height, selection, { x: 0.8, y: 0.1, distance: 0 }, { x: 0.6, y: 0.4, distance: 0 })
      const crop = getImageCrop(width, height, dragged)
      assert.ok(dragged.zoom >= 1 && dragged.zoom <= 4)
      assert.equal(crop.width, crop.height)
      assert.ok(crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= width && crop.y + crop.height <= height)
    }
  }
})

test('default and reset selections produce a centered square for any source format', () => {
  assert.deepEqual(getImageCrop(1200, 800, centered), { x: 200, y: 0, width: 800, height: 800 })
  assert.deepEqual(getImageCrop(800, 1200, centered), { x: 0, y: 200, width: 800, height: 800 })
  assert.deepEqual(getImageCrop(800, 800, centered), { x: 0, y: 0, width: 800, height: 800 })
})

test('square crops can select either edge without leaving the image', () => {
  assert.deepEqual(getImageCrop(1200, 800, { ...centered, horizontal: 0 }), { x: 0, y: 0, width: 800, height: 800 })
  assert.deepEqual(getImageCrop(1200, 800, { ...centered, horizontal: 100 }), { x: 400, y: 0, width: 800, height: 800 })
  assert.deepEqual(getImageCrop(800, 1200, { ...centered, vertical: 100 }), { x: 0, y: 400, width: 800, height: 800 })
})

test('zoom and position select the expected source pixels', () => {
  assert.deepEqual(getImageCrop(1200, 800, { ...centered, zoom: 2, horizontal: 100, vertical: 0 }),
    { x: 800, y: 0, width: 400, height: 400 })
})

test('all source formats, zoom levels and positions remain square and within source bounds', () => {
  for (const [width, height] of [[3200, 2400], [2400, 3200], [1, 100], [100, 1]]) {
    for (const zoom of [1, 1.75, 4]) {
      for (const horizontal of [0, 50, 100]) {
        for (const vertical of [0, 50, 100]) {
          const crop = getImageCrop(width, height, { zoom, horizontal, vertical })
          assert.ok(crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= width + 1e-8 && crop.y + crop.height <= height + 1e-8)
          assert.equal(crop.width, crop.height)
        }
      }
    }
  }
})

test('invalid sizes, zoom or coordinates are rejected explicitly', () => {
  for (const selection of [{ zoom: 0 }, { zoom: 5 }, { zoom: NaN }, { horizontal: Infinity }, { horizontal: -1 }, { vertical: 101 }]) {
    assert.throws(() => getImageCrop(1200, 800, { ...centered, ...selection }), /Ungültiger/)
  }
  assert.throws(() => getImageCrop(0, 800, centered), /Ungültiger/)
})

test('PNG and JPEG signatures are accepted, including missing browser MIME', async () => {
  for (const type of ['image/jpeg', '']) {
    await validateCardImage(new File([new Uint8Array([255, 216, 255, 224])], 'photo.jpg', { type }))
  }
  await validateCardImage(new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'photo.png', { type: 'image/png' }))
})

test('empty, oversized, spoofed and mismatching files are rejected', async () => {
  await assert.rejects(validateCardImage(new File([], 'empty.jpg')), /maximal 5 MB/)
  await assert.rejects(validateCardImage(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.png')), /maximal 5 MB/)
  await assert.rejects(validateCardImage(new File(['not a photo'], 'fake.jpg', { type: 'image/jpeg' })), /kein gültiges/)
  await assert.rejects(validateCardImage(new File([new Uint8Array([255, 216, 255])], 'fake.png', { type: 'image/png' })), /stimmen nicht/)
})

test('canvas exports square PNG and JPEG with real crop coordinates and at most 1600 pixels', async () => {
  const calls = []
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ drawImage: (...args) => calls.push(args) }),
    toBlob(callback, type) { callback(new Blob(['encoded image'], { type })) },
  }
  const previous = globalThis.document
  globalThis.document = { createElement: () => canvas }
  try {
    const image = { naturalWidth: 4000, naturalHeight: 3000 }
    const file = await exportImageCrop(image, { ...centered, horizontal: 100 }, 'image/png')
    assert.equal(file.type, 'image/png')
    assert.equal(file.name, 'matratze.png')
    assert.deepEqual(calls[0], [image, 1000, 0, 3000, 3000, 0, 0, 1600, 1600])
    const jpeg = await exportImageCrop(image, { ...centered, zoom: 4 }, 'image/jpeg')
    assert.equal(jpeg.name, 'matratze.jpg')
    assert.equal(jpeg.type, 'image/jpeg')
    assert.equal(canvas.width, 750)
    assert.equal(canvas.height, 750)
    const portrait = { naturalWidth: 2400, naturalHeight: 4000 }
    await exportImageCrop(portrait, { ...centered, vertical: 100 }, 'image/jpeg')
    assert.deepEqual(calls[2], [portrait, 0, 1600, 2400, 2400, 0, 0, 1600, 1600])
  } finally {
    globalThis.document = previous
  }
})

test('oversized PNG output is downscaled rather than uploaded above the bucket limit', async () => {
  let attempts = 0
  const canvas = {
    width: 0, height: 0, getContext: () => ({ drawImage() {} }),
    toBlob(callback, type) {
      attempts += 1
      callback(new Blob([new Uint8Array(attempts === 1 ? MAX_IMAGE_BYTES + 1 : 100)], { type }))
    },
  }
  const previous = globalThis.document
  globalThis.document = { createElement: () => canvas }
  try {
    const file = await exportImageCrop({ naturalWidth: 2000, naturalHeight: 2000 }, centered, 'image/png')
    assert.equal(attempts, 2)
    assert.equal(canvas.width, 1200)
    assert.equal(canvas.height, 1200)
    assert.ok(file.size <= MAX_IMAGE_BYTES)
  } finally {
    globalThis.document = previous
  }
})

test('failed decoding/export cannot produce a success-shaped file', async () => {
  const previous = globalThis.document
  globalThis.document = {
    createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: (callback) => callback(null) }),
  }
  try {
    await assert.rejects(exportImageCrop({ naturalWidth: 0, naturalHeight: 0 }, centered, 'image/png'), /Ungültiger/)
    await assert.rejects(exportImageCrop({ naturalWidth: 100, naturalHeight: 100 }, centered, 'image/png'), /nicht gespeichert/)
  } finally {
    globalThis.document = previous
  }
})
