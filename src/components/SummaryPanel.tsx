"use client";

import { Loader2, FileText, Sparkles, Trash2 } from "lucide-react";

interface SummaryPanelProps {
  summary: string | null;
  onGenerateSummary: () => Promise<void>;
  onDeleteSummary: () => Promise<void>;
  isLoading: boolean;
}

export function SummaryPanel({ summary, onGenerateSummary, onDeleteSummary, isLoading }: SummaryPanelProps) {
  return (
    <div className="p-4 sm:p-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Summary</h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
            AI-generated overview of your material
          </p>
        </div>
        {summary && (
          <div className="flex items-center gap-2">
            <button
              onClick={onGenerateSummary}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={12} className="sm:w-[14px] sm:h-[14px] animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles size={12} className="sm:w-[14px] sm:h-[14px]" />
                  Regenerate
                </>
              )}
            </button>
            <button
              onClick={onDeleteSummary}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 text-[var(--error)] border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors text-xs sm:text-sm"
              title="Delete Summary"
            >
              <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>

      {summary ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6">
          <div className="markdown-content whitespace-pre-wrap text-sm sm:text-base">
            {summary}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <FileText size={40} className="sm:w-12 sm:h-12 mx-auto text-[var(--foreground-muted)] mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No summary yet</h3>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4 sm:mb-6 px-4">
            Generate an AI summary of your learning material
          </p>
          <button
            onClick={onGenerateSummary}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                Generate Summary
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
