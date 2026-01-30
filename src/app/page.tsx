"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Loader2,
  Share2,
  FileText,
  Network,
  ChevronDown,
  Zap,
  Brain,
  GraduationCap,
  Play,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeFeature, setActiveFeature] = useState(0);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "AI Tutoring",
      description:
        "Chat with an AI tutor that understands the context of your materials. Ask anything and get clear, easy-to-understand explanations.",
      color: "indigo",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Smart Summaries",
      description:
        "Get instant AI-generated summaries that capture the key points of complex documents in seconds.",
      color: "teal",
      gradient: "from-teal-500 to-emerald-500",
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Mind Maps",
      description:
        "Visualize your learning concepts in interactive mind maps that help you understand relationships between topics.",
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      title: "Quiz Mode",
      description:
        "Test your understanding with AI-generated quizzes tailored to your learning materials.",
      color: "orange",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Social Sharing",
      description:
        "Publish and explore learning materials from the community. Find inspiration and share knowledge.",
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "PDF Reports",
      description:
        "Export your learning progress and summaries to PDF format for offline reference or sharing.",
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-gradient-to-r from-indigo-500 to-teal-500 opacity-30 rounded-full animate-pulse"></div>
          <Loader2 className="animate-spin text-indigo-400 relative z-10" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-teal-400 blur-lg opacity-50"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
                <Sparkles size={20} className="sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              LearnLens
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <button onClick={scrollToFeatures} className="hover:text-white transition-colors">
              Features
            </button>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
          </nav>

          {/* Header buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => openAuth("login")}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth("register")}
              className="group relative px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold rounded-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-teal-400 transition-transform group-hover:scale-105"></div>
              <span className="relative flex items-center gap-2">
                Get Started
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
            </span>
            <span className="text-white/80">Powered by Advanced AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
            <span className="block text-white">Master anything with</span>
            <span className="relative">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                your AI tutor
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 rounded-full opacity-50 blur-sm"></span>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload PDFs, Word documents, paste text, or start a free research session. Get instant AI-powered summaries, 
            interactive mind maps, personalized quizzes, and a personal AI tutor to answer your questions 24/7.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => openAuth("register")}
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500 transition-all duration-300 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Start Learning Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-colors font-medium text-lg text-white/80 hover:text-white"
            >
              <Play className="w-5 h-5" />
              See Features
            </button>
          </div>

          <p className="text-sm text-white/40">
            Free to use • Supports PDF, Word, text input & free research
          </p>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <button onClick={scrollToFeatures} className="text-white/40 hover:text-white/60 transition-colors">
              <ChevronDown size={32} />
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm font-medium text-indigo-400 mb-6">
              <Sparkles size={16} />
              Full Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Everything you need for{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
                effective learning
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              An AI-powered learning platform designed to help you understand materials faster and deeper.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] ${
                  activeFeature === index ? "ring-2 ring-indigo-500/50 bg-white/10" : ""
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                {/* Gradient glow on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full text-sm font-medium text-teal-400 mb-6">
              <GraduationCap size={16} />
              How it Works
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Start learning in{" "}
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                3 easy steps
              </span>
            </h2>
          </div>

          <div className="relative">
            {/* Connection line - hidden on mobile */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500 -translate-y-1/2"></div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  step: "01",
                  title: "Upload Material",
                  description: "Upload PDFs, Word docs, paste text, or start free research. Our AI will process your content.",
                  icon: <FileText className="w-6 h-6" />,
                  gradient: "from-indigo-500 to-blue-500",
                },
                {
                  step: "02",
                  title: "AI Analyzes",
                  description: "In seconds, AI generates summaries, key concepts, and mind maps.",
                  icon: <Brain className="w-6 h-6" />,
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  step: "03",
                  title: "Learn & Quiz",
                  description: "Chat with AI tutor, take quizzes, and track your learning progress.",
                  icon: <GraduationCap className="w-6 h-6" />,
                  gradient: "from-teal-500 to-emerald-500",
                },
              ].map((item, index) => (
                <div key={index} className="relative group">
                  <div className="relative z-10 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all">
                    {/* Step number */}
                    <div
                      className={`relative w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      {item.icon}
                      <span className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 border-2 border-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-3">{item.title}</h3>
                    <p className="text-white/60 text-center">{item.description}</p>
                  </div>

                  {/* Arrow for mobile */}
                  {index < 2 && (
                    <div className="md:hidden flex justify-center my-4">
                      <ChevronDown className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-600 p-1">
            <div className="relative bg-slate-950/90 backdrop-blur-xl rounded-[22px] p-8 sm:p-12 text-center">
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  Ready to learn smarter?
                </h2>
                <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
                  Start for free now and experience how AI can help you understand any material faster.
                </p>
                <button
                  onClick={() => openAuth("register")}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white transition-all duration-300 group-hover:scale-105"></div>
                  <span className="relative flex items-center gap-2 text-slate-900">
                    <Zap className="w-5 h-5" />
                    Start Learning Now
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold">LearnLens</span>
            </div>

            <p className="text-sm text-white/40">
              © 2025 LearnLens. Built with ❤️ for learners everywhere.
            </p>
          </div>
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
