import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { validateApiKey, apiError, apiSuccess, cleanupUnusedApiKeys } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return apiError(auth.error || 'Unauthorized', 401)
    }

    const body = await request.json()
    const { markdown, title, expiresInHours } = body

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return apiError('Field "markdown" is required and must be a non-empty string')
    }

    // Count slides (by --- separators)
    const slideCount = markdown.split(/^---$/m).filter(s => s.trim()).length

    // Calculate expiration (default: 30 days)
    const DEFAULT_EXPIRY_HOURS = 30 * 24 // 30 days
    const hours = (expiresInHours && typeof expiresInHours === 'number' && expiresInHours > 0)
      ? expiresInHours
      : DEFAULT_EXPIRY_HOURS
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    // Cleanup expired presentations (fire and forget)
    prisma.sharedPresentation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {})

    // Monthly cleanup of unused API keys (fire and forget). We piggy-back this
    // on presentation creation since we don't run a scheduler inside the app.
    cleanupUnusedApiKeys(30).catch(() => {})

    // Store in database, linking to the AppApiKey if the caller authenticated
    // with one.
    const presentation = await prisma.sharedPresentation.create({
      data: {
        title: title || 'Untitled Presentation',
        markdown,
        slideCount,
        expiresAt,
        apiKey: auth.key || null,
        apiKeyId: auth.apiKeyId || null,
        source: 'api',
      },
    })

    // Build the play URL
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
    const protocol = headersList.get('x-forwarded-proto') || 'https'
    const baseUrl = `${protocol}://${host}`

    return apiSuccess({
      id: presentation.id,
      // Shared link opens the full Marp Player with the editor collapsed and Share hidden
      playUrl: `${baseUrl}/?s=${presentation.id}`,
      // Embed stays minimal on the dedicated /play/[id] route
      embedUrl: `${baseUrl}/play/${presentation.id}?embed=true`,
      title: presentation.title,
      slideCount,
      createdAt: presentation.createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }, 201)
  } catch (error) {
    console.error('API v1 play error:', error)
    return apiError('Internal server error', 500)
  }
}
