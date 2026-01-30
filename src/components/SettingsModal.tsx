"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Settings} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ModelSelector } from "./ModelSelector";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "id" | "en";
  onLanguageChange?: (lang: "id" | "en") => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-lite");
  
  // Default API (HaluAI Gateway) settings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [maxTokens, setMaxTokens] = useState(1000);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [maxContext, setMaxContext] = useState(8000);
  
  // Custom API settings
  const [customMaxTokens, setCustomMaxTokens] = useState(1000);
  const [customMaxContext, setCustomMaxContext] = useState(8000);
  
  const [apiMode, setApiMode] = useState<"default" | "custom">("default");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savedApiMode, setSavedApiMode] = useState<"default" | "custom">("default"); // Track saved mode
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
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
      
      // Determine API mode based on saved settings
      // Check if user has actively chosen custom API (has URL AND either key or model)
      const hasActiveCustomApi = user.customApiUrl && (user.hasCustomApiKey || user.customModel);
      const determinedMode = hasActiveCustomApi ? "custom" : "default";
      
      setApiMode(determinedMode);
      setSavedApiMode(determinedMode);
      setIsLoading(false);
    }
  }, [isOpen, user]);

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
                customMaxTokens={customMaxTokens}
                onCustomMaxTokensChange={setCustomMaxTokens}
                customMaxContext={customMaxContext}
                onCustomMaxContextChange={setCustomMaxContext}
                user={user}
              />
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
