"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Settings, Check, Sparkles, Zap, Crown, Brain, Star, Type, FileText, Link, Key, Eye, EyeOff, Wifi, WifiOff, CheckCircle, XCircle, Globe } from "lucide-react";
import { authAPI, AIModel } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "id" | "en";
  onLanguageChange?: (lang: "id" | "en") => void;
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
  
  // Default API (HaluAI Gateway) settings
  const [maxTokens, setMaxTokens] = useState(1000);
  const [maxContext, setMaxContext] = useState(8000);
  
  // Custom API settings
  const [customMaxTokens, setCustomMaxTokens] = useState(1000);
  const [customMaxContext, setCustomMaxContext] = useState(8000);
  
  const [apiMode, setApiMode] = useState<"default" | "custom">("default");
  const [savedApiMode, setSavedApiMode] = useState<"default" | "custom">("default"); // Track saved mode
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setSelectedModel(user.preferredModel || "gemini-2.5-flash-lite");
      
      // Initialize default API settings
      setMaxTokens(user.maxTokens || 1000);
      setMaxContext(user.maxContext || 8000);
      
      // Initialize custom API settings
      setCustomMaxTokens(user.customMaxTokens || 1000);
      setCustomMaxContext(user.customMaxContext || 8000);
      setCustomApiUrl(user.customApiUrl || "");
      setCustomModel(user.customModel || "");
      // Don't reset customApiKey if user already typed something
      // Only reset if this is a fresh open and there's no pending input
      
      // Reset test result when modal opens
      setTestResult(null);
      
      // Determine API mode based on saved settings
      // Check if user has actively chosen custom API (has URL AND either key or model)
      const hasActiveCustomApi = user.customApiUrl && (user.hasCustomApiKey || user.customModel);
      const determinedMode = hasActiveCustomApi ? "custom" : "default";
      
      setApiMode(determinedMode);
      setSavedApiMode(determinedMode);
      
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

  const handleTestConnection = async () => {
    if (!customApiUrl || !customModel) {
      setTestResult({ success: false, message: "API URL and Model name are required" });
      return;
    }

    // Check if we have API key (either new input or saved)
    if (!customApiKey && !user?.hasCustomApiKey) {
      setTestResult({ success: false, message: "API Key is required" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await authAPI.testCustomApi(customApiUrl, customApiKey, customModel);
      if (response.success) {
        setTestResult({ 
          success: true, 
          message: `Connected! Model: ${response.model || customModel}` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: response.error || "Connection failed" 
        });
      }
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: err.message || "Failed to connect to API" 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError("");
    try {
      const updateData: Record<string, unknown> = {
        preferredModel: selectedModel,
      };

      if (apiMode === "custom") {
        // Save custom API settings
        updateData.customApiUrl = customApiUrl || "";
        if (customApiKey) {
          updateData.customApiKey = customApiKey;
        }
        updateData.customModel = customModel || "";
        updateData.customMaxTokens = customMaxTokens;
        updateData.customMaxContext = customMaxContext;
      } else {
        // Save default API settings with optimal defaults
        updateData.maxTokens = 4000; // Force 4000 tokens for optimal performance
        updateData.maxContext = 500000; // Set to 500k for HaluAI Gateway
        // IMPORTANT: Clear custom API settings when switching to default
        // This ensures the backend knows to use HaluAI Gateway
        updateData.customApiUrl = "";
        updateData.customModel = "";
        updateData.customApiKey = ""; // Clear the API key too
      }

      const { user: updatedUser } = await authAPI.updateSettings(updateData as Parameters<typeof authAPI.updateSettings>[0]);
      updateUser(updatedUser);
      setSavedApiMode(apiMode); // Update saved mode after successful save
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
                  {/* Max Output Length - Hidden for Default API to simplify UX */}
                  {/* Instead, we force optimal defaults in handleSave (4000 tokens) */}
                  
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-[var(--foreground-muted)]" />
                    <label className="text-sm font-medium">AI Model</label>
                  </div>
                  
                  <div className="space-y-2">
                    {models.map((model) => (
                      <div key={model.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            selectedModel === model.id
                              ? "border-[var(--primary)] bg-[var(--primary-light)]"
                              : "border-[var(--border)] hover:border-[var(--primary)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <Zap size={16} className="text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{model.name}</p>
                              <p className="text-xs text-[var(--foreground-muted)]">{model.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedModel === model.id && (
                              <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                <Check size={14} className="text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                        
                        {/* Inline Details - shown when selected */}
                        {selectedModel === model.id && model.description && (
                          <div className="mt-2 ml-11 p-3 bg-[var(--background)] rounded-lg border border-[var(--border)] text-sm">
                            <p className="text-[var(--foreground-muted)] mb-3">{model.description}</p>
                            
                            <div className="flex gap-4">
                              {model.pros && model.pros.length > 0 && (
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-[10px]">✓</span>
                                    Kelebihan
                                  </p>
                                  <ul className="text-xs text-[var(--foreground-muted)] space-y-1">
                                    {model.pros.map((pro, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {model.cons && model.cons.length > 0 && (
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-[10px]">!</span>
                                    Kekurangan
                                  </p>
                                  <ul className="text-xs text-[var(--foreground-muted)] space-y-1">
                                    {model.cons.map((con, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-orange-500 mt-0.5">•</span>
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div key="custom-mode" className="space-y-4">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Use your own OpenAI-compatible API endpoint.
                  </p>
                <form autoComplete="off">
                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Link size={12} />
                      API Base URL
                    </label>
                    <input
                      type="url"
                      name="customApiUrl"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      autoComplete="off"
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
                        name="customApiKey"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="API Key Password"
                        autoComplete="new-password"
                        className="w-full px-3 py-2.5 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium flex items-center gap-2">
                      <Brain size={12} />
                      Model Name
                    </label>
                    <input
                      type="text"
                      name="customModel"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g., gpt-4o, claude-sonnet-4"
                      className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      The exact model name to request from your API provider.
                    </p>
                  </div>

                  {/* Max Output Length - Custom API */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Type size={16} className="text-[var(--foreground-muted)]" />
                        <label className="text-sm font-medium">Max Output Length</label>
                      </div>
                      <span className="text-sm font-mono bg-[var(--surface-hover)] px-2 py-1 rounded">
                        {customMaxTokens === 1000000 ? 'Unlimited' : `${customMaxTokens.toLocaleString()} tokens`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000000"
                      step="1000"
                      value={customMaxTokens}
                      onChange={(e) => setCustomMaxTokens(Number(e.target.value))}
                      className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                    />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Controls maximum length of AI responses. Set to max for unlimited output.
                    </p>
                  </div>

                  {/* Max Context Length - Custom API */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[var(--foreground-muted)]" />
                        <label className="text-sm font-medium">Max Context Length</label>
                      </div>
                      <span className="text-sm font-mono bg-[var(--surface-hover)] px-2 py-1 rounded">
                        {customMaxContext >= 1000000 ? `${(customMaxContext / 1000000).toFixed(1)}M` : `${(customMaxContext / 1000).toFixed(0)}k`} chars
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="10000000"
                      step="10000"
                      value={customMaxContext}
                      onChange={(e) => setCustomMaxContext(Number(e.target.value))}
                      className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                    />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      How much of your material is sent to AI. Can be set up to 10M characters for large contexts.
                    </p>
                  </div>
                </form>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 Your custom API must be OpenAI-compatible.
                    </p>
                  </div>

                  {/* Test Connection Button */}
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !customApiUrl || !customModel}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Wifi size={16} />
                        Test Connection
                      </>
                    )}
                  </button>

                  {/* Test Result */}
                  {testResult && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      testResult.success 
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    }`}>
                      {testResult.success ? (
                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={18} className="shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
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
