import { NextRequest, NextResponse } from 'next/server'
import { buildPptx } from '@/lib/export-pptx'

export const dynamic = 'force-dynamic'

// Allow large payloads (base64 PNG images for all slides)
export const maxDuration = 60
export const fetchCache = 'force-no-store'

/**
 * Receives pre-rendered slide images (base64 PNG) and speaker notes from
 * the client, assembles them into a PPTX file using PptxGenJS.
 *
 * The client is responsible for rendering each Marp SVG slide to a PNG
 * (using canvas in the browser) and sending the data here.
 */
export async function POST(request: NextRequest) {
  try {
    const { slideImages, slideNotes, title } = await request.json()

    if (!slideImages || !Array.isArray(slideImages) || slideImages.length === 0) {
      return NextResponse.json({ error: 'No slide images provided' }, { status: 400 })
    }

    // Build the PPTX from pre-rendered images
    const pptxBuffer = await buildPptx(
      slideImages,
      slideNotes || [],
      title || 'Presentation',
    )

    return new NextResponse(pptxBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    })
  } catch (error) {
    console.error('Export PPTX error:', error)
    return NextResponse.json(
      { error: 'Failed to export PPTX' },
      { status: 500 },
    )
  }
}
