"use client";

import { useState } from "react";
import { X, Globe, Loader2, Info } from "lucide-react";

interface PublishConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (data: { title: string; description: string }) => Promise<void>;
  initialTitle: string;
}

export function PublishConfigModal({
  isOpen,
  onClose,
  onPublish,
  initialTitle,
}: PublishConfigModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onPublish({ title, description });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to publish");
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
      
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Globe size={20} className="text-amber-600 dark:text-amber-400" />
             </div>
             <div>
                <h2 className="font-semibold text-foreground">Publish to Explore</h2>
                <p className="text-xs text-foreground-muted">Share your material with the community</p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X size={18} className="text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-blue-700 dark:text-blue-400 flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                    Publishing creates a <strong>snapshot</strong> of your material. 
                    Changes to your private chat won't affect the published version unless you re-publish.
                    If you delete your private chat, the published version remains available.
                </p>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Title</label>
                <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Enter a descriptive title"
                    required
                />
            </div>

             <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-border focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                    placeholder="Describe what this material is about..."
                />
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-xl border border-border text-foreground hover:bg-surface-hover font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Publish Now"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
