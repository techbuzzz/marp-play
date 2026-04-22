/**
 * Model Context Protocol (MCP) endpoint for Marp Player.
 *
 * Implements the Streamable HTTP transport (JSON-RPC 2.0 over HTTP POST),
 * as specified at https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
 *
 * Supported methods:
 *   - initialize
 *   - notifications/initialized   (notification – returns 202)
 *   - ping
 *   - tools/list
 *   - tools/call
 *
 * Supported tools:
 *   - create_share_link      : store markdown, return public play URL
 *   - get_presentation       : fetch a stored presentation by id
 *   - delete_presentation    : delete a stored presentation by id
 *   - render_pdf             : render markdown to PDF (returned as base64 resource)
 *
 * Authentication is optional and follows the same scheme as the rest of the v1
 * API: Bearer tokens validated by {@link validateApiKey}. When MARP_API_KEYS is
 * not configured and no DB-backed AppApiKey rows exist, the server runs in
 * open mode for local development.
 */

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { validateApiKey, cleanupUnusedApiKeys } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Some MCP clients send a file's worth of markdown in a single tools/call
// invocation, and `render_pdf` legitimately needs up to ~2 minutes for the
// HTML2PDF pipeline.
export const maxDuration = 300

// ---------------------------------------------------------------------------
// JSON-RPC primitives
// ---------------------------------------------------------------------------

type JsonRpcId = string | number | null

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: JsonRpcId
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcSuccess {
  jsonrpc: '2.0'
  id: JsonRpcId
  result: unknown
}

interface JsonRpcError {
  jsonrpc: '2.0'
  id: JsonRpcId
  error: {
    code: number
    message: string
    data?: unknown
  }
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError

// Standard JSON-RPC + MCP error codes
const ERR_PARSE = -32700
const ERR_INVALID_REQUEST = -32600
const ERR_METHOD_NOT_FOUND = -32601
const ERR_INVALID_PARAMS = -32602
const ERR_INTERNAL = -32603

function rpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcError {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } }
}

function rpcResult(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: '2.0', id, result }
}

function isNotification(msg: JsonRpcRequest): boolean {
  // Per JSON-RPC 2.0 §4.1, a notification is a request without an `id`.
  return msg.id === undefined
}

// ---------------------------------------------------------------------------
// MCP protocol metadata
// ---------------------------------------------------------------------------

// Versions we are willing to speak. Keep the latest first.
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]

const SERVER_INFO = {
  name: 'marp-player',
  title: 'Marp Player',
  version: '1.0.0',
}

const SERVER_CAPABILITIES = {
  // We only expose tools for now – no resources, prompts, logging, etc.
  tools: { listChanged: false },
}

// ---------------------------------------------------------------------------
// Tool catalogue
// ---------------------------------------------------------------------------

interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
}

const TOOLS: ToolDefinition[] = [
  {
    name: 'create_share_link',
    title: 'Create shareable presentation link',
    description:
      'Store Marp-flavored Markdown and return a public URL that renders it as a slide deck. Use this tool whenever the user asks for "a link" or "a slideshow" – it is the canonical way to deliver a presentation from an AI agent.',
    inputSchema: {
      type: 'object',
      required: ['markdown'],
      properties: {
        markdown: {
          type: 'string',
          description:
            'Marp-flavored Markdown. Use `---` on its own line to separate slides. YAML frontmatter with `marp: true` is recommended.',
        },
        title: {
          type: 'string',
          description: 'Optional human-readable title shown in the shared viewer.',
        },
        expiresInHours: {
          type: 'number',
          description: 'Time-to-live in hours. Default 720 (30 days). Must be > 0.',
          minimum: 1,
        },
      },
    },
  },
  {
    name: 'get_presentation',
    title: 'Get stored presentation',
    description: 'Fetch the metadata and markdown of a previously stored presentation by its id.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'The id returned by create_share_link.' },
      },
    },
  },
  {
    name: 'delete_presentation',
    title: 'Delete stored presentation',
    description: 'Permanently remove a stored presentation by id. The public URL stops working immediately.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'The id of the presentation to delete.' },
      },
    },
  },
  {
    name: 'render_pdf',
    title: 'Render Markdown to PDF',
    description:
      'Convert Marp Markdown into a 16:9 landscape PDF. The PDF is returned as a base64 `resource` content item (mimeType application/pdf) that supporting clients can save or display. May take up to 2 minutes for large decks.',
    inputSchema: {
      type: 'object',
      required: ['markdown'],
      properties: {
        markdown: { type: 'string', description: 'Marp-flavored Markdown.' },
        filename: {
          type: 'string',
          description: 'Suggested filename (without extension). Defaults to "presentation".',
        },
      },
    },
  },
]

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

