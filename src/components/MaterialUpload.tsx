"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Loader2, Sparkles, Info } from "lucide-react";

interface MaterialUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { title: string; content?: string; file?: File; smartCleanup?: boolean }) => Promise<void>;
}

export function MaterialUpload({ isOpen, onClose, onUpload }: MaterialUploadProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [smartCleanup, setSmartCleanup] = useState(true); // Default ON
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Supported file types
      const supportedTypes = [
        "application/pdf",
        "text/plain", 
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword", // .doc
      ];
      
      if (!supportedTypes.includes(selectedFile.type)) {
        setError("Only PDF, Word (.docx), and text files are supported");
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
        smartCleanup: mode === "file" ? smartCleanup : false,
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
          <h2 className="text-xl font-semibold">Tambah Materi Pembelajaran</h2>
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
            <label className="block text-sm font-medium mb-2">Judul</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul materi"
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
              Ketik Teks
            </button>
          </div>

          {/* File upload */}
          {mode === "file" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx,.doc,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
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
                    <p className="font-medium">Klik untuk upload</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      PDF, Word (.docx), atau TXT maksimal 10MB
                    </p>
                  </>
                )}
              </div>

              {/* Smart Cleanup Toggle */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">AI Smart Cleanup</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Hapus daftar isi, halaman kosong, dll
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSmartCleanup(!smartCleanup)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    smartCleanup 
                      ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      smartCleanup ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Info about Smart Cleanup */}
              {smartCleanup && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    AI akan membersihkan: Daftar Isi, Daftar Gambar, Cover, Halaman Kosong, 
                    Header/Footer berulang, dan bagian tidak penting lainnya.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text input */}
          {mode === "text" && (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ketik atau paste materi pembelajaran di sini..."
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
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {smartCleanup && mode === "file" ? "AI Processing..." : "Uploading..."}
                </>
              ) : (
                "Tambah Materi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
