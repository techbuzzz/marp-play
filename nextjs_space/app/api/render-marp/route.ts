import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { markdown } = await request.json()

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return NextResponse.json({ slides: [], css: '' })
    }

    // Dynamic import to avoid bundling marp-core in client
    const { Marp } = await import('@marp-team/marp-core')
    const marp = new Marp({
      html: true,
      script: false, // Don't inject helper scripts
    })

    const { html, css } = marp.render(markdown)

    // Marp output structure: <div class="marpit"><svg ...><foreignObject ...><section>...</section></foreignObject></svg>...
    // Each <svg> is one slide. We need to extract individual SVGs.
    const svgRegex = /<svg[^>]*data-marpit-svg[^>]*>[\s\S]*?<\/svg>/gi
    const slides: { html: string; notes: string; animateIn: string; animateOut: string }[] = []
    let match

    while ((match = svgRegex.exec(html)) !== null) {
      const svgContent = match[0]

      // Extract speaker notes from <aside> or comments within the section
      let notes = ''
      const notesMatch = svgContent.match(/<aside[^>]*class="[^"]*notes[^"]*"[^>]*>([\s\S]*?)<\/aside>/i)
      if (notesMatch) {
        notes = notesMatch[1].replace(/<[^>]+>/g, '').trim()
      }

      // Also extract notes from HTML comments
      const commentNotes = svgContent.match(/<!--\s*([\s\S]*?)\s*-->/g)
      if (commentNotes) {
        const extracted = commentNotes
          .map(c => c.replace(/<!--\s*([\s\S]*?)\s*-->/g, '$1').trim())
          .filter(n => n.length > 0)
          .join('\n')
        if (extracted) {
          notes = notes ? notes + '\n' + extracted : extracted
        }
      }

      // Extract per-slide animation directives from comments
      // <!-- _animateIn: bounceInLeft --> <!-- _animateOut: bounceOutRight -->
      let animateIn = ''
      let animateOut = ''
      const animInMatch = svgContent.match(/<!--\s*_animateIn:\s*(\w+)\s*-->/i)
      if (animInMatch) animateIn = animInMatch[1]
      const animOutMatch = svgContent.match(/<!--\s*_animateOut:\s*(\w+)\s*-->/i)
      if (animOutMatch) animateOut = animOutMatch[1]

      slides.push({
        // Wrap each SVG in the marpit div so CSS selectors match
        html: `<div class="marpit">${svgContent}</div>`,
        notes: notes.trim(),
        animateIn,
        animateOut,
      })
    }

    return NextResponse.json({ slides, css })
  } catch (error) {
    console.error('Marp render error:', error)
    return NextResponse.json(
      { error: 'Failed to render markdown', details: String(error) },
      { status: 500 }
    )
  }
}
