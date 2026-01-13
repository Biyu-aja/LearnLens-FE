"use client";

import React, { useMemo } from "react";
import MarkdownIt from "markdown-it";

/**
 * Utility untuk memformat respons AI dengan:
 * 1. Parsing Markdown menggunakan markdown-it (**bold**, *italic*, dll)
 * 2. Menghighlight teks yang diapit tanda kutip tunggal seperti 'teks'
 */

// Inisialisasi markdown-it dengan opsi
const md = new MarkdownIt({
  html: false,        // Nonaktifkan HTML tags untuk keamanan
  breaks: false,      // Jangan konversi single \n ke <br>
  linkify: true,      // Auto-convert URL ke link
  typographer: true,  // Enable smart quotes dan typography
});

// Custom rule untuk menghighlight teks dalam tanda kutip tunggal
// Ini akan mengkonversi 'teks' menjadi <mark class="highlight-quoted">teks</mark>
const defaultRender = md.renderer.rules.text || function(tokens, idx) {
  return tokens[idx].content;
};

md.renderer.rules.text = function(tokens, idx, options, env, self) {
  const content = tokens[idx].content;
  
  // Ganti teks dalam tanda kutip tunggal dengan span highlight
  const highlightedContent = content.replace(
    /'([^']+)'/g,
    '<span class="highlight-quoted">$1</span>'
  );
  
  return highlightedContent;
};

// Pre-process content untuk menghapus excessive newlines dan merapikan format
function preprocessContent(content: string): string {
  return content
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove blank lines between numbered list items (1. item\n\n2. item -> 1. item\n2. item)
    .replace(/(\d+\.\s+[^\n]+)\n\n+(\d+\.)/g, '$1\n$2')
    // Remove blank lines between bullet list items
    .replace(/([-*]\s+[^\n]+)\n\n+([-*])/g, '$1\n$2')
    // Remove blank lines after headings before content
    .replace(/(#{1,6}\s+[^\n]+)\n\n\n+/g, '$1\n\n')
    // Replace 3+ consecutive newlines with 2
    .replace(/\n{3,}/g, '\n\n')
    // Clean up whitespace-only lines
    .replace(/\n[ \t]+\n/g, '\n\n')
    // Trim
    .trim();
}

// Post-process HTML untuk memastikan tidak ada spacing berlebihan
function postprocessHTML(html: string): string {
  return html
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Remove excessive breaks
    .replace(/(<br\s*\/?>\s*){2,}/g, '<br>')
    // Clean up whitespace between tags
    .replace(/>\s+</g, '><')
    // But keep some space for readability
    .replace(/<\/p></g, '</p>\n<')
    .replace(/<\/li></g, '</li>\n<')
    .replace(/<\/ul></g, '</ul>\n<')
    .replace(/<\/ol></g, '</ol>\n<');
}

// Komponen utama untuk memformat konten AI
export function FormattedAIContent({ content }: { content: string }) {
  // Memoize hasil parsing untuk performa
  const htmlContent = useMemo(() => {
    const processedContent = preprocessContent(content);
    const html = md.render(processedContent);
    return postprocessHTML(html);
  }, [content]);

  return (
    <div 
      className="ai-formatted-response prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

// Export fungsi render jika dibutuhkan di tempat lain
export function renderMarkdown(content: string): string {
  const processedContent = preprocessContent(content);
  return postprocessHTML(md.render(processedContent));
}

