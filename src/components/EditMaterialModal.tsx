"use client";

import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { materialsAPI } from "@/lib/api";

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  initialTitle: string;
  initialContent: string;
  onUpdate: () => void;
}

export function EditMaterialModal({ 
  isOpen, 
  onClose, 
  materialId, 
  initialTitle, 
  initialContent, 
  onUpdate 
}: EditMaterialModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // We need to implement update endpoint in API first, but assuming it exists or we add it
      // For now, let's create a new version of materialsAPI.update, or use a workaround
      // Since we don't have a direct 'update' in our api.ts yet, I'll add it there next.
      // But for this component:
      await materialsAPI.update(materialId, { title, content });
      onUpdate();
      onClose();
    } catch (err) {
      setError("Failed to update material");
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
      <div className="relative w-full max-w-4xl bg-[var(--surface)] rounded-2xl shadow-2xl fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Edit Material</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-hover)] rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>
            <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Content</label>
                <div className="relative">
                  <input
                    type="file"
                    id="append-file"
                    className="hidden"
                    accept=".txt,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        setIsLoading(true);
                        const res = await materialsAPI.parse(file);
                        const separator = content ? "\n\n--- NEW MATERIAL ---\n\n" : "";
                        setContent((prev) => prev + separator + res.content);
                      } catch (err) {
                        setError("Failed to parse file");
                      } finally {
                        setIsLoading(false);
                        // Reset input
                        e.target.value = "";
                      }
                    }}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="append-file"
                    className={`text-xs px-2 py-1 bg-[var(--surface-hover)] hover:bg-[var(--border)] rounded cursor-pointer transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    + Add File
                  </label>
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none font-mono text-sm leading-relaxed"
                placeholder="Content text..."
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
