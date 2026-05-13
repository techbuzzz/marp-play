import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Maps the UI theme selector value to a Marp theme directive and optional
 * class. Marp ships three built-in themes: `default`, `gaia`, `uncover`.
 * The mapping below gives each UI option a distinct visual identity.
 */
const THEME_MAP: Record<string, { theme: string; className?: string; style?: string }> = {
  modern:  { theme: 'default' },
  minimal: { theme: 'uncover' },
  dark:    { theme: 'gaia', className: 'invert' },
  light:   { theme: 'gaia' },
}

/**
 * Injects the Marp `theme` / `class` global directives into the Markdown.
 *
 * Strategy:
 * 1. If the user's Markdown already declares `theme:` (in YAML frontmatter or
 *    as an HTML-comment directive), we leave it alone — user-authored
 *    directives always take priority.
 * 2. If the Markdown starts with a YAML frontmatter block (`---\n…\n---`), we
 *    inject `theme: <value>` (and optionally `class: <value>`) inside that
 *    block, right before the closing `---`.  This avoids adding content before
 *    the opening `---`, which would break Marp's frontmatter parser.
 * 3. If there is no frontmatter, we create one with the necessary directives.
 */
function injectThemeDirective(md: string, uiTheme: string): string {
  const mapping = THEME_MAP[uiTheme]
  if (!mapping) return md                    // unknown theme → passthrough

  const trimmed = md.trimStart()

  // Already has a theme directive → respect the author's choice.
  if (/^---\s*\n[\s\S]*?\ntheme\s*:/m.test(trimmed) || /<!--\s*theme\s*:/i.test(trimmed)) {
    return md
  }

  // Build the YAML lines to inject.
  let yamlLines = `theme: ${mapping.theme}`
  if (mapping.className) {
    yamlLines += `\nclass: ${mapping.className}`
  }

  // Case A: existing YAML frontmatter — inject before the closing `---`.
  const fmMatch = trimmed.match(/^(---\s*\n)([\s\S]*?\n)(---\s*(?:\n|$))/)
  if (fmMatch) {
    const [, open, body, close] = fmMatch
    const rest = trimmed.slice(fmMatch[0].length)
    return open + body + yamlLines + '\n' + close + rest
  }

  // Case B: no frontmatter — create one.
  return `---\nmarp: true\n${yamlLines}\n---\n${md}`
}

export async function POST(request: NextRequest) {
  try {
    const { markdown, theme: uiTheme } = await request.json()

    if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
      return NextResponse.json({ slides: [], css: '' })
    }

    // Inject theme directive based on the UI selector
    const themedMarkdown = injectThemeDirective(markdown, uiTheme || 'modern')

    // Dynamic import to avoid bundling marp-core in client
    const { Marp } = await import('@marp-team/marp-core')
    const marp = new Marp({
      html: true,
      script: false, // Don't inject helper scripts
    })

    const { html, css } = marp.render(themedMarkdown)

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
