import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, generateApiKey, cleanupUnusedApiKeys } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/keys
 *
 * Creates a new AppApiKey. The full Bearer token is returned in the response
 * and is only visible ONCE — the server stores only its sha256 hash.
 *
 * Body (all fields optional):
 *   {
 *     "label": "My Claude agent",
 *     "acknowledgedSocials": true  // the user ticked the LinkedIn/GitHub support checkbox
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is fine.
    }

    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 120) : null
    const acknowledgedSocials = body.acknowledgedSocials === true

    if (!acknowledgedSocials) {
      return apiError(
        'You must acknowledge the social-support ask (LinkedIn follow + GitHub star) before generating a key.',
        400,
      )
    }

    const { keyId, secret, secretHash, secretPrefix, bearerToken } = generateApiKey()

    const record = await prisma.appApiKey.create({
      data: {
        keyId,
        secretHash,
        secretPrefix,
        label,
        acknowledgedSocials: true,
      },
    })

    // Fire-and-forget cleanup — takes the opportunity to garbage-collect stale
    // keys while the user is actively interacting with the API.
    cleanupUnusedApiKeys(30).catch(() => {})

    return apiSuccess(
      {
        id: record.id,
        keyId: record.keyId,
        secretPrefix: record.secretPrefix,
        label: record.label,
        createdAt: record.createdAt.toISOString(),
        /**
         * The full Bearer token. Show it once to the user — the server cannot
         * recover it later. The client is responsible for storing it.
         */
        bearerToken,
        /**
         * Split components for advanced users who prefer to keep the secret
         * separate. They can concatenate with a '.' to reconstruct the
         * Bearer token.
         */
        clientSecret: secret,
        warning:
          'Store this token now. For security reasons it cannot be displayed again.',
      },
      201,
    )
  } catch (error) {
    console.error('API v1 keys POST error:', error)
    return apiError('Internal server error', 500)
  }
}
