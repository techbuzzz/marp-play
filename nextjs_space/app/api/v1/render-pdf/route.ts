import { NextRequest } from 'next/server'
import { validateApiKey, apiError } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const auth = validateApiKey(request)
    if (!auth.valid) {
      return apiError(auth.error || 'Unauthorized', 401)
    }

    const body = await request.json()
    const { markdown, filename } = body

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return apiError('Field "markdown" is required and must be a non-empty string')
    }

    // Render with Marp
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

    // Generate PDF via Abacus HTML2PDF API
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
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

    if (!createResponse.ok) {
      console.error('PDF create error:', await createResponse.text())
      return apiError('Failed to start PDF generation', 500)
    }

    const { request_id } = await createResponse.json()
    if (!request_id) {
      return apiError('No request ID from PDF service', 500)
    }

    // Poll for completion
    const maxAttempts = 120
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id,
          deployment_token: process.env.ABACUSAI_API_KEY,
        }),
      })

      const statusResult = await statusResponse.json()
      const status = statusResult?.status || 'FAILED'
      const result = statusResult?.result || null

      if (status === 'SUCCESS') {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, 'base64')
          const outputFilename = filename || 'presentation.pdf'
          return new Response(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${outputFilename}"`,
              'Content-Length': String(pdfBuffer.length),
            },
          })
        }
        return apiError('PDF generation completed but no data returned', 500)
      } else if (status === 'FAILED') {
        console.error('PDF generation failed:', result?.error)
        return apiError('PDF generation failed', 500)
      }

      attempts++
    }

    return apiError('PDF generation timed out', 504)
  } catch (error) {
    console.error('API v1 render-pdf error:', error)
    return apiError('Internal server error', 500)
  }
}
