import { NextRequest } from 'next/server'

// Simple API key validation for v1 endpoints
// Uses the MARP_API_KEYS env var (comma-separated list of valid keys)
// If no keys configured, API is open (for development)
export function validateApiKey(request: NextRequest): { valid: boolean; key?: string; error?: string } {
  const configuredKeys = process.env.MARP_API_KEYS

  // If no keys configured, allow all requests (open mode)
  if (!configuredKeys || configuredKeys.trim() === '') {
    return { valid: true }
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header. Use: Authorization: Bearer <api_key>' }
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return { valid: false, error: 'Invalid Authorization header format. Use: Bearer <api_key>' }
  }

  const providedKey = match[1].trim()
  const validKeys = configuredKeys.split(',').map(k => k.trim()).filter(Boolean)

  if (validKeys.includes(providedKey)) {
    return { valid: true, key: providedKey }
  }

  return { valid: false, error: 'Invalid API key' }
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message, status }, { status })
}

export function apiSuccess(data: Record<string, unknown>, status: number = 200) {
  return Response.json({ success: true, ...data }, { status })
}
