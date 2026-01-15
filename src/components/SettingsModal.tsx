"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Settings, Check, Sparkles, Zap, Crown, Brain, Star, Type, FileText, Link, Key, Eye, EyeOff } from "lucide-react";
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
  const [maxContext, setMaxContext] = useState(8000);
  const [apiMode, setApiMode] = useState<"default" | "custom">("default");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setSelectedModel(user.preferredModel || "gemini-2.5-flash-lite");
      setMaxTokens(user.maxTokens || 1000);
      setMaxContext(user.maxContext || 8000);
      setCustomApiUrl(user.customApiUrl || "");
      setCustomModel(user.customModel || "");
      setCustomApiKey("");
      
      // Determine API mode based on saved settings
      if (user.customApiUrl || user.hasCustomApiKey || user.customModel) {
        setApiMode("custom");
      } else {
        setApiMode("default");
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
      const updateData: Record<string, unknown> = {
        preferredModel: selectedModel,
        maxTokens: maxTokens,
        maxContext: maxContext,
      };

      if (apiMode === "custom") {
        updateData.customApiUrl = customApiUrl || "";
        if (customApiKey) {
          updateData.customApiKey = customApiKey;
        }
        updateData.customModel = customModel || "";
      } else {
        updateData.customApiUrl = "";
        updateData.customModel = "";
      }

      const { user: updatedUser } = await authAPI.updateSettings(updateData as Parameters<typeof authAPI.updateSettings>[0]);
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
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
              {/* Max Output Length */}
              <div className="space-y-3">
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
                  Controls maximum length of AI responses.
                </p>
              </div>

              {/* Max Context Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[var(--foreground-muted)]" />
                    <label className="text-sm font-medium">Max Context Length</label>
                  </div>
                  <span className="text-sm font-mono bg-[var(--surface-hover)] px-2 py-1 rounded">
                    {(maxContext / 1000).toFixed(0)}k chars
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="20000"
                  step="1000"
                  value={maxContext}
                  onChange={(e) => setMaxContext(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />
                <p className="text-xs text-[var(--foreground-muted)]">
                  How much of your material content is sent to AI.
                </p>
              </div>

              {/* API Mode Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-medium">AI Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApiMode("default")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      apiMode === "default"
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <Sparkles size={16} />
                    HaluAI Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiMode("custom")}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      apiMode === "custom"
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <Link size={16} />
                    Custom API
                  </button>
                </div>
              </div>

              {/* Conditional Content Based on API Mode */}
              {apiMode === "default" ? (
                <div key="default-mode" className="space-y-4">
                  <div className="flex items-center gap-2">
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
                          <span className="text-sm font-medium">{tierLabels[tier]}</span>
                        </div>
                        <div className="space-y-2">
                          {tierModels.map((model) => (
                            <button
                              key={model.id}
                              type="button"
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
              ) : (
                <div key="custom-mode" className="space-y-4">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Use your own OpenAI-compatible API endpoint.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Link size={12} />
                      API Base URL
                    </label>
                    <input
                      type="url"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Key size={12} />
                      API Key
                      {user?.hasCustomApiKey && !customApiKey && (
                        <span className="text-green-500 text-xs">(saved)</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder={user?.hasCustomApiKey ? "••••••••••••" : "sk-..."}
                        className="w-full px-3 py-2.5 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Brain size={12} />
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g., gpt-4o, claude-sonnet-4"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      The exact model name to request from your API provider.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 Your custom API must be OpenAI-compatible.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
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
