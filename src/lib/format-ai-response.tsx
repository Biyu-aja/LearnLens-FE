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
  breaks: false,      // Jangan konversi single \n ke <br> (agar list tidak ada gap)
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

// Pre-process content untuk menghapus multiple empty lines
function preprocessContent(content: string): string {
  // Hapus multiple empty lines, ganti dengan single empty line
  return content
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines dengan 2
    .replace(/(\n\s*)+\n/g, '\n\n'); // Clean up whitespace-only lines
}

// Komponen utama untuk memformat konten AI
export function FormattedAIContent({ content }: { content: string }) {
  // Memoize hasil parsing untuk performa
  const htmlContent = useMemo(() => {
    const processedContent = preprocessContent(content);
    return md.render(processedContent);
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
  return md.render(content);
}