interface ToolContext {
  baseUrl: string
  auth: { key?: string; apiKeyId?: string }
}

function textContent(text: string) {
  return { content: [{ type: 'text', text }], isError: false }
}

function errorContent(text: string) {
  return { content: [{ type: 'text', text }], isError: true }
}

async function toolCreateShareLink(
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  const markdown = args.markdown
  const title = args.title
  const expiresInHours = args.expiresInHours

  if (typeof markdown !== 'string' || !markdown.trim()) {
    return errorContent('`markdown` is required and must be a non-empty string.')
  }

  const slideCount = markdown.split(/^---$/m).filter((s) => s.trim()).length
  const DEFAULT_EXPIRY_HOURS = 30 * 24
  const hours =
    typeof expiresInHours === 'number' && expiresInHours > 0 ? expiresInHours : DEFAULT_EXPIRY_HOURS
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

  // Cleanup expired presentations + unused keys (fire and forget)
  prisma.sharedPresentation
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {})
  cleanupUnusedApiKeys(30).catch(() => {})

  const presentation = await prisma.sharedPresentation.create({
    data: {
      title: typeof title === 'string' && title.trim() ? title : 'Untitled Presentation',
      markdown,
      slideCount,
      expiresAt,
      apiKey: ctx.auth.key || null,
      apiKeyId: ctx.auth.apiKeyId || null,
      source: 'mcp',
    },
  })

  const playUrl = `${ctx.baseUrl}/?s=${presentation.id}`
  const embedUrl = `${ctx.baseUrl}/play/${presentation.id}?embed=true`

  const payload = {
    id: presentation.id,
    title: presentation.title,
    slideCount,
    playUrl,
    embedUrl,
    createdAt: presentation.createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  return {
    content: [
      {
        type: 'text',
        text: `Presentation stored. Share this link with the user:\n${playUrl}`,
      },
    ],
    structuredContent: payload,
    isError: false,
  }
}

async function toolGetPresentation(args: Record<string, unknown>) {
  const id = args.id
  if (typeof id !== 'string' || !id.trim()) {
    return errorContent('`id` is required and must be a non-empty string.')
  }

  const p = await prisma.sharedPresentation.findUnique({ where: { id } })
  if (!p) return errorContent(`No presentation found with id "${id}".`)
  if (p.expiresAt && p.expiresAt < new Date()) {
    return errorContent(`Presentation "${id}" has expired.`)
  }

  const structured = {
    id: p.id,
    title: p.title,
    slideCount: p.slideCount,
    views: p.views,
    markdown: p.markdown,
    createdAt: p.createdAt.toISOString(),
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
    isError: false,
  }
}

async function toolDeletePresentation(args: Record<string, unknown>) {
  const id = args.id
  if (typeof id !== 'string' || !id.trim()) {
    return errorContent('`id` is required and must be a non-empty string.')
  }

  const existing = await prisma.sharedPresentation.findUnique({ where: { id } })
  if (!existing) return errorContent(`No presentation found with id "${id}".`)

  await prisma.sharedPresentation.delete({ where: { id } })
  return textContent(`Presentation "${id}" deleted.`)
}

