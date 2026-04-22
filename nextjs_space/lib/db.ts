import { PrismaClient } from '@prisma/client'
import { encryptField, decryptField } from './crypto'

/**
 * Prisma client with transparent field-level encryption for
 * `SharedPresentation.markdown`.
 *
 *   - Writes (`create`, `update`, `upsert`) push plaintext through
 *     `encryptField`, which is idempotent and tags the value with the
 *     `enc:` prefix.
 *   - Reads (`findUnique`, `findFirst`, `findMany`) push stored values
 *     through `decryptField`, which passes legacy plain-text rows through
 *     unchanged. This enables a zero-downtime lazy migration: old rows
 *     stay readable and are re-encrypted the next time the record is saved.
 *
 * Everything is wired through `PrismaClient.$extends` so every call site
 * (`/api/v1/play`, `/api/v1/presentations/[id]`, `/api/v1/mcp`,
 * `/api/internal/play/[id]`, ...) gets the behaviour for free — there is no
 * need to sprinkle encrypt/decrypt calls in route handlers.
 */
/**
 * Normalises a write payload's `markdown` field so that both shapes Prisma
 * accepts for scalar updates are encrypted consistently:
 *
 *     { markdown: "plaintext" }           // create / update short form
 *     { markdown: { set: "plaintext" } }  // update long form
 */
function encryptMarkdownInData(data: any): void {
  if (!data) return
  if (typeof data.markdown === 'string') {
    data.markdown = encryptField(data.markdown)
  } else if (
    data.markdown &&
    typeof data.markdown === 'object' &&
    typeof data.markdown.set === 'string'
  ) {
    data.markdown.set = encryptField(data.markdown.set)
  }
}

function buildPrismaClient() {
  const base = new PrismaClient()

  return base.$extends({
    query: {
      sharedPresentation: {
        // ── Writes ────────────────────────────────────────────────────────
        async create({ args, query }) {
          encryptMarkdownInData(args.data)
          return query(args)
        },

        async createMany({ args, query }) {
          const data = args.data as any
          if (Array.isArray(data)) {
            for (const row of data) encryptMarkdownInData(row)
          } else {
            encryptMarkdownInData(data)
          }
          return query(args)
        },

        async update({ args, query }) {
          encryptMarkdownInData(args.data)
          return query(args)
        },

        async updateMany({ args, query }) {
          encryptMarkdownInData(args.data)
          return query(args)
        },

        async upsert({ args, query }) {
          encryptMarkdownInData(args.create)
          encryptMarkdownInData(args.update)
          return query(args)
        },

        // ── Reads ─────────────────────────────────────────────────────────
        async findUnique({ args, query }) {
          const result = await query(args)
          if (result && typeof result.markdown === 'string') {
            result.markdown = decryptField(result.markdown)
          }
          return result
        },

        async findFirst({ args, query }) {
          const result = await query(args)
          if (result && typeof result.markdown === 'string') {
            result.markdown = decryptField(result.markdown)
          }
          return result
        },

        async findMany({ args, query }) {
          const results = await query(args)
          if (Array.isArray(results)) {
            for (const row of results) {
              if (row && typeof row.markdown === 'string') {
                row.markdown = decryptField(row.markdown)
              }
            }
          }
          return results
        },
      },
    },
  })
}

type ExtendedPrismaClient = ReturnType<typeof buildPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? buildPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
