/**
 * Shared Marp theme utilities used by render and export routes.
 */

/**
 * Maps the UI theme selector value to a Marp theme directive and optional
 * class.  Marp ships three built-in themes: `default`, `gaia`, `uncover`.
 */
export const THEME_MAP: Record<string, { theme: string; className?: string }> = {
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
 *    inject `theme: <value>` (and optionally `class: <value>`) right AFTER the
 *    opening `---`, BEFORE any other frontmatter content.  This avoids the bug
 *    where injecting after a `style: |` block scalar causes the directives to
 *    be absorbed as part of the style content.
 * 3. If there is no frontmatter, we create one with the necessary directives.
 */
export function injectThemeDirective(md: string, uiTheme: string): string {
  const mapping = THEME_MAP[uiTheme]
  if (!mapping) return md                    // unknown theme → passthrough

  const trimmed = md.trimStart()

  // Build the YAML lines to inject.
  let yamlLines = `theme: ${mapping.theme}`
  if (mapping.className) {
    yamlLines += `\nclass: ${mapping.className}`
  }

  // Check for existing frontmatter.
  const fmMatch = trimmed.match(/^(---\s*\n)([\s\S]*?\n)(---\s*(?:\n|$))/)

  if (fmMatch) {
    const [, open, body, close] = fmMatch
    const rest = trimmed.slice(fmMatch[0].length)

    // Already has a theme directive inside frontmatter → respect the author's choice.
    if (/^\s*theme\s*:/m.test(body)) {
      return md
    }

    // Inject at the START of the frontmatter body (right after opening ---)
    // so that the directives are NOT absorbed by any block scalar (style: |).
    return open + yamlLines + '\n' + body + close + rest
  }

  // No frontmatter at all — check for HTML-comment theme directive.
  if (/<!--\s*theme\s*:/i.test(trimmed)) {
    return md
  }

  // Create new frontmatter.
  return `---\nmarp: true\n${yamlLines}\n---\n${md}`
}
