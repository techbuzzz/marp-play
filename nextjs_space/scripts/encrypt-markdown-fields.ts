/**
 * One-shot migration: encrypts every plain-text `markdown` field in
 * `shared_presentations` using the prefix-based AES-256-CBC scheme from
 * `lib/crypto.ts`.
 *
 * Lazy migration is already implied by `decryptField` (legacy plain-text
 * rows are returned as-is), so this script is OPTIONAL. Run it when you
 * want the database to be fully encrypted immediately rather than drifting
 * towards that state over time as records are written.
 *
 * Usage (from nextjs_space/):
 *   yarn tsx --require dotenv/config scripts/encrypt-markdown-fields.ts
 */

import { PrismaClient } from '@prisma/client'
import { encryptField, isEncrypted } from '../lib/crypto'

// NOTE: we intentionally talk to a RAW PrismaClient here — not the
// `$extends`-wrapped one from `lib/db.ts` — so reads return the stored
// value verbatim and we can tell plain-text rows apart from encrypted ones.
const prisma = new PrismaClient()

async function main() {
  const records = await prisma.sharedPresentation.findMany({
    select: { id: true, markdown: true },
  })

  const toMigrate = records.filter(
    (r) => typeof r.markdown === 'string' && !isEncrypted(r.markdown)
  )

  console.log(
    `[encrypt-markdown] scanned ${records.length} row(s); ${toMigrate.length} need encryption.`
  )

  let done = 0
  for (const record of toMigrate) {
    await prisma.sharedPresentation.update({
      where: { id: record.id },
      data: { markdown: encryptField(record.markdown) },
    })
    done++
    if (done % 50 === 0 || done === toMigrate.length) {
      console.log(`[encrypt-markdown] progress: ${done}/${toMigrate.length}`)
    }
  }

  console.log('[encrypt-markdown] done.')
}

main()
  .catch((err) => {
    console.error('[encrypt-markdown] failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
