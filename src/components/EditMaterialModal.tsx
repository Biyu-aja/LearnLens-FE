"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Save, Sparkles, Trash2, AlertTriangle } from "lucide-react";
import { materialsAPI, aiAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  initialTitle: string;
  initialContent: string;
  onUpdate: () => void;
}

// Max context default - 1M for HaluAI Gateway (consistent with ChatPanel)
const DEFAULT_MAX_CONTEXT = 1000000;

export function EditMaterialModal({ 
  isOpen, 
  onClose, 
  materialId, 
  initialTitle, 
  initialContent, 
  onUpdate 
}: EditMaterialModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent || "");
      setError("");
      setSuccess("");
    }
  }, [isOpen, initialTitle, initialContent]);

  if (!isOpen) return null;

  const maxContext = user?.maxContext || DEFAULT_MAX_CONTEXT;
  const contentLength = content.length;
  const isOverLimit = contentLength > maxContext;
  const usagePercent = Math.min((contentLength / maxContext) * 100, 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await materialsAPI.update(materialId, { title, content });
      onUpdate();
      onClose();
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError("Failed to update material");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAICleanup = async () => {
    setIsCleaning(true);
    setError("");
    setSuccess("");

    try {
      const response = await aiAPI.cleanupContent(materialId, content);
      setContent(response.cleanedContent);
      setSuccess(`Successfully removed ${response.removedChars.toLocaleString()} unnecessary characters!`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to clean up content");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleClearContent = () => {
    if (confirm("Are you sure you want to delete all content? This action cannot be undone.")) {
      setContent("");
    }
  };

  const getUsageColor = () => {
    if (usagePercent >= 100) return "bg-red-500";
    if (usagePercent >= 80) return "bg-amber-500";
    return "bg-green-500";
  };

  const getUsageTextColor = () => {
    if (isOverLimit) return "text-red-500";
    if (usagePercent >= 80) return "text-amber-500";
    return "text-[var(--foreground-muted)]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-[var(--surface)] rounded-2xl shadow-2xl fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Edit Material</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-hover)] rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col min-h-[300px]">
              {/* Header with actions */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="block text-sm font-medium">Content</label>
                <div className="flex items-center gap-2">
                  {/* AI Cleanup Button */}
                  <button
                    type="button"
                    onClick={handleAICleanup}
                    disabled={isCleaning || !content.trim()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    title="AI will remove unnecessary parts like table of contents, list of figures, empty pages, etc."
                  >
                    {isCleaning ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {isCleaning ? "Cleaning..." : "AI Cleanup"}
                  </button>

                  {/* Add File Button */}
                  <div className="relative">
                    <input
                      type="file"
                      id="append-file"
                      className="hidden"
                      accept=".txt,.pdf,.docx,.doc,.md"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          setIsLoading(true);
                          const res = await materialsAPI.parse(file);
                          const separator = content ? "\n\n--- ADDITIONAL CONTENT ---\n\n" : "";
                          setContent((prev) => prev + separator + res.content);
                        } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
                          setError("Failed to read file");
                        } finally {
                          setIsLoading(false);
                          e.target.value = "";
                        }
                      }}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="append-file"
                      className={`text-xs px-3 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] rounded-lg cursor-pointer transition-colors inline-block ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      + Add File
                    </label>
                  </div>

                  {/* Clear Content Button */}
                  <button
                    type="button"
                    onClick={handleClearContent}
                    disabled={!content.trim()}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 transition-colors"
                    title="Delete all content"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Content Usage Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={getUsageTextColor()}>
                    {contentLength.toLocaleString()} / {maxContext.toLocaleString()} characters
                  </span>
                  <span className={getUsageTextColor()}>
                    {usagePercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${getUsageColor()}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                {isOverLimit && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
                    <AlertTriangle size={12} />
                    <span>Content exceeds limit! AI will only read the first {maxContext.toLocaleString()} characters.</span>
                  </div>
                )}
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none font-mono text-sm leading-relaxed"
                placeholder="Material content..."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
