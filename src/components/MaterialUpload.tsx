"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Loader2, Sparkles, Info, Trash2, Lightbulb, MessageSquare } from "lucide-react";

interface MaterialUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { 
    title: string; 
    content?: string; 
    files?: File[]; 
    description?: string;
    type: "file" | "text" | "research";
    smartCleanup?: boolean 
  }) => Promise<void>;
}

export function MaterialUpload({ isOpen, onClose, onUpload }: MaterialUploadProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"file" | "text" | "research">("file");
  const [smartCleanup, setSmartCleanup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const supportedTypes = [
    "application/pdf",
    "text/plain", 
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;

    const invalidFiles = selectedFiles.filter(f => !supportedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setError(`Unsupported files: ${invalidFiles.map(f => f.name).join(", ")}`);
      return;
    }

    const oversizedFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Files too large (>10MB): ${oversizedFiles.map(f => f.name).join(", ")}`);
      return;
    }

    const existingNames = files.map(f => f.name);
    const newFiles = selectedFiles.filter(f => !existingNames.includes(f.name));
    const updatedFiles = [...files, ...newFiles];

    setFiles(updatedFiles);
    setError("");

    if (!title && updatedFiles.length === 1) {
      setTitle(updatedFiles[0].name.replace(/\.[^/.]+$/, ""));
    } else if (!title && updatedFiles.length > 1) {
      setTitle(`Combined: ${updatedFiles.slice(0, 2).map(f => f.name.replace(/\.[^/.]+$/, "")).join(" + ")}${updatedFiles.length > 2 ? ` +${updatedFiles.length - 2} more` : ""}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    if (newFiles.length === 0) {
      setTitle("");
    } else if (newFiles.length === 1) {
      setTitle(newFiles[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Research mode doesn't need title or any input - auto-create
    if (mode === "research") {
      setIsLoading(true);
      try {
        await onUpload({
          title: "New Research Session",
          type: mode,
        });
        setTitle("");
        setContent("");
        setFiles([]);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create research session");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For file and text modes, validate title
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (mode === "file" && files.length === 0) {
      setError("Please select at least one file");
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
        files: mode === "file" ? files : undefined,
        type: mode,
        smartCleanup: mode === "file" ? smartCleanup : false,
      });
      setTitle("");
      setContent("");
      setFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFiles([]);
    setError("");
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetForm}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--surface)] rounded-2xl shadow-2xl fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold">Create New Material</h2>
          <button
            onClick={resetForm}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter material title"
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
            />
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 p-1 bg-[var(--background)] rounded-xl">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "file"
                  ? "bg-[var(--surface)] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Upload size={16} />
              Document
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "text"
                  ? "bg-[var(--surface)] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <FileText size={16} />
              Text
            </button>
            <button
              type="button"
              onClick={() => setMode("research")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "research"
                  ? "bg-[var(--surface)] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Lightbulb size={16} />
              Research
            </button>
          </div>

          {/* File upload */}
          {mode === "file" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.docx,.doc,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
              >
                <Upload size={28} className="mx-auto text-[var(--foreground-muted)] mb-2" />
                <p className="font-medium">Click to upload files</p>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                  PDF, Word (.docx), or TXT • You can select multiple files
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Total: {formatFileSize(totalSize)}
                    </p>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 p-2.5 bg-[var(--background)] rounded-lg border border-[var(--border)]"
                      >
                        <FileText size={18} className="text-[var(--primary)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-[var(--foreground-muted)] hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {files.length > 1 && (
                    <div className="flex items-start gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        All files will be combined into a single material. The AI will have context from all documents.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Smart Cleanup Toggle */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">AI Smart Cleanup</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Remove table of contents, empty pages, etc.
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

              {smartCleanup && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    AI will clean up: Table of Contents, List of Figures, Cover, Empty Pages, 
                    Repeated Headers/Footers, and other unnecessary parts.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text input */}
          {mode === "text" && (
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste learning material here..."
                rows={8}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Research mode */}
          {mode === "research" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                <Lightbulb size={20} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Free Research Mode
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Start chatting with AI about any topic. The AI will automatically generate a title based on your first message.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30">
                <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium mb-2">
                  ✨ Ready to start learning!
                </p>
                <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                  <li>• Ask questions about any topic</li>
                  <li>• Explore concepts with AI guidance</li>
                  <li>• Export learning summary anytime</li>
                </ul>
              </div>
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
                  {mode === "file" && smartCleanup ? "AI Processing..." : 
                   mode === "research" ? "Creating..." : "Uploading..."}
                </>
              ) : (
                <>
                  {mode === "research" ? (
                    <>
                      <MessageSquare size={18} />
                      Start Research
                    </>
                  ) : (
                    `Add Material${files.length > 1 ? ` (${files.length} files)` : ""}`
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
