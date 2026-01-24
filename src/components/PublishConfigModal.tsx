"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Globe, AlertTriangle, Sparkles, FileText, CheckCircle } from "lucide-react";
import { aiAPI } from "@/lib/api";

interface PublishConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (data: { title: string; description: string; content: string }) => Promise<void>;
  initialTitle: string;
  initialContent: string;
  materialId: string;
}

export function PublishConfigModal({ 
  isOpen, 
  onClose, 
  onPublish,
  initialTitle,
  initialContent,
  materialId
}: PublishConfigModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [content, setContent] = useState(initialContent || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      // Use initialContent directly - in Research mode this is already the accumulated chat content
      setContent(initialContent || "");
      setDescription("");
      setError("");
      setSuccess("");
    }
  }, [isOpen, initialTitle, initialContent]);

  if (!isOpen) return null;

  const handleAICleanup = async () => {
    setIsCleaning(true);
    setError("");
    setSuccess("");

    try {
      const response = await aiAPI.cleanupContent(materialId, content);
      setContent(response.cleanedContent);
      setSuccess(`Content cleaned and structured! Removed ${response.removedChars.toLocaleString()} unnecessary characters.`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to clean up content");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onPublish({
        title: title.trim(),
        description: description.trim(),
        content
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish material");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
               <Globe size={20} className="text-amber-600 dark:text-amber-400" />
             </div>
             <div>
               <h3 className="font-semibold text-lg">Publish to Explore</h3>
               <p className="text-xs text-[var(--foreground-muted)]">Share a snapshot with the community</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 overflow-y-auto space-y-5">
            
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Snapshot Only</p>
                <p className="opacity-90">
                  This creates a public copy of your material. Cleaning or editing content here <strong>DOES NOT</strong> affect your original private material or chat history.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Public Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Enter a descriptive title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="What is this material about?"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} />
                  Public Content Preview
                </label>
                <button
                  type="button"
                  onClick={handleAICleanup}
                  disabled={isCleaning || !content.trim()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-medium shadow-sm"
                  title="Summarize & Structure content for public view"
                >
                  {isCleaning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isCleaning ? "Polishing..." : "AI Polish & Cleanup"}
                </button>
              </div>

              {success && (
                <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                  <CheckCircle size={14} /> {success}
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[250px] px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-y font-mono text-sm leading-relaxed"
                placeholder="Content to be published..."
              />
              <p className="text-xs text-[var(--foreground-muted)] mt-1.5 text-right">
                {content.length.toLocaleString()} characters
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--surface-hover)]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors disabled:opacity-50 font-medium text-sm shadow-lg shadow-amber-500/20"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
              Publish Snapshot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
