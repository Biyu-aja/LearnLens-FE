"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Settings, Check, Sparkles, Zap, Crown, Brain, Star, Type } from "lucide-react";
import { authAPI, AIModel } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tierIcons = {
  flash: Zap,
  standard: Sparkles,
  pro: Crown,
  thinking: Brain,
  premium: Star,
};

const tierColors = {
  flash: "text-green-500 bg-green-100 dark:bg-green-900/30",
  standard: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  pro: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  thinking: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  premium: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-lite");
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setSelectedModel(user.preferredModel || "gemini-2.5-flash-lite");
        setMaxTokens(user.maxTokens || 1000);
      }
      fetchModels();
    }
  }, [isOpen, user]);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.getModels();
      setModels(response.models);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      // Fallback
      setModels([
        { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", tier: "flash", price: "Rp 5.000/1M tokens" },
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "flash", price: "Rp 5.000/1M tokens" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError("");
    try {
      const { user: updatedUser } = await authAPI.updateSettings({ 
        preferredModel: selectedModel,
        maxTokens: maxTokens 
      });
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
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
  const tierLabels = {
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

      <div className="relative w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl fade-in overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
              <Settings size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Configure AI preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[var(--primary)]" size={24} />
            </div>
          ) : (
            <>
              {/* Max Tokens Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type size={16} className="text-[var(--foreground-muted)]" />
                    <label className="text-sm font-medium">Max Output Length</label>
                  </div>
                  <span className="text-sm font-mono bg-[var(--surface-hover)] px-2 py-1 rounded">
                    {maxTokens} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />
                <p className="text-xs text-[var(--foreground-muted)]">
                  Higher values allow longer responses but may take longer to generate.
                </p>
              </div>

              {/* Model Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <Brain size={16} className="text-[var(--foreground-muted)]" />
                   <label className="text-sm font-medium">AI Model</label>
                </div>
                
                {tierOrder.map((tier) => {
                  const tierModels = groupedModels[tier];
                  if (!tierModels || tierModels.length === 0) return null;

                  const TierIcon = tierIcons[tier as keyof typeof tierIcons] || Sparkles;

                  return (
                    <div key={tier}>
                      <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${tierColors[tier as keyof typeof tierColors]}`}>
                          <TierIcon size={14} />
                        </div>
                        <span className="text-sm font-medium">
                          {tierLabels[tier as keyof typeof tierLabels]}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {tierModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                              selectedModel === model.id
                                ? "border-[var(--primary)] bg-[var(--primary-light)]"
                                : "border-[var(--border)] hover:border-[var(--primary)]"
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm">{model.name}</p>
                              <p className="text-xs text-[var(--foreground-muted)]">{model.price}</p>
                            </div>
                            {selectedModel === model.id && (
                              <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                <Check size={14} className="text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-[var(--border)] px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