async function toolRenderPdf(args: Record<string, unknown>) {
  const markdown = args.markdown
  const filename = args.filename

  if (typeof markdown !== 'string' || !markdown.trim()) {
    return errorContent('`markdown` is required and must be a non-empty string.')
  }

  const { Marp } = await import('@marp-team/marp-core')
  const marp = new Marp({ html: true, script: false })
  const { html, css } = marp.render(markdown)

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${css}
    @page { size: 1280px 720px; margin: 0; }
    html, body { margin: 0; padding: 0; width: 1280px; }
    .marpit > svg {
      display: block;
      width: 1280px;
      height: 720px;
      page-break-after: always;
      break-after: page;
    }
    .marpit > svg:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
  </style>
</head>
<body>${html}</body>
</html>`

  const createRes = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_token: process.env.ABACUSAI_API_KEY,
      html_content: fullHtml,
      pdf_options: {
        width: '1280px',
        height: '720px',
        print_background: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        landscape: true,
      },
      base_url: process.env.NEXTAUTH_URL || '',
    }),
  })
  if (!createRes.ok) {
    return errorContent(`Failed to start PDF generation (${createRes.status}).`)
  }
  const { request_id } = await createRes.json()
  if (!request_id) return errorContent('PDF service did not return a request id.')

  const maxAttempts = 120
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    const statusRes = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
    })
    const statusJson = await statusRes.json()
    const status = statusJson?.status || 'FAILED'
    if (status === 'SUCCESS') {
      const b64 = statusJson?.result?.result
      if (!b64) return errorContent('PDF service returned no data.')
      const base = (typeof filename === 'string' && filename.trim()) || 'presentation'
      const safeName = base.replace(/[^a-z0-9._-]+/gi, '_')
      return {
        content: [
          { type: 'text', text: `PDF generated (${base}.pdf).` },
          {
            type: 'resource',
            resource: {
              uri: `marp-player://pdf/${safeName}.pdf`,
              mimeType: 'application/pdf',
              blob: b64,
            },
          },
        ],
        isError: false,
      }
    }
    if (status === 'FAILED') {
      return errorContent('PDF generation failed on the conversion service.')
    }
  }
  return errorContent('PDF generation timed out.')
}

// ---------------------------------------------------------------------------
// Method dispatch
// ---------------------------------------------------------------------------

async function dispatchToolCall(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  switch (toolName) {
    case 'create_share_link':
      return toolCreateShareLink(args, ctx)
    case 'get_presentation':
      return toolGetPresentation(args)
    case 'delete_presentation':
      return toolDeletePresentation(args)
    case 'render_pdf':
      return toolRenderPdf(args)
    default:
      return null
  }
}

interface MethodContext {
  baseUrl: string
  auth: { key?: string; apiKeyId?: string }
}

