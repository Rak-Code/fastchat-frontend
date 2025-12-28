/**
 * Utility functions for cleaning and processing markdown content
 */

export function cleanMarkdownContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  return content
    // Fix malformed bold text (e.g., **text** with extra spaces or incomplete formatting)
    .replace(/\*\*\s*([^*]+?)\s*\*\*/g, '**$1**')
    .replace(/\*\*([^*]*)\*\*\s*\*\*/g, '**$1**') // Fix double bold markers
    
    // Fix malformed italic text
    .replace(/(?<!\*)\*\s*([^*]+?)\s*\*(?!\*)/g, '*$1*')
    
    // Remove incomplete formatting at the end of content (common in streaming)
    .replace(/\*\*\s*$/, '') // Remove trailing **
    .replace(/(?<!\*)\*\s*$/, '') // Remove trailing single *
    .replace(/^\*\*\s*$/, '') // Remove standalone **
    .replace(/^\*\s*$/, '') // Remove standalone *
    
    // Fix heading formatting
    .replace(/^#+\s*([^#\n]+)\s*#+\s*$/gm, (match, content) => {
      const level = match.indexOf(' ')
      return '#'.repeat(level) + ' ' + content.trim()
    })
    
    // Normalize line breaks (replace multiple line breaks with double)
    .replace(/\n{3,}/g, '\n\n')
    
    // Remove any loading indicators or partial content
    .replace(/^(Loading|Thinking|\.{3,}|\.\.\.).*$/gm, '')
    
    // Trim whitespace
    .trim()
}

export function isValidMarkdownContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  const cleaned = cleanMarkdownContent(content)
  
  // Check if content is empty or just formatting characters
  if (!cleaned || /^[\s*#-]*$/.test(cleaned)) {
    return false
  }
  
  // Check if content is just incomplete formatting
  if (/^(\*{1,2}|#{1,6})\s*$/.test(cleaned)) {
    return false
  }
  
  return true
}