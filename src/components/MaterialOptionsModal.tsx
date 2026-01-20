"use client";

import { useState, useRef } from "react";
import { X, Pencil, Trash2, Upload, FileText, Loader2 } from "lucide-react";
import { materialsAPI } from "@/lib/api";

interface MaterialOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  materialTitle: string;
  onEditContent: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export function MaterialOptionsModal({
  isOpen,
  onClose,
  materialId,
  materialTitle,
  onEditContent,
  onDelete,
  onRefresh,
}: MaterialOptionsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan PDF, DOCX, TXT, atau MD.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await materialsAPI.appendFile(materialId, file);
      setSuccess("File berhasil ditambahkan!");
      onRefresh();
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteClick = () => {
    onDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary-light)] flex items-center justify-center">
              <FileText size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)] text-sm">Kelola Material</h2>
              <p className="text-xs text-[var(--foreground-muted)] truncate max-w-[180px]">
                {materialTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X size={18} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Success Message */}
          {success && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Add File Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              {isUploading ? (
                <Loader2 size={18} className="text-blue-600 dark:text-blue-400 animate-spin" />
              ) : (
                <Upload size={18} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {isUploading ? "Mengunggah..." : "Tambah File"}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                PDF, Word, atau Text
              </p>
            </div>
          </button>

          {/* Edit Content Button */}
          <button
            onClick={() => {
              onEditContent();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <Pencil size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--foreground)]">Edit Konten</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Ubah atau cleanup dengan AI
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="border-t border-[var(--border)] my-1" />

          {/* Delete Button */}
          <button
            onClick={handleDeleteClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <Trash2 size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Hapus Material</p>
              <p className="text-xs text-red-500/70 dark:text-red-400/70">
                Tidak bisa dikembalikan
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
