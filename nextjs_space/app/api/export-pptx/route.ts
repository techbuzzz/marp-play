import { NextRequest, NextResponse } from 'next/server'
import { injectThemeDirective } from '@/lib/marp-theme'
import { buildPptx } from '@/lib/export-pptx'

export const dynamic = 'force-dynamic'

/**
 * Renders a single-slide HTML document suitable for the HTML2PDF API.
 */
function buildSlideHtml(svgContent: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${css}
    html, body {
      margin: 0;
      padding: 0;
      width: 1280px;
      height: 720px;
      overflow: hidden;
    }
    .marpit > svg {
      display: block;
      width: 1280px;
      height: 720px;
    }
  </style>
</head>
<body>
  <div class="marpit">${svgContent}</div>
</body>
</html>`
}

/**
 * Converts a single-slide HTML to a PNG base64 string via the Abacus
 * HTML2PDF API (which uses Playwright under the hood).  We request a PDF
 * and then use the base64 result as our image source.
 */
async function slideHtmlToImage(
  html: string,
): Promise<string> {
  const apiKey = process.env.ABACUSAI_API_KEY
  if (!apiKey) throw new Error('ABACUSAI_API_KEY not configured')

  // Create PDF request (single-page = one slide)
  const createRes = await fetch(
    'https://apps.abacus.ai/api/createConvertHtmlToPdfRequest',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: apiKey,
        html_content: html,
        pdf_options: {
          width: '1280px',
          height: '720px',
          print_background: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          landscape: true,
        },
        base_url: process.env.NEXTAUTH_URL || '',
      }),
    },
  )

  if (!createRes.ok) {
    throw new Error('Failed to create PDF request for slide image')
  }

  const { request_id } = await createRes.json()
  if (!request_id) throw new Error('No request_id from PDF service')

  // Poll for completion
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000))

    const statusRes = await fetch(
      'https://apps.abacus.ai/api/getConvertHtmlToPdfStatus',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id,
          deployment_token: apiKey,
        }),
      },
    )

    const st = await statusRes.json()
    if (st?.status === 'SUCCESS' && st?.result?.result) {
      // The result is a base64-encoded PDF.  We'll use it directly as a
      // data URI for PptxGenJS (it supports PDF data in some builds) or
      // convert to a generic base64 image.
      return `data:application/pdf;base64,${st.result.result}`
    }
    if (st?.status === 'FAILED') {
      throw new Error('PDF render failed for slide')
    }
  }
  throw new Error('Slide render timed out')
}

export async function POST(request: NextRequest) {
  try {
    const { markdown, theme: uiTheme } = await request.json()

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return NextResponse.json({ error: 'No markdown provided' }, { status: 400 })
    }

    const themedMarkdown = injectThemeDirective(markdown, uiTheme || 'modern')

    // Render with Marp
    const { Marp } = await import('@marp-team/marp-core')
    const marp = new Marp({ html: true, script: false })
    const { html, css } = marp.render(themedMarkdown)

    // Extract individual SVG slides
    const svgRegex = /<svg[^>]*data-marpit-svg[^>]*>[\s\S]*?<\/svg>/gi
    const svgs: string[] = []
    let match
    while ((match = svgRegex.exec(html)) !== null) {
      svgs.push(match[0])
    }

    if (svgs.length === 0) {
      return NextResponse.json({ error: 'No slides found' }, { status: 400 })
    }

    // Extract speaker notes per slide
    const slideNotes: string[] = svgs.map((svg) => {
      const notesMatch = svg.match(
        /<aside[^>]*class="[^"]*notes[^"]*"[^>]*>([\s\S]*?)<\/aside>/i,
      )
      return notesMatch
        ? notesMatch[1].replace(/<[^>]+>/g, '').trim()
        : ''
    })

    // Render each slide to an image via HTML2PDF API
    const slideImages: string[] = []
    for (let i = 0; i < svgs.length; i++) {
      const slideHtml = buildSlideHtml(svgs[i], css)
      const imageData = await slideHtmlToImage(slideHtml)
      slideImages.push(imageData)
    }

    // Build the PPTX
    const pptxBuffer = await buildPptx(slideImages, slideNotes, 'Presentation')

    return new NextResponse(pptxBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    })
  } catch (error) {
    console.error('Export PPTX error:', error)
    return NextResponse.json(
      { error: 'Failed to export PPTX' },
      { status: 500 },
    )
  }
}
