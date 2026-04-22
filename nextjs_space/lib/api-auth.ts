import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// Token format
// ---------------------------------------------------------------------------
// The Bearer token we hand to the user has the shape:
//
//   mkp_<keyId>.<secret>
//
// `keyId`   - 24 base62 chars, stored in clear in the DB (used for lookup and
//             as the FK on shared_presentations).
// `secret`  - 48 base62 chars, hashed with sha256 and only the hash is kept.
//
// The full token is shown to the user once at creation time and can never be
// recovered afterwards.
// ---------------------------------------------------------------------------

const TOKEN_PREFIX = 'mkp_'
const KEY_ID_LEN = 24
const SECRET_LEN = 48

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomBase62(length: number): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += BASE62[bytes[i] % BASE62.length]
  }
  return out
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export interface GeneratedApiKey {
  keyId: string
  secret: string
  secretHash: string
  secretPrefix: string
  bearerToken: string
}

export function generateApiKey(): GeneratedApiKey {
  const keyId = TOKEN_PREFIX + randomBase62(KEY_ID_LEN)
  const secret = randomBase62(SECRET_LEN)
  const secretHash = sha256(secret)
  const secretPrefix = secret.slice(0, 8)
  const bearerToken = `${keyId}.${secret}`
  return { keyId, secret, secretHash, secretPrefix, bearerToken }
}

function parseBearerToken(token: string): { keyId: string; secret: string } | null {
  const trimmed = token.trim()
  if (!trimmed.startsWith(TOKEN_PREFIX)) return null
  const dot = trimmed.indexOf('.')
  if (dot <= TOKEN_PREFIX.length) return null
  const keyId = trimmed.slice(0, dot)
  const secret = trimmed.slice(dot + 1)
  if (!keyId || !secret) return null
  return { keyId, secret }
}

export interface AuthResult {
  valid: boolean
  /** Back-compat raw key string (env-var mode) or the DB keyId. */
  key?: string
  /** When the request authenticated against an AppApiKey record. */
  apiKeyId?: string
  error?: string
}

/**
 * Validate an API key on an incoming request.
 *
 * Strategy:
 *   1. Read `Authorization: Bearer <token>`.
 *   2. If the token looks like `mkp_<keyId>.<secret>` try to validate it
 *      against the AppApiKey table. Update lastUsedAt / usageCount on hit.
 *   3. Otherwise, fall back to comparing against the legacy MARP_API_KEYS
 *      env var (comma-separated list) so existing integrations keep working.
 *   4. If neither MARP_API_KEYS is configured nor any AppApiKey exists in
 *      the DB, the API runs in open mode (development convenience).
 */
export async function validateApiKey(request: NextRequest): Promise<AuthResult> {
  const configuredKeys = (process.env.MARP_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const authHeader = request.headers.get('authorization')
  const match = authHeader?.match(/^Bearer\s+(.+)$/i)
  const providedToken = match?.[1]?.trim()

  // ---- 1. Try DB-backed key --------------------------------------------------
  if (providedToken) {
    const parsed = parseBearerToken(providedToken)
    if (parsed) {
      try {
        const record = await prisma.appApiKey.findUnique({
          where: { keyId: parsed.keyId },
        })
        if (record && !record.revoked && record.secretHash === sha256(parsed.secret)) {
          // Fire-and-forget usage tracking
          prisma.appApiKey
            .update({
              where: { id: record.id },
              data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
            })
            .catch(() => {})
          return { valid: true, key: record.keyId, apiKeyId: record.id }
        }
      } catch (err) {
        console.error('AppApiKey lookup failed:', err)
      }
    }

    // ---- 2. Legacy env-var key ---------------------------------------------
    if (configuredKeys.length > 0 && configuredKeys.includes(providedToken)) {
      return { valid: true, key: providedToken }
    }
  }

  // ---- 3. Open mode ----------------------------------------------------------
  // If no env keys AND no DB keys exist, allow all requests (dev convenience).
  if (configuredKeys.length === 0) {
    try {
      const anyKey = await prisma.appApiKey.findFirst({ select: { id: true } })
      if (!anyKey) return { valid: true }
    } catch {
      // If the DB is unreachable we still allow open mode rather than locking
      // the user out during local dev / migrations.
      return { valid: true }
    }
  }

  return {
    valid: false,
    error: providedToken
      ? 'Invalid or revoked API key'
      : 'Missing Authorization header. Use: Authorization: Bearer <api_key>',
  }
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message, status }, { status })
}

export function apiSuccess(data: Record<string, unknown>, status: number = 200) {
  return Response.json({ success: true, ...data }, { status })
}

// ---------------------------------------------------------------------------
// Housekeeping
// ---------------------------------------------------------------------------

/**
 * Delete AppApiKey records that have never been used to create a presentation
 * and whose last-used timestamp (or creation time if never used) is older than
 * `olderThanDays` days (default: 30). Safe to call as fire-and-forget.
 */
export async function cleanupUnusedApiKeys(olderThanDays: number = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
  try {
    const result = await prisma.appApiKey.deleteMany({
      where: {
        presentations: { none: {} },
        OR: [
          { lastUsedAt: null, createdAt: { lt: cutoff } },
          { lastUsedAt: { lt: cutoff } },
        ],
      },
    })
    return result.count
  } catch (err) {
    console.error('cleanupUnusedApiKeys failed:', err)
    return 0
  }
}
