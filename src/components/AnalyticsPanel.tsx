"use client";

import { useState, useEffect } from "react";
import { Clock, Trophy, Target, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { analyticsAPI, MaterialAnalytics, StudySession, QuizAttempt } from "@/lib/api";

interface AnalyticsPanelProps {
  materialId: string;
}

export function AnalyticsPanel({ materialId }: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<MaterialAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
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

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
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

  const studyTime = analytics?.studyTime || { total: 0, sessions: 0, recentSessions: [] };
  const quizPerf = analytics?.quizPerformance || { totalAttempts: 0, averageScore: 0, bestScore: 0, recentAttempts: [] };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Learning Analytics</h2>
          <p className="text-sm text-[var(--foreground-muted)]">Track your study progress for this material</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Study Time */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">Study Time</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {formatDuration(studyTime.total)}
            </p>
          </div>

          {/* Total Sessions */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {studyTime.sessions}
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
          {/* Recent Study Sessions */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Clock size={18} />
              Recent Study Sessions
            </h3>
            {studyTime.recentSessions.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                No study sessions yet
              </p>
            ) : (
              <div className="space-y-3">
                {studyTime.recentSessions.slice(0, 5).map((session: StudySession) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {formatDate(session.startTime)}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {session.duration ? formatDuration(session.duration) : "In progress"}
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
        {studyTime.total === 0 && quizPerf.totalAttempts === 0 && (
          <div className="text-center py-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <TrendingUp size={48} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
              Start Learning!
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] max-w-md mx-auto">
              Your learning progress will appear here as you study this material and take quizzes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
