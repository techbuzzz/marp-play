import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Internal endpoint for the play page (no API key required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const presentation = await prisma.sharedPresentation.findUnique({
      where: { id },
    })

    if (!presentation) {
      return Response.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Check expiration
    if (presentation.expiresAt && presentation.expiresAt < new Date()) {
      return Response.json({ error: 'This presentation has expired' }, { status: 410 })
    }

    // Increment view count (fire and forget)
    prisma.sharedPresentation.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {})

    return Response.json({
      title: presentation.title,
      markdown: presentation.markdown,
      slideCount: presentation.slideCount,
      views: presentation.views,
    })
  } catch (error) {
    console.error('Internal play API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
