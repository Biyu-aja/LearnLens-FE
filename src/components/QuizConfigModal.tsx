"use client";

import { useState, useEffect } from "react";
import { X, Loader2, HelpCircle, Sparkles, FileText, Plus, Check } from "lucide-react";
import { MaterialSummary, AIModel, authAPI, materialsAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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
}

export function QuizConfigModal({
  isOpen,
  onClose,
  onGenerate,
  currentMaterialId,
  currentMaterialTitle,
}: QuizConfigModalProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Config state
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [selectedModel, setSelectedModel] = useState(user?.preferredModel || "gemini-2.5-flash-lite");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([currentMaterialId]);
  const [customText, setCustomText] = useState("");
  const [showCustomText, setShowCustomText] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset to current material
      setSelectedMaterials([currentMaterialId]);
      setCustomText("");
      setShowCustomText(false);
    }
  }, [isOpen, currentMaterialId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsRes, modelsRes] = await Promise.all([
        materialsAPI.list(),
        authAPI.getModels(),
      ]);
      setMaterials(materialsRes.materials);
      setModels(modelsRes.models);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedMaterials(materials.map((m) => m.id));
  };

  const selectNone = () => {
    // Always keep at least the current material
    setSelectedMaterials([currentMaterialId]);
  };

  const handleGenerate = async () => {
    if (selectedMaterials.length === 0 && !customText.trim()) {
      alert("Please select at least one material or add custom text.");
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate({
        questionCount,
        difficulty,
        model: selectedModel,
        materialIds: selectedMaterials,
        customText: customText.trim(),
      });
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
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <HelpCircle size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Generate Quiz</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Configure your quiz settings</p>
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
              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <div className="flex flex-wrap gap-2">
                  {questionOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

              {/* Material Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Select Materials</label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-[var(--foreground-muted)]">|</span>
                    <button
                      onClick={selectNone}
                      className="text-xs text-[var(--foreground-muted)] hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl max-h-40 overflow-y-auto">
                  {materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => toggleMaterial(material.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0 ${
                        selectedMaterials.includes(material.id) ? "bg-[var(--primary-light)]" : ""
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedMaterials.includes(material.id)
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-[var(--border)]"
                      }`}>
                        {selectedMaterials.includes(material.id) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{material.title}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">
                          {material.type.toUpperCase()} • {new Date(material.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {material.id === currentMaterialId && (
                        <span className="text-xs px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-full">
                          Current
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-2">
                  {selectedMaterials.length} material(s) selected
                </p>
              </div>

              {/* Custom Text */}
              <div>
                <button
                  onClick={() => setShowCustomText(!showCustomText)}
                  className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                >
                  <Plus size={14} />
                  {showCustomText ? "Hide custom text" : "Add custom text/topic"}
                </button>
                {showCustomText && (
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add additional topics or text to include in the quiz..."
                    className="mt-2 w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                    rows={4}
                  />
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
            disabled={isGenerating || (selectedMaterials.length === 0 && !customText.trim())}
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
