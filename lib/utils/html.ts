/**
 * Strip WordPress generated image size suffix from a URL to get the original.
 */
export function stripWordPressSize(url: string): string {
  return url.replace(/-\d+x\d+(\.[^.?#]+)/, '$1')
}

/**
 * Normalize WordPress media URLs by removing double slashes in the path.
 * WordPress sometimes stores upload paths with a double slash (e.g. /wp-content/uploads//2017/01/image.jpg).
 */
export function normalizeWordPressUrl(url: string): string {
  return url.replace(/([^:])\/\//g, '$1/')
}

/**
 * Decode HTML entities in strings from the WordPress REST API.
 * WordPress runs titles through wptexturize(), producing HTML entities that
 * React would otherwise render as literal entity strings.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
}

/**
 * Strip all HTML tags from a string, returning plain text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

/**
 * Convert a WordPress excerpt to plain text, stripping HTML and truncating to 160 chars.
 */
export function excerptToDescription(excerpt: string | undefined | null): string | undefined {
  if (!excerpt) return undefined

  const text = decodeHtmlEntities(
    excerpt
      .replace(/<div[^>]*class="[^"]*pps-series-post-details[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  )

  return text || undefined
}
