"use client";

import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, Loader2, HelpCircle, Trash2 } from "lucide-react";
import { Quiz } from "@/lib/api";

interface QuizCardProps {
  quiz: Quiz;
  index: number;
  onAnswer: (isCorrect: boolean) => void;
}

export function QuizCard({ quiz, index, onAnswer }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (optionIndex: number) => {
    if (revealed) return;
    setSelected(optionIndex);
  };

  const handleCheck = () => {
    if (selected === null) return;
    setRevealed(true);
    onAnswer(selected === quiz.answer);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 fade-in">
      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-semibold text-xs sm:text-sm shrink-0">
          {index + 1}
        </div>
        <p className="font-medium text-sm sm:text-base">{quiz.question}</p>
      </div>

      <div className="space-y-2 mb-3 sm:mb-4">
        {quiz.options.map((option, optionIndex) => {
          let bgClass = "hover:border-[var(--primary)]";
          
          if (revealed) {
            if (optionIndex === quiz.answer) {
              bgClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
            } else if (optionIndex === selected) {
              bgClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
            }
          } else if (selected === optionIndex) {
            bgClass = "border-[var(--primary)] bg-[var(--primary-light)]";
          }

          return (
            <button
              key={optionIndex}
              onClick={() => handleSelect(optionIndex)}
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
                {revealed && optionIndex === selected && optionIndex !== quiz.answer && (
                  <XCircle size={16} className="sm:w-[18px] sm:h-[18px] text-red-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!revealed && (
        <button
          onClick={handleCheck}
          disabled={selected === null}
          className="w-full px-4 py-2 sm:py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          Check Answer
        </button>
      )}

      {revealed && (
        <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm ${
          selected === quiz.answer 
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" 
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
        }`}>
          {selected === quiz.answer ? (
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
  onGenerateQuiz: () => Promise<void>;
  onDeleteQuizzes: () => Promise<void>;
  onShowConfig: () => void;
  isLoading: boolean;
}

export function QuizPanel({ quizzes, onGenerateQuiz, onDeleteQuizzes, onShowConfig, isLoading }: QuizPanelProps) {
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (isCorrect: boolean) => {
    setScore((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));

    if (score.total + 1 === quizzes.length) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setScore({ correct: 0, total: 0 });
    setShowResults(false);
  };

  const handleGenerate = () => {
    handleReset();
    onShowConfig();
  };

  return (
    <div className="p-4 sm:p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Quiz</h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
            Test your understanding
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
          {/* Score card */}
          {showResults && (
            <div className="bg-gradient-to-r from-indigo-500 to-teal-500 rounded-xl p-4 sm:p-6 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Quiz Complete!</h3>
              <p className="text-white/80 text-sm sm:text-base mb-3 sm:mb-4">
                You scored {score.correct} out of {quizzes.length}
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl font-bold">
                  {Math.round((score.correct / quizzes.length) * 100)}%
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
              onAnswer={handleAnswer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
