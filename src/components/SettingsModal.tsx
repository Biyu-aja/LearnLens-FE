"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Settings, Zap, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "id" | "en";
  onLanguageChange?: (lang: "id" | "en") => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      // Simple loading state
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
              <Settings size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-xs text-[var(--foreground-muted)]">AI Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[var(--primary)]" size={24} />
            </div>
          ) : (
            <>
              {/* AI Model Display - Fixed to Gemini 3 Flash */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">AI Model</label>
                <div className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--primary)] bg-[var(--primary-light)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Zap size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Gemini 3 Flash</p>
                      <p className="text-sm text-[var(--foreground-muted)]">Next-gen speed with enhanced logic</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  LearnLens uses Gemini 3 Flash for all AI features. This model provides the best balance of speed and intelligence.
                </p>
              </div>

              {/* Info Section */}
              <div className="bg-[var(--background)] rounded-xl p-4 border border-[var(--border)]">
                <h3 className="text-sm font-medium mb-2">About AI Features</h3>
                <ul className="text-xs text-[var(--foreground-muted)] space-y-1.5">
                  <li>• Chat with your materials for explanations</li>
                  <li>• Generate summaries and key concepts</li>
                  <li>• Create quizzes to test understanding</li>
                  <li>• Build flashcards for memorization</li>
                  <li>• Generate mind maps and study plans</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
