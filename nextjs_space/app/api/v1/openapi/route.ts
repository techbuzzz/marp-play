import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const baseUrl = `${protocol}://${host}`

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Marp Player API',
      description: 'API for rendering Marp Markdown presentations to PDF and creating shareable play links. Use this API to integrate Marp presentation capabilities into AI agents and automation tools.',
      version: '1.0.0',
      contact: {
        name: 'Marp Player',
        url: baseUrl,
      },
    },
    servers: [{ url: `${baseUrl}/api/v1`, description: 'Production server' }],
    paths: {
      '/render-pdf': {
        post: {
          operationId: 'renderMarpPdf',
          summary: 'Convert Marp Markdown to PDF',
          description: 'Takes Marp-flavored Markdown content and returns a high-quality 16:9 landscape PDF file. Each slide becomes a separate page. Supports all Marp directives, themes, custom CSS, HTML, grids, KPIs, and more.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['markdown'],
                  properties: {
                    markdown: {
                      type: 'string',
                      description: 'Marp-flavored Markdown content. Use "---" to separate slides. Supports YAML frontmatter with marp: true, theme, paginate, etc.',
                      example: '---\nmarp: true\ntheme: default\npaginate: true\n---\n\n# Hello World\n\nThis is my first slide\n\n---\n\n## Second Slide\n\n- Point 1\n- Point 2',
                    },
                    filename: {
                      type: 'string',
                      description: 'Output PDF filename (default: presentation.pdf)',
                      example: 'my-presentation.pdf',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'PDF file',
              content: {
                'application/pdf': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            '400': {
              description: 'Invalid request',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '401': {
              description: 'Unauthorized',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/play': {
        post: {
          operationId: 'createPlayLink',
          summary: 'Create a shareable presentation link',
          description: 'Stores Marp Markdown and returns a URL where the presentation can be viewed as an interactive slideshow with navigation, fullscreen, animations, and keyboard shortcuts.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['markdown'],
                  properties: {
                    markdown: {
                      type: 'string',
                      description: 'Marp-flavored Markdown content',
                    },
                    title: {
                      type: 'string',
                      description: 'Presentation title (default: "Untitled Presentation")',
                      example: 'Q1 Results',
                    },
                    expiresInHours: {
                      type: 'number',
                      description: 'Auto-delete after N hours. Default: 720 (30 days).',
                      example: 72,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Presentation created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      id: { type: 'string' },
                      playUrl: { type: 'string', description: 'Full URL to view the presentation' },
                      embedUrl: { type: 'string', description: 'URL for iframe embedding' },
                      title: { type: 'string' },
                      slideCount: { type: 'integer' },
                      createdAt: { type: 'string', format: 'date-time' },
                      expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/keys': {
        post: {
          operationId: 'createApiKey',
          summary: 'Generate a new API key',
          description: 'Creates a new Bearer token for accessing the Marp Player API. The full token is shown once in the response — only the sha256 hash is stored server-side. Requires the caller to acknowledge the social-support ask (LinkedIn follow + GitHub star).',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['acknowledgedSocials'],
                  properties: {
                    label: {
                      type: 'string',
                      description: 'Optional friendly label for the key, max 120 chars.',
                      example: 'My Claude agent',
                    },
                    acknowledgedSocials: {
                      type: 'boolean',
                      description: 'Must be true. The user confirms they support the project on LinkedIn + GitHub.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'API key created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      id: { type: 'string' },
                      keyId: { type: 'string', description: 'Public identifier stored in DB. Not sensitive.' },
                      secretPrefix: { type: 'string', description: 'First few chars of the secret portion, for display only.' },
                      label: { type: 'string', nullable: true },
                      createdAt: { type: 'string', format: 'date-time' },
                      bearerToken: { type: 'string', description: 'Full Bearer token (shown only once).' },
                      clientSecret: { type: 'string', description: 'Secret portion only (shown only once).' },
                      warning: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request (e.g. missing acknowledgedSocials)',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/presentations/{id}': {
        get: {
          operationId: 'getPresentation',
          summary: 'Get presentation details',
          description: 'Retrieve the markdown and metadata of a stored presentation.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Presentation ID',
            },
          ],
          responses: {
            '200': {
              description: 'Presentation data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      id: { type: 'string' },
                      title: { type: 'string' },
                      markdown: { type: 'string' },
                      slideCount: { type: 'integer' },
                      views: { type: 'integer' },
                      createdAt: { type: 'string', format: 'date-time' },
                      expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
        delete: {
          operationId: 'deletePresentation',
          summary: 'Delete a presentation',
          description: 'Permanently remove a stored presentation.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Deleted',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } } } },
            },
          },
        },
      },
      '/mcp': {
        post: {
          operationId: 'mcpJsonRpc',
          summary: 'Model Context Protocol endpoint (Streamable HTTP)',
          description:
            'JSON-RPC 2.0 endpoint implementing the MCP Streamable HTTP transport. Native MCP clients (Claude Desktop, Cursor, Cline, etc.) should POST JSON-RPC messages here. Non-MCP agents (OpenAI GPTs, LangChain) should instead use the REST operations documented in this spec.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jsonrpc', 'method'],
                  properties: {
                    jsonrpc: { type: 'string', enum: ['2.0'] },
                    id: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
                    method: {
                      type: 'string',
                      description:
                        'MCP method name: initialize, tools/list, tools/call, ping, or a notification like notifications/initialized.',
                    },
                    params: { type: 'object' },
                  },
                  example: {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'initialize',
                    params: {
                      protocolVersion: '2025-06-18',
                      capabilities: {},
                      clientInfo: { name: 'example-client', version: '1.0.0' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'JSON-RPC response (single or batch).',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      jsonrpc: { type: 'string', enum: ['2.0'] },
                      id: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
                      result: { type: 'object' },
                      error: { type: 'object' },
                    },
                  },
                },
              },
            },
            '202': { description: 'Notification accepted — no response body.' },
            '400': { description: 'Parse or validation error.' },
            '401': { description: 'Missing/invalid Bearer token.' },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            status: { type: 'integer' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'API key authentication. Generate a key via POST /api/v1/keys in the MCP modal of the Marp Player UI, or set MARP_API_KEYS env var on the server. If neither is configured, the API runs in open mode.',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }

  return Response.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