async function handleRpc(
  msg: JsonRpcRequest,
  ctx: MethodContext,
): Promise<JsonRpcResponse | null> {
  const id: JsonRpcId = msg.id ?? null
  const params = (msg.params ?? {}) as Record<string, unknown>

  try {
    switch (msg.method) {
      case 'initialize': {
        const requested = typeof params.protocolVersion === 'string' ? params.protocolVersion : ''
        const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : LATEST_PROTOCOL_VERSION
        return rpcResult(id, {
          protocolVersion,
          serverInfo: SERVER_INFO,
          capabilities: SERVER_CAPABILITIES,
          instructions:
            'Marp Player lets AI agents convert Markdown into beautiful slide decks. Prefer `create_share_link` for interactive viewing and `render_pdf` when the user explicitly wants a PDF file.',
        })
      }

      case 'notifications/initialized':
      case 'notifications/cancelled':
      case 'notifications/roots/list_changed':
        // Pure notifications – no response expected.
        return null

      case 'ping':
        return rpcResult(id, {})

      case 'tools/list':
        return rpcResult(id, { tools: TOOLS })

      case 'tools/call': {
        const name = params.name
        const rawArgs = params.arguments
        if (typeof name !== 'string') {
          return rpcError(id, ERR_INVALID_PARAMS, '`name` is required in tools/call params.')
        }
        const args = (rawArgs && typeof rawArgs === 'object' ? rawArgs : {}) as Record<
          string,
          unknown
        >
        const result = await dispatchToolCall(name, args, {
          baseUrl: ctx.baseUrl,
          auth: ctx.auth,
        })
        if (result === null) {
          return rpcError(id, ERR_METHOD_NOT_FOUND, `Unknown tool: ${name}`)
        }
        return rpcResult(id, result)
      }

      // Stubs for capabilities we don't advertise – return empty lists so
      // clients that probe them don't see errors.
      case 'resources/list':
        return rpcResult(id, { resources: [] })
      case 'resources/templates/list':
        return rpcResult(id, { resourceTemplates: [] })
      case 'prompts/list':
        return rpcResult(id, { prompts: [] })

      default:
        return rpcError(id, ERR_METHOD_NOT_FOUND, `Method not found: ${msg.method}`)
    }
  } catch (err) {
    console.error(`MCP method ${msg.method} failed:`, err)
    return rpcError(
      id,
      ERR_INTERNAL,
      err instanceof Error ? err.message : 'Internal server error',
    )
  }
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Accept',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// The spec allows optional long-lived GET for server→client streaming. We
// don't push anything server-side, so we explicitly tell clients that they
// should not open an SSE stream. Returning 405 is sanctioned by the spec.
export async function GET() {
  return new Response('Method Not Allowed: use POST for MCP JSON-RPC messages.', {
    status: 405,
    headers: { ...corsHeaders(), Allow: 'POST, OPTIONS' },
  })
}

// Ending a session is optional and stateless for us.
export async function DELETE() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function POST(request: NextRequest) {
  // Authentication (shared with REST API). If keys are configured, the client
  // must send a Bearer token; otherwise we run in open mode.
  const auth = await validateApiKey(request)
  if (!auth.valid) {
    // MCP clients expect a proper HTTP status here so they can surface a
    // useful error to the user.
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32001, message: auth.error || 'Unauthorized' },
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer realm="marp-player"',
        },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify(rpcError(null, ERR_PARSE, 'Invalid JSON payload')),
      { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    )
  }

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const baseUrl = `${protocol}://${host}`
  const ctx: MethodContext = { baseUrl, auth: { key: auth.key, apiKeyId: auth.apiKeyId } }

  const sessionId = request.headers.get('mcp-session-id') || undefined
  const replyHeaders: Record<string, string> = {
    ...corsHeaders(),
    'Content-Type': 'application/json',
  }
  if (sessionId) replyHeaders['Mcp-Session-Id'] = sessionId

  // The payload can be either a single JSON-RPC message or a batch.
  const messages = Array.isArray(body) ? body : [body]

  // Validate shape up-front so we can return a single parse error for bad batches.
  for (const m of messages) {
    if (
      !m ||
      typeof m !== 'object' ||
      (m as JsonRpcRequest).jsonrpc !== '2.0' ||
      typeof (m as JsonRpcRequest).method !== 'string'
    ) {
      return new Response(
        JSON.stringify(rpcError(null, ERR_INVALID_REQUEST, 'Invalid JSON-RPC message')),
        { status: 400, headers: replyHeaders },
      )
    }
  }

  const typed = messages as JsonRpcRequest[]
  const responses: JsonRpcResponse[] = []
  for (const msg of typed) {
    const res = await handleRpc(msg, ctx)
    // Notifications produce no response.
    if (res !== null && !isNotification(msg)) {
      responses.push(res)
    }
  }

  // If the client only sent notifications, the spec says we return 202 with no
  // body. Otherwise we echo the JSON-RPC responses back.
  if (responses.length === 0) {
    return new Response(null, { status: 202, headers: corsHeaders() })
  }

  const payload = Array.isArray(body) ? responses : responses[0]
  return new Response(JSON.stringify(payload), { status: 200, headers: replyHeaders })
}
