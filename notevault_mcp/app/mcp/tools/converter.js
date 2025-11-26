/**
 * NoteVault MCP — Converter Tool
 * Convert various formats to Markdown
 */

/**
 * Convert content to Markdown
 */
export async function convertToMarkdown(content, format, config) {
  console.log(`🔧 Convert to Markdown: format=${format}`);

  let markdown = '';

  switch (format.toLowerCase()) {
    case 'txt':
    case 'text':
      // Plain text to Markdown
      markdown = content;
      break;

    case 'json':
      // JSON to formatted Markdown
      try {
        const data = JSON.parse(content);
        markdown = jsonToMarkdown(data);
      } catch (err) {
        throw new Error(`Invalid JSON: ${err.message}`);
      }
      break;

    case 'html':
      // HTML to Markdown (basic conversion)
      markdown = htmlToMarkdown(content);
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  return {
    format: format,
    markdown: markdown
  };
}

/**
 * Convert JSON to Markdown
 */
function jsonToMarkdown(data, level = 0) {
  let md = '';
  const indent = '  '.repeat(level);

  if (Array.isArray(data)) {
    data.forEach((item, idx) => {
      md += `${indent}- ${jsonToMarkdown(item, level + 1)}\n`;
    });
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object') {
        md += `${indent}**${key}:**\n`;
        md += jsonToMarkdown(value, level + 1);
      } else {
        md += `${indent}**${key}:** ${value}\n`;
      }
    }
  } else {
    md += String(data);
  }

  return md;
}

/**
 * Convert HTML to Markdown (basic)
 */
function htmlToMarkdown(html) {
  let md = html;

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');

  // Bold, italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul[^>]*>/gi, '');
  md = md.replace(/<\/ul>/gi, '\n');

  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');

  // Remove remaining tags
  md = md.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&amp;/g, '&');

  return md.trim();
}

export default { convertToMarkdown };
