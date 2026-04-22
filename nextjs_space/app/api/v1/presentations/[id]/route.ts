import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateApiKey, apiError, apiSuccess } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = validateApiKey(request)
    if (!auth.valid) {
      return apiError(auth.error || 'Unauthorized', 401)
    }

    const { id } = await params

    const presentation = await prisma.sharedPresentation.findUnique({
      where: { id },
    })

    if (!presentation) {
      return apiError('Presentation not found', 404)
    }

    // Check expiration
    if (presentation.expiresAt && presentation.expiresAt < new Date()) {
      return apiError('Presentation has expired', 410)
    }

    return apiSuccess({
      id: presentation.id,
      title: presentation.title,
      markdown: presentation.markdown,
      slideCount: presentation.slideCount,
      views: presentation.views,
      createdAt: presentation.createdAt.toISOString(),
      expiresAt: presentation.expiresAt ? presentation.expiresAt.toISOString() : null,
    })
  } catch (error) {
    console.error('API v1 get presentation error:', error)
    return apiError('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = validateApiKey(request)
    if (!auth.valid) {
      return apiError(auth.error || 'Unauthorized', 401)
    }

    const { id } = await params

    const presentation = await prisma.sharedPresentation.findUnique({
      where: { id },
    })

    if (!presentation) {
      return apiError('Presentation not found', 404)
    }

    await prisma.sharedPresentation.delete({ where: { id } })

    return apiSuccess({ message: 'Presentation deleted' })
  } catch (error) {
    console.error('API v1 delete presentation error:', error)
    return apiError('Internal server error', 500)
  }
}
