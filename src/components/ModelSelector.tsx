"use client";

import { useState, useEffect } from "react";
import { Sparkles, Link, Zap, Brain, Check, Key, Type, FileText, Wifi, Loader2, CheckCircle, XCircle } from "lucide-react";
import { authAPI, AIModel, User } from "@/lib/api";

interface ModelSelectorProps {
  // Mode selection
  apiMode: "default" | "custom";
  onApiModeChange: (mode: "default" | "custom") => void;

  // Default mode props
  selectedModel: string;
  onModelSelect: (modelId: string) => void;

  // Custom mode props
  customApiUrl: string;
  onCustomApiUrlChange: (url: string) => void;
  customApiKey: string;
  onCustomApiKeyChange: (key: string) => void;
  customModel: string;
  onCustomModelChange: (model: string) => void;
  customMaxTokens?: number;
  onCustomMaxTokensChange?: (val: number) => void;
  customMaxContext?: number;
  onCustomMaxContextChange?: (val: number) => void;

  // Context
  user?: User | null;
  compact?: boolean;
}

export const HALU_MODELS = [
  { 
    id: "gemini-2.5-flash-lite", 
    name: "Gemini 2.5 Flash Lite", 
    desc: "Ultralight & optimized for speed" 
  },
  { 
    id: "gemini-2.5-flash", 
    name: "Gemini 2.5 Flash", 
    desc: "Versatile performance for everyday tasks" 
  },
  { 
    id: "gemini-3-flash", 
    name: "Gemini 3 Flash", 
    desc: "Next-gen speed with enhanced logic" 
  },
];

export function ModelSelector({
  apiMode,
  onApiModeChange,
  selectedModel,
  onModelSelect,
  customApiUrl,
  onCustomApiUrlChange,
  customApiKey,
  onCustomApiKeyChange,
  customModel,
  onCustomModelChange,
  customMaxTokens = 1000,
  onCustomMaxTokensChange,
  customMaxContext = 8000,
  onCustomMaxContextChange,
  user,
  compact = false
}: ModelSelectorProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    if (!customApiUrl || !customModel) {
      setTestResult({ success: false, message: "URL & Model required" });
      return;
    }

    // Check if we have API key (either new input or saved)
    if (!customApiKey && !user?.hasCustomApiKey) {
      setTestResult({ success: false, message: "API Key required" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await authAPI.testCustomApi(customApiUrl, customApiKey, customModel);
      if (response.success) {
        setTestResult({ 
          success: true, 
          message: `Connected: ${response.model || customModel}` 
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
        message: err.message || "Failed to connect" 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="space-y-3">
        {!compact && <label className="text-sm font-medium">AI Provider</label>}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onApiModeChange("default")}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
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
            onClick={() => onApiModeChange("custom")}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
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

      {/* Content based on mode */}
      {apiMode === "default" ? (
        <div className="space-y-3">
          {!compact && (
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-[var(--foreground-muted)]" />
              <label className="text-sm font-medium">AI Model</label>
            </div>
          )}
          
          <div className="space-y-2">
            {HALU_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => onModelSelect(model.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedModel === model.id
                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                    : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600`}>
                    <Zap size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{model.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{model.desc}</p>
                  </div>
                </div>
                {selectedModel === model.id && (
                  <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in">
           {!compact && (
             <p className="text-xs text-[var(--foreground-muted)]">
               Use your own OpenAI-compatible API endpoint.
             </p>
           )}
          
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2 text-[var(--foreground-muted)]">
              <Link size={12} />
              API Base URL
            </label>
            <input
              type="url"
              value={customApiUrl}
              onChange={(e) => onCustomApiUrlChange(e.target.value)}
              placeholder="https://api.openai.com/v1"
              autoComplete="off"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2 text-[var(--foreground-muted)]">
              <Key size={12} />
              API Key
              {user?.hasCustomApiKey && !customApiKey && (
                <span className="text-green-500 text-xs ml-auto">(saved)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={customApiKey}
                onChange={(e) => onCustomApiKeyChange(e.target.value)}
                placeholder={user?.hasCustomApiKey ? "Saved (enter to update)" : "sk-..."}
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2 text-[var(--foreground-muted)]">
              <Brain size={12} />
              Model Name
            </label>
            <input
              type="text"
              value={customModel}
              onChange={(e) => onCustomModelChange(e.target.value)}
              placeholder="e.g., gpt-4o"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {!compact && onCustomMaxTokensChange && customMaxTokens !== undefined && (
             <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type size={14} className="text-[var(--foreground-muted)]" />
                  <label className="text-xs font-medium text-[var(--foreground-muted)]">Max Output</label>
                </div>
                <span className="text-xs font-mono bg-[var(--surface-hover)] px-1.5 py-0.5 rounded">
                  {customMaxTokens === 1000000 ? 'Unlimited' : `${customMaxTokens.toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={customMaxTokens}
                onChange={(e) => onCustomMaxTokensChange(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>
          )}

          {!compact && onCustomMaxContextChange && customMaxContext !== undefined && (
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[var(--foreground-muted)]" />
                  <label className="text-xs font-medium text-[var(--foreground-muted)]">Max Context</label>
                </div>
                <span className="text-xs font-mono bg-[var(--surface-hover)] px-1.5 py-0.5 rounded">
                  {customMaxContext >= 1000000 ? `${(customMaxContext / 1000000).toFixed(1)}M` : `${(customMaxContext / 1000).toFixed(0)}k`}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="1000000"
                step="1000"
                value={customMaxContext}
                onChange={(e) => onCustomMaxContextChange(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !customApiUrl || !customModel}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-all mt-2"
          >
            {isTesting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wifi size={14} />
            )}
            Test Connection
          </button>

          {testResult && (
            <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
              testResult.success 
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            }`}>
              {testResult.success ? <CheckCircle size={14} className="mt-0.5" /> : <XCircle size={14} className="mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
