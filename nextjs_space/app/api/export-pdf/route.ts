import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { markdown } = await request.json()

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return NextResponse.json({ error: 'No markdown provided' }, { status: 400 })
    }

    // Step 1: Render markdown with Marp to get HTML + CSS
    const { Marp } = await import('@marp-team/marp-core')
    const marp = new Marp({
      html: true,
      script: false,
    })

    const { html, css } = marp.render(markdown)

    // Build a full HTML document with all slides for PDF
    // Each slide on its own page using CSS page breaks
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${css}
    @page {
      size: 1280px 720px;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 1280px;
    }
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
<body>
  ${html}
</body>
</html>`

    // Step 2: Create the PDF generation request
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
      const error = await createResponse.json().catch(() => ({ error: 'Failed to create PDF request' }))
      console.error('PDF create error:', error)
      return NextResponse.json({ error: 'Failed to start PDF generation' }, { status: 500 })
    }

    const { request_id } = await createResponse.json()
    if (!request_id) {
      return NextResponse.json({ error: 'No request ID returned' }, { status: 500 })
    }

    // Step 3: Poll for status
    const maxAttempts = 120 // 2 minutes
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
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="presentation.pdf"',
            },
          })
        }
        return NextResponse.json({ error: 'PDF generation completed but no data' }, { status: 500 })
      } else if (status === 'FAILED') {
        const errorMsg = result?.error || 'PDF generation failed'
        console.error('PDF generation failed:', errorMsg)
        return NextResponse.json({ error: errorMsg }, { status: 500 })
      }

      attempts++
    }

    return NextResponse.json({ error: 'PDF generation timed out' }, { status: 500 })
  } catch (error) {
    console.error('Export PDF error:', error)
    return NextResponse.json({ error: 'Failed to export PDF' }, { status: 500 })
  }
}
