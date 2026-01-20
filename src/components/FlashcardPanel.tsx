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

        {/* Flashcard */}
        <div 
          className="relative cursor-pointer perspective-1000"
          onClick={handleFlip}
          style={{ minHeight: "280px" }}
        >
          <div 
            className={`w-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{ 
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 backface-hidden rounded-2xl p-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-xs uppercase tracking-wider mb-4 opacity-75">Question</div>
              <p className="text-xl font-medium leading-relaxed">
                {flashcards[currentIndex]?.front}
              </p>
              {flashcards[currentIndex]?.category && (
                <span className="mt-4 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {flashcards[currentIndex].category}
                </span>
              )}
              <div className="absolute bottom-4 text-sm opacity-60">
                Click to flip
              </div>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 backface-hidden rounded-2xl p-8 bg-[var(--surface)] border-2 border-cyan-500/30 shadow-xl flex flex-col items-center justify-center text-center"
              style={{ 
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="text-xs uppercase tracking-wider mb-4 text-cyan-500">Answer</div>
              <p className="text-lg text-[var(--foreground)] leading-relaxed">
                {flashcards[currentIndex]?.back}
              </p>
              <div className="absolute bottom-4 text-sm text-[var(--foreground-muted)]">
                Click to flip back
              </div>
            </div>
          </div>
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

        {/* Generate new */}
        <div className="pt-4 border-t border-[var(--border)]">
          <button
            onClick={onGenerateFlashcards}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            Regenerate Flashcards
          </button>
        </div>
      </div>
    </div>
  );
}
