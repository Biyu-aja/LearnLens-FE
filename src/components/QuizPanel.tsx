"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RotateCcw, Loader2, HelpCircle, Trash2, Lightbulb, Send } from "lucide-react";
import { Quiz, analyticsAPI } from "@/lib/api";

interface QuizCardProps {
  quiz: Quiz;
  index: number;
  selectedAnswer: number | null;
  revealed: boolean;
  showHint: boolean;
  onSelect: (optionIndex: number) => void;
  onToggleHint: () => void;
}

export function QuizCard({ quiz, index, selectedAnswer, revealed, showHint, onSelect, onToggleHint }: QuizCardProps) {
  // Get hint from quiz data (AI-generated) or show a fallback message
  const hintText = quiz.hint || "Think carefully about the concepts covered in the material.";
  const hasHint = !!quiz.hint;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 fade-in">
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-semibold text-xs sm:text-sm shrink-0">
            {index + 1}
          </div>
          <p className="font-medium text-sm sm:text-base">{quiz.question}</p>
        </div>
        {!revealed && hasHint && (
          <button
            onClick={onToggleHint}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              showHint 
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
                : "text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"
            }`}
            title={showHint ? "Hide hint" : "Show hint"}
          >
            <Lightbulb size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>

      {/* Hint */}
      {showHint && !revealed && hasHint && (
        <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <Lightbulb size={14} className="shrink-0 mt-0.5" />
            <span><strong>Hint:</strong> {hintText}</span>
          </p>
        </div>
      )}

      <div className="space-y-2 mb-3 sm:mb-4">
        {quiz.options.map((option, optionIndex) => {
          let bgClass = "hover:border-[var(--primary)]";
          
          if (revealed) {
            if (optionIndex === quiz.answer) {
              bgClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
            } else if (optionIndex === selectedAnswer) {
              bgClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
            }
          } else if (selectedAnswer === optionIndex) {
            bgClass = "border-[var(--primary)] bg-[var(--primary-light)]";
          }

          return (
            <button
              key={optionIndex}
              onClick={() => onSelect(optionIndex)}
              disabled={revealed}
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 border border-[var(--border)] rounded-lg transition-all ${bgClass} ${
                revealed ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-current flex items-center justify-center text-[10px] sm:text-xs font-medium shrink-0">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="flex-1 text-xs sm:text-sm">{option}</span>
                {revealed && optionIndex === quiz.answer && (
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-500 shrink-0" />
                )}
                {revealed && optionIndex === selectedAnswer && optionIndex !== quiz.answer && (
                  <XCircle size={16} className="sm:w-[18px] sm:h-[18px] text-red-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result feedback after submit */}
      {revealed && (
        <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm ${
          selectedAnswer === quiz.answer 
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" 
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
        }`}>
          {selectedAnswer === quiz.answer ? (
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
              <span className="font-medium">Correct!</span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 mt-0.5" />
              <span className="font-medium">
                Incorrect. The correct answer is: {quiz.options[quiz.answer]}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuizPanelProps {
  quizzes: Quiz[];
  materialId?: string;
  onGenerateQuiz: () => Promise<void>;
  onDeleteQuizzes: () => Promise<void>;
  onShowConfig: () => void;
  isLoading: boolean;
}

export function QuizPanel({ quizzes, materialId, onGenerateQuiz, onDeleteQuizzes, onShowConfig, isLoading }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when quizzes change
  useEffect(() => {
    setAnswers({});
    setHints({});
    setSubmitted(false);
  }, [quizzes]);

  const handleSelect = (quizId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [quizId]: optionIndex }));
  };

  const toggleHint = (quizId: string) => {
    setHints(prev => ({ ...prev, [quizId]: !prev[quizId] }));
  };

  const answeredCount = Object.values(answers).filter(a => a !== null && a !== undefined).length;
  const allAnswered = answeredCount === quizzes.length;

  const calculateScore = () => {
    let correct = 0;
    quizzes.forEach(quiz => {
      if (answers[quiz.id] === quiz.answer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitted) return;
    
    setIsSubmitting(true);
    const score = calculateScore();
    
    // Save to analytics if materialId is available
    if (materialId) {
      try {
        await analyticsAPI.saveQuizAttempt(materialId, score, quizzes.length);
        console.log("Quiz attempt saved to analytics");
      } catch (error) {
        console.error("Failed to save quiz attempt:", error);
      }
    }
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setAnswers({});
    setHints({});
    setSubmitted(false);
  };

  const handleGenerate = () => {
    handleReset();
    onShowConfig();
  };

  const score = calculateScore();
  const percentage = quizzes.length > 0 ? Math.round((score / quizzes.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Quiz</h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
            {quizzes.length > 0 
              ? `${answeredCount}/${quizzes.length} answered` 
              : "Test your understanding"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Loading...</span>
              </>
            ) : (
              <>
                <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Generate New Quiz</span>
                <span className="sm:hidden">New Quiz</span>
              </>
            )}
          </button>
          {quizzes.length > 0 && (
            <button
              onClick={onDeleteQuizzes}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-3 py-2 text-[var(--error)] border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors text-sm"
              title="Delete Quizzes"
            >
              <Trash2 size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Quiz content */}
      {quizzes.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <HelpCircle size={40} className="sm:w-12 sm:h-12 mx-auto text-[var(--foreground-muted)] mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No quiz yet</h3>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-4 sm:mb-6 px-4">
            Generate a quiz to test your understanding of the material
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Quiz"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Score card - show after submit */}
          {submitted && (
            <div className={`rounded-xl p-4 sm:p-6 text-white ${
              percentage >= 80 
                ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                : percentage >= 60 
                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                : "bg-gradient-to-r from-red-500 to-pink-500"
            }`}>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                {percentage >= 80 ? "🎉 Excellent!" : percentage >= 60 ? "👍 Good job!" : "📚 Keep studying!"}
              </h3>
              <p className="text-white/80 text-sm sm:text-base mb-3 sm:mb-4">
                You scored {score} out of {quizzes.length}
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl font-bold">
                  {percentage}%
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Quiz cards */}
          {quizzes.map((quiz, index) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              index={index}
              selectedAnswer={answers[quiz.id] ?? null}
              revealed={submitted}
              showHint={hints[quiz.id] ?? false}
              onSelect={(optionIndex) => handleSelect(quiz.id, optionIndex)}
              onToggleHint={() => toggleHint(quiz.id)}
            />
          ))}

          {/* Submit Button - show only when not submitted */}
          {!submitted && quizzes.length > 0 && (
            <div className="sticky bottom-4 pt-4">
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-lg ${
                  allAnswered
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                    : "bg-[var(--surface-hover)] text-[var(--foreground-muted)] cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : allAnswered ? (
                  <>
                    <Send size={18} />
                    Submit Quiz ({answeredCount}/{quizzes.length})
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Answer all questions ({answeredCount}/{quizzes.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
