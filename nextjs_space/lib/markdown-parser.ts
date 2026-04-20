/**
 * Types for the presentation system.
 * Actual Marp rendering is done server-side via /api/render-marp
 */

export interface Slide {
  content: string  // raw markdown content (for editor)
  notes: string
  html: string     // rendered HTML from Marp
  animateIn?: string   // custom per-slide enter animation
  animateOut?: string  // custom per-slide exit animation
}

export interface Presentation {
  slides: Slide[]
  title?: string
  css?: string     // rendered CSS from Marp
}

/**
 * Simple client-side parser for slide splitting only (used for quick slide count)
 * Full rendering is done via the /api/render-marp endpoint
 */
export function parseMarkdownQuick(markdown: string): { slideCount: number; title?: string } {
  if (!markdown?.trim()) {
    return { slideCount: 0 }
  }

  let contentToProcess = markdown

  // Remove YAML frontmatter
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (frontmatterMatch) {
    contentToProcess = markdown.replace(frontmatterMatch[0], '').trim()
  }

  // Split by slide separator
  const slideParts = contentToProcess.split(/^---$/m).filter(part => part.trim())

  return { slideCount: slideParts.length }
}

/**
 * Escape HTML content
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}
