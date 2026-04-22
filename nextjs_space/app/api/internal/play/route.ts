import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Internal endpoint used by the web UI "Share" button.
 *
 * Design goals:
 *   - Zero-friction for users: no Bearer token, no sign-up, no modal.
 *   - Not a public API: same-origin only (CSRF-style Origin/Referer check)
 *     so third-party sites cannot abuse the endpoint from a user's browser.
 *   - Traceable: every row is tagged `source: "ui"`, which lets ops tell UI
 *     traffic apart from `/api/v1/play` (REST) and `/api/v1/mcp` (MCP) in
 *     the database.
 *
 * The matching GET handler for a single presentation id already exists at
 * `app/api/internal/play/[id]/route.ts`.
 */

const MAX_MARKDOWN_BYTES = 256 * 1024 // 256 KiB — plenty for slides, rejects abuse
const DEFAULT_EXPIRY_HOURS = 30 * 24 // 30 days

function sameOriginOk(req: NextRequest): boolean {
  const h = req.headers

  const forwardedHost = h.get('x-forwarded-host') || h.get('host')
  const forwardedProto = h.get('x-forwarded-proto') || 'https'
  if (!forwardedHost) return false

  const selfOrigin = `${forwardedProto}://${forwardedHost}`

  const origin = h.get('origin')
  if (origin) {
    return origin === selfOrigin
  }

  // No Origin header (some legit same-origin clients omit it). Fall back to
  // Referer if present and require it to start with our own origin.
  const referer = h.get('referer')
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin
      return refOrigin === selfOrigin
    } catch {
      return false
    }
  }

  // Neither Origin nor Referer. In a browser this never happens for POST;
  // it usually means a curl/bot client. Reject — they can use /api/v1/play.
  return false
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOriginOk(request)) {
      return Response.json(
        {
          error:
            'This endpoint is for same-origin UI calls only. External clients must use POST /api/v1/play with a Bearer token.',
        },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { markdown, title, expiresInHours } = body as {
      markdown?: unknown
      title?: unknown
      expiresInHours?: unknown
    }

    if (typeof markdown !== 'string' || !markdown.trim()) {
      return Response.json(
        { error: 'Field "markdown" is required and must be a non-empty string' },
        { status: 400 }
      )
    }
    if (Buffer.byteLength(markdown, 'utf8') > MAX_MARKDOWN_BYTES) {
      return Response.json(
        {
          error: `Markdown is too large (limit: ${MAX_MARKDOWN_BYTES} bytes). Shorten the presentation or use /api/v1/play with a Bearer token for larger payloads.`,
        },
        { status: 413 }
      )
    }

    const safeTitle =
      typeof title === 'string' && title.trim() ? title.slice(0, 200) : 'Shared Presentation'

    const slideCount = markdown.split(/^---$/m).filter((s) => s.trim()).length

    const hours =
      typeof expiresInHours === 'number' && expiresInHours > 0 && expiresInHours <= 24 * 365
        ? expiresInHours
        : DEFAULT_EXPIRY_HOURS
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    // Fire-and-forget expired cleanup — keeps the table tidy on every write.
    prisma.sharedPresentation
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {})

    const presentation = await prisma.sharedPresentation.create({
      data: {
        title: safeTitle,
        markdown,
        slideCount,
        expiresAt,
        apiKey: null,
        apiKeyId: null,
        source: 'ui',
      },
    })

    const headersList = await headers()
    const host =
      headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
    const protocol = headersList.get('x-forwarded-proto') || 'https'
    const baseUrl = `${protocol}://${host}`

    return Response.json(
      {
        id: presentation.id,
        playUrl: `${baseUrl}/?s=${presentation.id}`,
        embedUrl: `${baseUrl}/play/${presentation.id}?embed=true`,
        title: presentation.title,
        slideCount,
        createdAt: presentation.createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[api/internal/play] POST failed:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
