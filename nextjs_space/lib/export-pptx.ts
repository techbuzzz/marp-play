/**
 * Server-side PPTX generation helper.
 * This module is only imported by the API route (server-side).
 */
import PptxGenJS from 'pptxgenjs'

export interface SlideData {
  notes: string
}

/**
 * Builds a PPTX file from pre-rendered slide images (base64 PNG) and notes.
 * Returns the PPTX as a Node.js Buffer.
 */
export async function buildPptx(
  slideImages: string[],
  slideNotes: string[],
  title = 'Presentation',
): Promise<Buffer> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33″ × 7.5″ (same 16:9 as Marp)
  pptx.title = title

  for (let i = 0; i < slideImages.length; i++) {
    const pptxSlide = pptx.addSlide()

    // Add slide image as full-bleed background
    pptxSlide.addImage({
      data: slideImages[i],
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    })

    // Add speaker notes if available
    if (slideNotes[i]) {
      pptxSlide.addNotes(slideNotes[i])
    }
  }

  const result = await pptx.write({ outputType: 'nodebuffer' })
  return result as Buffer
}
