"use client";

import { useState } from "react";
import { Layers, Loader2, Trash2, Sparkles, RotateCcw, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Flashcard } from "@/lib/api";

interface FlashcardPanelProps {
  flashcards: Flashcard[] | null;
  onGenerateFlashcards: () => Promise<void>;
  onDeleteFlashcards: () => Promise<void>;
  isLoading: boolean;
  materialId: string;
}

export function FlashcardPanel({
  flashcards,
  onGenerateFlashcards,
  onDeleteFlashcards,
  isLoading,
}: FlashcardPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

  const handleNext = () => {
    if (flashcards && currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkKnown = () => {
    setKnownCards(prev => new Set([...prev, currentIndex]));
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === " ") {
      e.preventDefault();
      handleFlip();
    }
  };

  // Empty state
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center mb-6">
          <Layers size={40} className="text-cyan-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Flashcards Yet</h3>
        <p className="text-[var(--foreground-muted)] max-w-md mb-6">
          Generate interactive flashcards from your material to help memorize key concepts and terms.
        </p>
        <button
          onClick={onGenerateFlashcards}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 font-medium shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Generating Flashcards...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Flashcards
            </>
          )}
        </button>
      </div>
    );
  }

  // Study mode stats
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  const knownCount = knownCards.size;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Flashcards</h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              {flashcards.length} cards • {knownCount} mastered
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
              title="Reset progress"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={onDeleteFlashcards}
              className="p-2 text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete flashcards"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flashcard - Auto height based on content */}
        <div 
          className="cursor-pointer"
          onClick={handleFlip}
        >
          {!isFlipped ? (
            /* Front - Question */
            <div className="rounded-2xl p-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl min-h-[200px] flex flex-col">
              <div className="text-xs uppercase tracking-wider opacity-75 text-center">Question</div>
              <div className="flex-1 flex items-center justify-center py-6">
                <p className="text-lg font-medium leading-relaxed text-center">
                  {flashcards[currentIndex]?.front}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {flashcards[currentIndex]?.category && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {flashcards[currentIndex].category}
                  </span>
                )}
              </div>
              <div className="text-xs opacity-60 text-center mt-4">
                Click to reveal answer
              </div>
            </div>
          ) : (
            /* Back - Answer */
            <div className="rounded-2xl p-6 bg-[var(--surface)] border-2 border-cyan-500/30 shadow-xl min-h-[200px] flex flex-col">
              <div className="text-xs uppercase tracking-wider text-cyan-500 text-center">Answer</div>
              <div className="flex-1 flex items-center justify-center py-6">
                <p className="text-base text-[var(--foreground)] leading-relaxed text-center">
                  {flashcards[currentIndex]?.back}
                </p>
              </div>
              <div className="text-xs text-[var(--foreground-muted)] text-center mt-4">
                Click to see question
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <span className="font-medium text-[var(--foreground)]">{currentIndex + 1}</span>
            <span>/</span>
            <span>{flashcards.length}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleMarkKnown}
            disabled={currentIndex === flashcards.length - 1 && knownCards.has(currentIndex)}
            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            ✓ I Know This
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Study Again
          </button>
        </div>

        {/* Keyboard hints */}
        <p className="text-xs text-center text-[var(--foreground-muted)] opacity-60">
          Use ← → arrow keys to navigate, Space to flip
        </p>

        {/* Regenerate option */}
        <div className="pt-4 border-t border-[var(--border)] flex justify-center">
          <button
            onClick={onGenerateFlashcards}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm border rounded-xl transition-colors ${
              isLoading 
                ? "text-cyan-400 border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 cursor-wait"
                : "text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating new flashcards...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Regenerate Flashcards
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
