"use client";

import { useState } from "react";
import { Book, Loader2, Trash2, ChevronDown, ChevronUp, Tag, Sparkles } from "lucide-react";
import { GlossaryTerm } from "@/lib/api";

interface GlossaryPanelProps {
  glossary: GlossaryTerm[] | null;
  onGenerateGlossary: () => Promise<void>;
  onDeleteGlossary: () => Promise<void>;
  isLoading: boolean;
}

export function GlossaryPanel({
  glossary,
  onGenerateGlossary,
  onDeleteGlossary,
  isLoading,
}: GlossaryPanelProps) {
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter glossary based on search
  const filteredGlossary = glossary?.filter(
    (term) =>
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const groupedGlossary = filteredGlossary?.reduce((acc, term) => {
    const category = term.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);

  const categoryColors: Record<string, string> = {
    Technical: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    Concept: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    Acronym: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Process: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    General: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800",
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors.General;
  };

  return (
    <div className="p-4 sm:p-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Book size={20} className="text-[var(--primary)]" />
            Glossary
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
            Key terms and definitions from your material
          </p>
        </div>
        {glossary && glossary.length > 0 && (
          <button
            onClick={onDeleteGlossary}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 text-[var(--error)] border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors text-xs sm:text-sm"
            title="Delete Glossary"
          >
            <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>

      {glossary && glossary.length > 0 ? (
        <>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
            />
          </div>

          {/* Term count */}
          <div className="text-xs text-[var(--foreground-muted)] mb-4">
            {filteredGlossary?.length} term{filteredGlossary?.length !== 1 ? "s" : ""} found
          </div>

          {/* Grouped terms */}
          <div className="space-y-6">
            {groupedGlossary &&
              Object.entries(groupedGlossary).map(([category, terms]) => (
                <div key={category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} className="text-[var(--foreground-muted)]" />
                    <span className="text-sm font-medium text-[var(--foreground-muted)]">
                      {category}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-full">
                      {terms.length}
                    </span>
                  </div>

                  {/* Terms list */}
                  <div className="space-y-2">
                    {terms.map((term, index) => (
                      <div
                        key={`${term.term}-${index}`}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden transition-all"
                      >
                        <button
                          onClick={() =>
                            setExpandedTerm(expandedTerm === term.term ? null : term.term)
                          }
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getCategoryColor(category)}`}>
                              {term.term.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="font-medium text-sm">{term.term}</span>
                          </div>
                          {expandedTerm === term.term ? (
                            <ChevronUp size={16} className="text-[var(--foreground-muted)]" />
                          ) : (
                            <ChevronDown size={16} className="text-[var(--foreground-muted)]" />
                          )}
                        </button>

                        {expandedTerm === term.term && (
                          <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]">
                            <p className="text-sm text-[var(--foreground-muted)] pt-3 leading-relaxed">
                              {term.definition}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <Book
            size={40}
            className="sm:w-12 sm:h-12 mx-auto text-[var(--foreground-muted)] mb-3 sm:mb-4"
          />
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No glossary yet</h3>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4 sm:mb-6 px-4">
            Generate a glossary of key terms from your learning material
          </p>
          <button
            onClick={onGenerateGlossary}
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
                Generate Glossary
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
