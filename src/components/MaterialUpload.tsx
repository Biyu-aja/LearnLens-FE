"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Loader2 } from "lucide-react";

interface MaterialUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { title: string; content?: string; file?: File }) => Promise<void>;
}

export function MaterialUpload({ isOpen, onClose, onUpload }: MaterialUploadProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf" && selectedFile.type !== "text/plain") {
        setError("Only PDF and text files are supported");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError("");
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (mode === "file" && !file) {
      setError("Please select a file");
      return;
    }

    if (mode === "text" && !content.trim()) {
      setError("Please enter some content");
      return;
    }

    setIsLoading(true);
    try {
      await onUpload({
        title: title.trim(),
        content: mode === "text" ? content : undefined,
        file: mode === "file" ? file! : undefined,
      });
      // Reset form
      setTitle("");
      setContent("");
      setFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload material");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFile(null);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetForm}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--surface)] rounded-2xl shadow-2xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold">Add Learning Material</h2>
          <button
            onClick={resetForm}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your material"
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
            />
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 p-1 bg-[var(--background)] rounded-xl">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "file"
                  ? "bg-[var(--surface)] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Upload size={16} />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "text"
                  ? "bg-[var(--surface)] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <FileText size={16} />
              Paste Text
            </button>
          </div>

          {/* File upload */}
          {mode === "file" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={24} className="text-[var(--primary)]" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-[var(--foreground-muted)] mb-3" />
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      PDF or TXT files up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Text input */}
          {mode === "text" && (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or type your learning material here..."
                rows={8}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-[var(--error)] bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add Material"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
