/**
 * Server-only field-level encryption utilities.
 *
 * Design:
 *   - AES-256-CBC with a static IV from env.
 *   - Encrypted values are marked with the literal prefix `enc:` so we can
 *     safely detect and pass-through legacy plain-text values that existed
 *     in the database before encryption was rolled out.
 *
 * IMPORTANT:
 *   - Do NOT import this module from client components. It relies on Node's
 *     `crypto` module and on server-only environment variables.
 *   - Static-IV AES-CBC is acceptable for large markdown blobs but must NOT
 *     be used for passwords, short secrets, or tokens. Use a KDF + random IV
 *     per record for anything security-sensitive.
 */

import { createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-cbc'

/** Marker that identifies values produced by this module. */
export const ENC_PREFIX = 'enc:'

// ─── Env validation & key derivation ─────────────────────────────────────────

/**
 * Throws a descriptive error if the required env vars are missing or have the
 * wrong length. Called lazily on first encrypt/decrypt so module import does
 * not blow up in e.g. build-time static analysis contexts.
 */
function validateEnv(): void {
  const key = process.env.ENCRYPTION_KEY
  const iv = process.env.ENCRYPTION_VECTOR

  if (!key || key.length !== 64) {
    throw new Error(
      '[crypto] ENCRYPTION_KEY must be a 64-char hex string (32 bytes, AES-256).'
    )
  }
  if (!iv || iv.length !== 32) {
    throw new Error(
      '[crypto] ENCRYPTION_VECTOR must be a 32-char hex string (16 bytes, CBC IV).'
    )
  }
}

function getKey(): Buffer {
  validateEnv()
  return Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex')
}

function getIV(): Buffer {
  validateEnv()
  return Buffer.from(process.env.ENCRYPTION_VECTOR as string, 'hex')
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns true when the value carries the `enc:` prefix produced by
 * `encryptField`. Useful for safe detection of legacy plain-text rows.
 */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX)
}

/**
 * Encrypts a plaintext string with AES-256-CBC and returns a value in the
 * form `enc:<base64>`.
 *
 * Idempotent: if `value` is already encrypted (starts with `enc:`) it is
 * returned unchanged. Empty strings are also returned unchanged so we do not
 * spend cycles ciphering zero-length payloads.
 */
export function encryptField(plaintext: string): string {
  if (plaintext === '') return plaintext
  if (isEncrypted(plaintext)) return plaintext

  const cipher = createCipheriv(ALGORITHM, getKey(), getIV())
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  return `${ENC_PREFIX}${encrypted.toString('base64')}`
}

/**
 * Decrypts a value produced by `encryptField`.
 *
 *   - Values WITHOUT the `enc:` prefix are treated as legacy plain-text and
 *     returned unchanged (no error). This lets us do a zero-downtime rollout.
 *   - Values WITH a `enc:` prefix whose base64 payload is corrupted or was
 *     produced with a different key will cause `createDecipheriv` /
 *     `decipher.final()` to throw. This is the intended, loud behaviour.
 */
export function decryptField(value: string): string {
  if (value === '') return value
  if (!isEncrypted(value)) return value

  const base64 = value.slice(ENC_PREFIX.length)
  const decipher = createDecipheriv(ALGORITHM, getKey(), getIV())
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(base64, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
