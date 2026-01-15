"use client";

import { useState, useEffect } from "react";
import { X, Loader2, FileText, Sparkles, Check, Languages, ListOrdered, BookOpen, Minimize2 } from "lucide-react";
import { AIModel, authAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface SummaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: SummaryConfig) => Promise<void>;
  currentMaterialTitle: string;
}

export interface SummaryConfig {
  model: string;
  customText: string;
}

// Prompt templates for summary
const PROMPT_TEMPLATES = [
  {
    id: "indonesian",
    label: "Bahasa Indonesia",
    icon: Languages,
    prompt: "Generate the summary in Indonesian language (Bahasa Indonesia).",
    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "english",
    label: "English",
    icon: Languages,
    prompt: "Generate the summary in English.",
    color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "bullet",
    label: "Bullet Points",
    icon: ListOrdered,
    prompt: "Format the summary using bullet points for easy reading.",
    color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "detailed",
    label: "Detailed",
    icon: BookOpen,
    prompt: "Create a detailed and comprehensive summary covering all important points.",
    color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "concise",
    label: "Concise",
    icon: Minimize2,
    prompt: "Create a brief and concise summary focusing only on the key points.",
    color: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30",
  },
];

export function SummaryConfigModal({
  isOpen,
  onClose,
  onGenerate,
  currentMaterialTitle,
}: SummaryConfigModalProps) {
  const { user } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Config state
  const [selectedModel, setSelectedModel] = useState(user?.preferredModel || "gemini-2.5-flash-lite");
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadModels();
      setCustomPrompt("");
    }
  }, [isOpen]);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const modelsRes = await authAPI.getModels();
      setModels(modelsRes.models);
    } catch (error) {
      console.error("Failed to load models:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      await onGenerate({
        model: selectedModel,
        customText: customPrompt.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Group models by tier
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.tier]) acc[model.tier] = [];
    acc[model.tier].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  const tierOrder = ["flash", "standard", "pro", "thinking", "premium"];
  const tierLabels: Record<string, string> = {
    flash: "Flash (Budget)",
    standard: "Standard",
    pro: "Pro",
    thinking: "Thinking",
    premium: "Premium",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generate Summary</h2>
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
              {/* AI Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">AI Model</label>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {tierOrder.map((tier) => {
                    const tierModels = groupedModels[tier];
                    if (!tierModels || tierModels.length === 0) return null;
                    return (
                      <div key={tier}>
                        <div className="text-xs font-medium text-[var(--foreground-muted)] mb-1 flex items-center gap-1">
                          <Sparkles size={10} />
                          {tierLabels[tier]}
                        </div>
                        <div className="space-y-1">
                          {tierModels.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => setSelectedModel(model.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                                selectedModel === model.id
                                  ? "bg-[var(--primary-light)] text-[var(--primary)]"
                                  : "hover:bg-[var(--surface-hover)]"
                              }`}
                            >
                              <div>
                                <span className="font-medium">{model.name}</span>
                                <span className="text-[var(--foreground-muted)] ml-2">{model.price}</span>
                              </div>
                              {selectedModel === model.id && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                  placeholder="Tulis instruksi untuk summary, contoh:
• Gunakan bahasa Indonesia
• Fokus pada konsep utama
• Buat dalam format bullet points
• Sertakan contoh-contoh penting"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                  rows={4}
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
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
