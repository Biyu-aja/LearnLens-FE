"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, MessageSquare, HelpCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
              <Sparkles size={16} className="sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">LearnLens</span>
          </div>
          
          {/* Header buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => openAuth("login")}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth("register")}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Sparkles size={14} className="sm:w-4 sm:h-4" />
            AI-Powered Learning Assistant
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6">
            Understand anything
            <span className="gradient-text block mt-1 sm:mt-2">with AI tutoring</span>
          </h1>

          <p className="text-base sm:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
            Upload your learning materials and get instant AI-powered summaries, 
            key concepts, interactive quizzes, and a personal tutor to answer your questions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <button
              onClick={() => openAuth("register")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition-all font-medium text-base sm:text-lg shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30"
            >
              Start Learning Free
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => openAuth("login")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors font-medium text-base sm:text-lg"
            >
              Sign In
            </button>
          </div>
          
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
            Free to use • No credit card required
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-16 sm:mt-24 grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Feature 1 */}
          <div className="group p-5 sm:p-6 bg-white dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-[var(--border)] hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-lg hover:shadow-indigo-500/5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={20} className="sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Smart Summaries</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Get instant AI-generated summaries that capture the key points of any learning material.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-5 sm:p-6 bg-white dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-[var(--border)] hover:border-teal-200 dark:hover:border-teal-800 transition-all hover:shadow-lg hover:shadow-teal-500/5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare size={20} className="sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Chat with AI Tutor</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Ask questions about your material and get clear explanations from your personal AI tutor.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-5 sm:p-6 bg-white dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-[var(--border)] hover:border-purple-200 dark:hover:border-purple-800 transition-all hover:shadow-lg hover:shadow-purple-500/5 sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle size={20} className="sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Interactive Quizzes</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Test your understanding with AI-generated quizzes tailored to your learning materials.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-16 sm:mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How it works</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="flex-1 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg font-bold">
                1
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2">Upload Material</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                Upload PDFs or paste text content
              </p>
            </div>

            <ArrowRight className="hidden md:block text-[var(--border)] shrink-0" size={24} />
            <div className="md:hidden w-8 h-8 flex items-center justify-center">
              <ArrowRight className="text-[var(--border)] rotate-90" size={20} />
            </div>

            {/* Step 2 */}
            <div className="flex-1 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg font-bold">
                2
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2">AI Analyzes</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                AI processes and understands your content
              </p>
            </div>

            <ArrowRight className="hidden md:block text-[var(--border)] shrink-0" size={24} />
            <div className="md:hidden w-8 h-8 flex items-center justify-center">
              <ArrowRight className="text-[var(--border)] rotate-90" size={20} />
            </div>

            {/* Step 3 */}
            <div className="flex-1 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg font-bold">
                3
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2">Learn & Quiz</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                Chat, get summaries, and take quizzes
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm text-[var(--foreground-muted)]">
          <p>© 2025 LearnLens. Built for hackathon.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}
