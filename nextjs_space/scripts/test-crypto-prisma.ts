/**
 * End-to-end verification: round-trip a SharedPresentation through the
 * `$extends`-wrapped Prisma client in `lib/db.ts`, then read the RAW row
 * with an un-extended client to confirm that what landed in Postgres is
 * actually ciphertext with the `enc:` prefix.
 *
 * This is ops-only tooling, not something the app calls at runtime.
 *
 * Usage (from nextjs_space/):
 *   yarn tsx --require dotenv/config scripts/test-crypto-prisma.ts
 */

import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/db'
import { isEncrypted, ENC_PREFIX } from '../lib/crypto'

const raw = new PrismaClient()

async function main() {
  const plaintext =
    '---\nmarp: true\n---\n\n# Crypto round-trip test\n\nHello 👋'

  console.log('[prisma-crypto] creating record via wrapped client …')
  const created = await prisma.sharedPresentation.create({
    data: {
      title: '__crypto_roundtrip_test__',
      markdown: plaintext,
      slideCount: 1,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    },
  })

  try {
    // 1. Wrapped reads should give us back the plaintext.
    const wrapped = await prisma.sharedPresentation.findUnique({
      where: { id: created.id },
    })
    assert.ok(wrapped, 'wrapped findUnique returned null')
    assert.equal(wrapped.markdown, plaintext, 'wrapped read did not decrypt')
    console.log('  ✓ wrapped client returns plaintext')

    // 2. The CREATE return value itself is a write-side result and does NOT
    //    pass through the read hook, so it should still be ciphertext. This
    //    is the one place a caller can see encrypted data through the
    //    wrapped client — flag it loudly if that ever changes.
    assert.ok(
      isEncrypted(created.markdown),
      'create() return value should be ciphertext'
    )
    console.log('  ✓ create() return is ciphertext (expected)')

    // 3. Raw read bypasses the extension and must yield `enc:<base64>`.
    const rawRow = await raw.sharedPresentation.findUnique({
      where: { id: created.id },
    })
    assert.ok(rawRow, 'raw findUnique returned null')
    assert.ok(
      rawRow.markdown.startsWith(ENC_PREFIX),
      `raw row is missing ${ENC_PREFIX} prefix: ${rawRow.markdown.slice(0, 24)}…`
    )
    console.log('  ✓ database stores ciphertext with enc: prefix')

    // 4. Updating with the same ciphertext must stay idempotent.
    await prisma.sharedPresentation.update({
      where: { id: created.id },
      data: { markdown: rawRow.markdown }, // already enc:…
    })
    const after = await raw.sharedPresentation.findUnique({
      where: { id: created.id },
    })
    assert.equal(
      after?.markdown,
      rawRow.markdown,
      'update() double-encrypted an already-encrypted value'
    )
    console.log('  ✓ update is idempotent on already-encrypted values')

    console.log('\n[prisma-crypto] all checks passed.')
  } finally {
    await raw.sharedPresentation.delete({ where: { id: created.id } })
    console.log('[prisma-crypto] cleaned up test record.')
  }
}

main()
  .catch((err) => {
    console.error('[prisma-crypto] failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await raw.$disconnect()
  })
