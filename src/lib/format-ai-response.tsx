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
  let processed = content
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Normalize bullet points: convert *, •, ● to -
    .replace(/^(\s*)[*•●]\s+/gm, '$1- ')
    // Clean up whitespace-only lines
    .replace(/\n[ \t]+\n/g, '\n\n');

  // Handle numbered lists - normalize them to start from 1
  // This regex finds numbered list blocks and renumbers them
  processed = normalizeNumberedLists(processed);

  processed = processed
    // Remove blank lines between list items (both numbered and bullet)
    .replace(/(^\s*\d+\.\s+.+$)\n\n+(^\s*\d+\.)/gm, '$1\n$2')
    .replace(/(^\s*[-*]\s+.+$)\n\n+(^\s*[-*])/gm, '$1\n$2')
    // Remove blank lines after headings before content
    .replace(/(#{1,6}\s+[^\n]+)\n\n\n+/g, '$1\n\n')
    // Replace 3+ consecutive newlines with 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();

  return processed;
}

// Normalize numbered lists to start from 1 and be sequential
// This is crucial because markdown-it only recognizes lists starting from 1
function normalizeNumberedLists(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let listCounter = 0;
  let prevLineWasNumbered = false;
  let prevLineWasEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this line is a numbered list item
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    
    if (numberedMatch) {
      const [, indent, originalNum, text] = numberedMatch;
      
      // Decide if this is continuing a list or starting a new one
      // Start new list if:
      // - Previous line was not a numbered item AND was not empty
      // - OR this is the first numbered item we encounter
      // - OR there was an empty line and next is numbered (could be new list)
      
      if (!prevLineWasNumbered) {
        // Starting a new list - could be after text, heading, or at start
        listCounter = 1;
      } else {
        // Continue the current list
        listCounter++;
      }
      
      // Renumber the item starting from 1
      result.push(`${indent}${listCounter}. ${text}`);
      prevLineWasNumbered = true;
      prevLineWasEmpty = false;
    } else {
      // Not a numbered list item
      const isEmptyLine = trimmedLine === '';
      const isBulletItem = /^(\s*)[-*]\s+/.test(line);
      const isHeading = /^#{1,6}\s+/.test(line);
      
      // If this is a non-empty, non-list, non-empty line, reset the list
      if (!isEmptyLine && !isBulletItem) {
        // Check if the NEXT non-empty line is a numbered item
        // If so, we might be in the middle of a text block before a new list
        let nextNonEmptyIdx = i + 1;
        while (nextNonEmptyIdx < lines.length && lines[nextNonEmptyIdx].trim() === '') {
          nextNonEmptyIdx++;
        }
        
        const nextLine = lines[nextNonEmptyIdx];
        const nextIsNumbered = nextLine && /^(\s*)(\d+)\.\s+/.test(nextLine);
        
        // Reset counter - next numbered item will start a new list
        if (!nextIsNumbered || isHeading) {
          listCounter = 0;
          prevLineWasNumbered = false;
        }
      }
      
      // Empty lines don't break the list in markdown, but we track them
      if (isEmptyLine && prevLineWasNumbered) {
        // Keep prevLineWasNumbered true through single empty line
        // Check if next non-empty line is numbered
        let nextNonEmptyIdx = i + 1;
        while (nextNonEmptyIdx < lines.length && lines[nextNonEmptyIdx].trim() === '') {
          nextNonEmptyIdx++;
        }
        const nextLine = lines[nextNonEmptyIdx];
        const nextIsNumbered = nextLine && /^(\s*)(\d+)\.\s+/.test(nextLine);
        
        if (!nextIsNumbered) {
          prevLineWasNumbered = false;
          listCounter = 0;
        }
      }
      
      prevLineWasEmpty = isEmptyLine;
      if (!isEmptyLine) {
        prevLineWasNumbered = false;
      }
      
      result.push(line);
    }
  }

  return result.join('\n');
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

