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

// Main 3 AI models
const MAIN_MODELS = [
  { id: "gemini-2.5-flash-lite", name: "Flash Lite", desc: "Fast & budget-friendly" },
  { id: "gemini-2.5-flash", name: "Flash", desc: "Balanced performance" },
  { id: "gemini-2.5-flash-thinking", name: "Flash Thinking", desc: "Best reasoning" },
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
              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium mb-2">AI Model</label>
                <div className="flex flex-col gap-2">
                  {models.map((model) => (
                    <div key={model.id} className="w-full">
                      <button
                        onClick={() => setSelectedModel(model.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedModel === model.id
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                            : "bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]"
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {model.name}
                            {model.tier === "listening" && <Sparkles size={12} className={selectedModel === model.id ? "text-white" : "text-amber-500"} />}
                          </div>
                          <div className={`text-xs mt-0.5 ${selectedModel === model.id ? "text-white/80" : "text-[var(--foreground-muted)]"}`}>
                            {model.price}
                          </div>
                        </div>
                        {selectedModel === model.id && <Check size={16} />}
                      </button>

                      {/* Model Details - Expanded when selected */}
                      {selectedModel === model.id && (model.description || (model.pros && model.pros.length > 0)) && (
                        <div className="mt-2 p-3 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)] text-xs">
                          {model.description && (
                            <p className="text-[var(--foreground)] font-medium mb-2 whitespace-pre-wrap">{model.description}</p>
                          )}
                          {model.pros && model.pros.length > 0 && (
                            <div className="space-y-1.5">
                              {model.pros.map((pro, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-[var(--foreground-muted)]">
                                  <span className="mt-1 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                  <span>{pro}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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
                  placeholder="Write instructions for the summary, e.g.:
• Focus on main concepts
• Use bullet point format
• Include important examples"
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
