/**
 * Smoke tests for `lib/crypto.ts`. This project does not use Jest/Vitest,
 * so instead of adding a test framework we ship a standalone script that
 * mirrors the assertions from the spec's Step 5.
 *
 * Usage (from nextjs_space/):
 *   yarn tsx --require dotenv/config scripts/test-crypto.ts
 *
 * Exits with code 0 if all checks pass, 1 otherwise.
 */

import assert from 'node:assert/strict'
import { encryptField, decryptField, isEncrypted } from '../lib/crypto'

const cases: Array<{ name: string; run: () => void }> = [
  // isEncrypted ------------------------------------------------------------
  {
    name: 'isEncrypted: returns false for plain text',
    run: () => assert.equal(isEncrypted('# Hello'), false),
  },
  {
    name: 'isEncrypted: returns true for enc: prefixed value',
    run: () => assert.equal(isEncrypted('enc:SGVsbG8='), true),
  },

  // encryptField -----------------------------------------------------------
  {
    name: 'encryptField: adds enc: prefix',
    run: () => assert.match(encryptField('hello'), /^enc:/),
  },
  {
    name: 'encryptField: is idempotent — does not double-encrypt',
    run: () => {
      const once = encryptField('hello')
      const twice = encryptField(once)
      assert.equal(once, twice)
    },
  },
  {
    name: 'encryptField: returns empty string as-is',
    run: () => assert.equal(encryptField(''), ''),
  },

  // decryptField -----------------------------------------------------------
  {
    name: 'decryptField: round-trips correctly',
    run: () => {
      const original = '# Hello\n\nThis is **markdown**.'
      assert.equal(decryptField(encryptField(original)), original)
    },
  },
  {
    name: 'decryptField: round-trips with unicode / emoji',
    run: () => {
      const original = 'Привет, 🚀! 你好世界'
      assert.equal(decryptField(encryptField(original)), original)
    },
  },
  {
    name: 'decryptField: returns plain-text as-is (legacy values)',
    run: () => {
      const legacy = '# Old unencrypted markdown'
      assert.equal(decryptField(legacy), legacy)
    },
  },
  {
    name: 'decryptField: throws on corrupted enc: payload',
    run: () => assert.throws(() => decryptField('enc:NOTVALIDBASE64!!!')),
  },
]

let failures = 0
for (const c of cases) {
  try {
    c.run()
    console.log(`  ✓ ${c.name}`)
  } catch (err) {
    failures++
    console.error(`  ✗ ${c.name}`)
    console.error('    ', err instanceof Error ? err.message : err)
  }
}

console.log(
  `\n${cases.length - failures}/${cases.length} passing, ${failures} failing.`
)
process.exit(failures === 0 ? 0 : 1)
