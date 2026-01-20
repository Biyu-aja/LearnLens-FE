"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Trophy, Target, Clock, TrendingUp, Loader2, Sparkles, X, ChevronDown, ChevronUp, History } from "lucide-react";
import { analyticsAPI, MaterialAnalytics, ChatMessage, QuizAttempt, LearningEvaluation } from "@/lib/api";

interface AnalyticsPanelProps {
  materialId: string;
}

export function AnalyticsPanel({ materialId }: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<MaterialAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Evaluation states
  const [evaluations, setEvaluations] = useState<LearningEvaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<LearningEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchEvaluations();
  }, [materialId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getMaterialAnalytics(materialId);
      setAnalytics(response.analytics);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await analyticsAPI.getEvaluations(materialId);
      setEvaluations(response.evaluations);
      if (response.evaluations.length > 0) {
        setSelectedEvaluation(response.evaluations[0]);
      }
    } catch (err) {
      // Silently fail - evaluations may not exist yet
      console.log("No evaluations yet");
    }
  };

  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true);
      setEvalError(null);
      const response = await analyticsAPI.evaluateLearning(materialId);
      setSelectedEvaluation(response.evaluation);
      setEvaluations(prev => [response.evaluation, ...prev]);
    } catch (err: any) {
      setEvalError(err.message || "Gagal membuat evaluasi");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Simple markdown-like formatting
  const formatEvaluation = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-base font-semibold text-[var(--foreground)] mt-4 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // List items
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={i} className="ml-4 text-sm text-[var(--foreground-muted)]">
            {line.replace(/^[-•] /, '')}
          </li>
        );
      }
      // Numbered list
      if (/^\d+\. /.test(line)) {
        return (
          <li key={i} className="ml-4 text-sm text-[var(--foreground-muted)]">
            {line.replace(/^\d+\. /, '')}
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <br key={i} />;
      }
      // Regular paragraph
      return (
        <p key={i} className="text-sm text-[var(--foreground-muted)]">
          {line}
        </p>
      );
    });
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return "No activity yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--foreground-muted)] mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chatActivity = analytics?.chatActivity || { totalQuestions: 0, lastActivity: null, recentMessages: [] };
  const quizPerf = analytics?.quizPerformance || { totalAttempts: 0, averageScore: 0, bestScore: 0, recentAttempts: [] };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Learning Analytics</h2>
          <p className="text-sm text-[var(--foreground-muted)]">Track your study progress for this material</p>
        </div>

        {/* AI Evaluation Section */}
        {chatActivity.totalQuestions > 0 && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">AI Learning Evaluation</h3>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {evaluations.length > 0 
                      ? `${evaluations.length} evaluasi tersimpan` 
                      : "Minta AI menganalisis progress belajarmu"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {evaluations.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-3 py-2 border border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/10 transition-colors flex items-center gap-2"
                  >
                    <History size={16} />
                    History
                    {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {evaluations.length > 0 ? "Evaluasi Ulang" : "Evaluasi"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Evaluation History */}
            {showHistory && evaluations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <p className="text-xs text-[var(--foreground-muted)] mb-2">Pilih evaluasi sebelumnya:</p>
                <div className="flex flex-wrap gap-2">
                  {evaluations.map((ev, idx) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvaluation(ev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedEvaluation?.id === ev.id
                          ? "bg-purple-500 text-white"
                          : "bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500/50"
                      }`}
                    >
                      <span className="font-bold">{ev.score}/10</span>
                      <span className="ml-2 opacity-70">{formatDate(ev.createdAt)}</span>
                      {idx === 0 && <span className="ml-1 text-[10px]">(terbaru)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evaluation Result */}
        {selectedEvaluation && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 relative max-h-[500px] overflow-y-auto">
            <button
              onClick={() => setSelectedEvaluation(null)}
              className="absolute top-4 right-4 p-1 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <X size={18} className="text-[var(--foreground-muted)]" />
            </button>
            <div className="flex items-center justify-between mb-4 pr-8">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-500" />
                <h3 className="font-semibold text-[var(--foreground)]">Hasil Evaluasi AI</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--foreground-muted)]">
                  {formatDate(selectedEvaluation.createdAt)}
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-bold">
                  {selectedEvaluation.score}/10
                </span>
              </div>
            </div>
            <div className="text-xs text-[var(--foreground-muted)] mb-4 flex gap-4">
              <span>📝 {selectedEvaluation.questionsCount} pertanyaan</span>
              {selectedEvaluation.quizAvgScore !== null && (
                <span>🎯 Quiz avg: {selectedEvaluation.quizAvgScore.toFixed(1)}%</span>
              )}
            </div>
            <div className="space-y-1">
              {formatEvaluation(selectedEvaluation.content)}
            </div>
          </div>
        )}

        {/* Evaluation Error */}
        {evalError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{evalError}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Questions */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageCircle size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">Questions</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {chatActivity.totalQuestions}
            </p>
          </div>

          {/* Last Activity */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">Last Active</span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {formatRelativeTime(chatActivity.lastActivity)}
            </p>
          </div>

          {/* Average Quiz Score */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {quizPerf.averageScore}%
            </p>
          </div>

          {/* Best Score */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Trophy size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">Best Score</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {quizPerf.bestScore}%
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Questions */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <MessageCircle size={18} />
              Recent Questions
            </h3>
            {chatActivity.recentMessages.filter(m => m.role === "user").length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                No questions asked yet
              </p>
            ) : (
              <div className="space-y-3">
                {chatActivity.recentMessages
                  .filter((m: ChatMessage) => m.role === "user")
                  .slice(0, 5)
                  .map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className="py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <p className="text-sm text-[var(--foreground)] line-clamp-2">
                      {message.content}
                    </p>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Attempts */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              Quiz History
            </h3>
            {quizPerf.recentAttempts.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                No quiz attempts yet
              </p>
            ) : (
              <div className="space-y-3">
                {quizPerf.recentAttempts.slice(0, 5).map((attempt: QuizAttempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {formatDate(attempt.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        attempt.percentage >= 80
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : attempt.percentage >= 60
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {attempt.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {chatActivity.totalQuestions === 0 && quizPerf.totalAttempts === 0 && (
          <div className="text-center py-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <TrendingUp size={48} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
              Start Learning!
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] max-w-md mx-auto">
              Your learning progress will appear here as you chat with the AI and take quizzes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
