"use client";

import { useState, useEffect } from "react";
import { X, Loader2, HelpCircle, Sparkles, Wand2, BookOpen, Target } from "lucide-react";
import { AIModel, authAPI, CustomConfig } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ModelSelector } from "./ModelSelector";

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: QuizConfig) => Promise<void>;
  currentMaterialId: string;
  currentMaterialTitle: string;
}

export interface QuizConfig {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  model: string;
  materialIds: string[];
  customText: string;
  customConfig?: CustomConfig;
}

// Prompt templates
const PROMPT_TEMPLATES = [
  {
    id: "focus",
    label: "Focus on Material",
    icon: BookOpen,
    prompt: "Focus on content {materialTitle} from the material.",
    color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "keyterms",
    label: "Key Terms",
    icon: Target,
    prompt: "Focus questions on key terminology, definitions, and vocabulary from the material.",
    color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "concepts",
    label: "Main Concepts",
    icon: Wand2,
    prompt: "Focus questions on main concepts and their applications, not just facts.",
    color: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30",
  },
];

export function QuizConfigModal({
  isOpen,
  onClose,
  onGenerate,
  currentMaterialId,
  currentMaterialTitle,
}: QuizConfigModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Config state
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  
  // Model state
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-lite");
  const [apiMode, setApiMode] = useState<"default" | "custom">("default");
  
  // Custom API state
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setSelectedModel(user.preferredModel || "gemini-2.5-flash-lite");
        
        setCustomApiUrl(user.customApiUrl || "");
        setCustomModel(user.customModel || "");
        // We don't pre-fill apiKey for security unless user enters it, 
        // but ModelSelector handles showing "Saved" if user.hasCustomApiKey is true.
        
        const hasActiveCustomApi = user.customApiUrl && (user.hasCustomApiKey || user.customModel);
        setApiMode(hasActiveCustomApi ? "custom" : "default");
        
      }
      // Reset custom prompt
      setCustomPrompt("");
    }
  }, [isOpen, currentMaterialId, user]);

  // Add template text to custom prompt
  const addTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setCustomPrompt((prev) => {
        if (prev.trim()) {
          return prev.trim() + "\n" + template.prompt;
        }
        return template.prompt;
      });
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const config: QuizConfig = {
        questionCount,
        difficulty,
        model: selectedModel,
        materialIds: [currentMaterialId], // Always use current material
        customText: customPrompt.trim(),
      };

      if (apiMode === "custom") {
        config.customConfig = {
          customApiUrl,
          customApiKey, // might be empty if using saved key
          customModel
        };
      }

      await onGenerate(config);
      onClose();
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const questionOptions = [5, 10, 15, 20, 25, 30];
  const difficultyOptions = [
    { value: "easy" as const, label: "Easy", desc: "Basic recall questions" },
    { value: "medium" as const, label: "Medium", desc: "Application & understanding" },
    { value: "hard" as const, label: "Hard", desc: "Analysis & critical thinking" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <HelpCircle size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generate Quiz</h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                From: <span className="font-medium">{currentMaterialTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            </div>
          ) : (
            <>
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {difficultyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDifficulty(opt.value)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        difficulty === opt.value
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className={`text-xs mt-0.5 ${difficulty === opt.value ? "text-white/80" : "text-[var(--foreground-muted)]"}`}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <div className="flex flex-row gap-2">
                  {questionOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`px-4 py-2 w-full rounded-lg text-sm font-medium transition-all ${
                        questionCount === count
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Model */}
              <ModelSelector
                apiMode={apiMode}
                onApiModeChange={setApiMode}
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
                customApiUrl={customApiUrl}
                onCustomApiUrlChange={setCustomApiUrl}
                customApiKey={customApiKey}
                onCustomApiKeyChange={setCustomApiKey}
                customModel={customModel}
                onCustomModelChange={setCustomModel}
                // We omit token sliders for quiz as it's not relevant or handled by backend fixed limits usually
                user={user}
                compact={true}
              />

              {/* Prompt Templates */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Templates</label>
                <p className="text-xs text-[var(--foreground-muted)] mb-3">
                  Click to add to your custom instructions
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => addTemplate(template.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${template.color} hover:opacity-80`}
                      >
                        <Icon size={14} />
                        {template.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Instructions <span className="text-[var(--foreground-muted)] font-normal">(Optional)</span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Write instructions for the quiz, e.g.:
• Use simple language
• Focus on chapter 1 only
• Create scenario-based questions
• Avoid definition questions"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                  rows={5}
                />
                {customPrompt.trim() && (
                  <button
                    onClick={() => setCustomPrompt("")}
                    className="mt-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-[var(--border)] bg-[var(--background)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
