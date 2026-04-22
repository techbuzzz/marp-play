import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const baseUrl = `${protocol}://${host}`

  return Response.json({
    name: 'Marp Player API',
    version: '1.0.0',
    description: 'Convert Marp Markdown to PDF and create shareable presentation links for AI agents and automation tools.',
    endpoints: {
      renderPdf: {
        method: 'POST',
        url: `${baseUrl}/api/v1/render-pdf`,
        description: 'Convert Marp Markdown to a 16:9 landscape PDF',
      },
      createPlayLink: {
        method: 'POST',
        url: `${baseUrl}/api/v1/play`,
        description: 'Store markdown and get a shareable play URL',
      },
      getPresentation: {
        method: 'GET',
        url: `${baseUrl}/api/v1/presentations/{id}`,
        description: 'Get stored presentation details',
      },
      deletePresentation: {
        method: 'DELETE',
        url: `${baseUrl}/api/v1/presentations/{id}`,
        description: 'Delete a stored presentation',
      },
      openApiSpec: {
        method: 'GET',
        url: `${baseUrl}/api/v1/openapi`,
        description: 'OpenAPI 3.1 specification for tool integration',
      },
    },
    authentication: 'Bearer token via Authorization header. Optional if MARP_API_KEYS is not configured.',
    documentation: `${baseUrl}/llms-full.txt`,
  })
}
