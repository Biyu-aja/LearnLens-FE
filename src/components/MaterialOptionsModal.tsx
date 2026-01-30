"use client";

import { useState, useRef } from "react";
import { X, Pencil, Trash2, Upload, FileText, Loader2, Globe, ChevronDown, Check, FileDown } from "lucide-react";
import { materialsAPI } from "@/lib/api";

// Supported AI languages
const AI_LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "id", label: "Indonesian", flag: "🇮🇩" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
  { id: "fr", label: "French", flag: "🇫🇷" },
  { id: "de", label: "German", flag: "🇩🇪" },
  { id: "pt", label: "Portuguese", flag: "🇵🇹" },
  { id: "zh", label: "Chinese", flag: "🇨🇳" },
  { id: "ja", label: "Japanese", flag: "🇯🇵" },
  { id: "ko", label: "Korean", flag: "🇰🇷" },
  { id: "ar", label: "Arabic", flag: "🇸🇦" },
] as const;

export type AILanguage = typeof AI_LANGUAGES[number]["id"];

interface MaterialOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  materialTitle: string;
  onEditContent: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  language?: AILanguage;
  onLanguageChange?: (lang: AILanguage) => void;
  isPublic?: boolean;
  onTogglePublic?: (isPublic: boolean) => void;
}

export function MaterialOptionsModal({
  isOpen,
  onClose,
  materialId,
  materialTitle,
  onEditContent,
  onDelete,
  onRefresh,
  language = "en",
  onLanguageChange,
  isPublic,
  onTogglePublic,
}: MaterialOptionsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
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
      setError("Unsupported file format. Use PDF, DOCX, TXT, or MD.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await materialsAPI.appendFile(materialId, file);
      setSuccess("File added successfully!");
      onRefresh();
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
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

  const handleLanguageSelect = (langId: AILanguage) => {
    if (onLanguageChange) {
      onLanguageChange(langId);
    }
    setShowLanguageDropdown(false);
  };

  const currentLanguage = AI_LANGUAGES.find(l => l.id === language) || AI_LANGUAGES[0];

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
              <h2 className="font-semibold text-[var(--foreground)] text-sm">Material Options</h2>
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
                {isUploading ? "Uploading..." : "Add File"}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                PDF, Word, or Text
              </p>
            </div>
          </button>

          {/* AI Language Selector */}
          {onLanguageChange && (
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-all group"
              >
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors">
                  <Globe size={18} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">AI Response Language</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    For Summary, Quiz, Glossary, Flashcards
                  </p>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--surface-hover)] text-sm">
                  <span>{currentLanguage.flag}</span>
                  <span className="text-xs font-medium">{currentLanguage.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Language Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {AI_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageSelect(lang.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="flex-1 text-left text-sm text-[var(--foreground)]">{lang.label}</span>
                      {language === lang.id && (
                        <Check size={16} className="text-cyan-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Publish / Unpublish Button */}
          {onTogglePublic && isPublic !== undefined && (
             <button
                onClick={() => {
                  onTogglePublic(!isPublic);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group ${
                    isPublic 
                    ? "border-amber-200 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                    : "border-[var(--border)] hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                    isPublic
                    ? "bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50"
                    : "bg-teal-100 dark:bg-teal-900/30 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50"
                }`}>
                  {isPublic ? (
                     <Globe size={18} className="text-amber-600 dark:text-amber-400" />    
                  ) : (
                     <Upload size={18} className="text-teal-600 dark:text-teal-400" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {isPublic ? "Unpublish Material" : "Publish to Community"}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {isPublic ? "Make private again" : "Share with other learners"}
                  </p>
                </div>
              </button>
          )}

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
              <p className="text-sm font-medium text-[var(--foreground)]">Edit Content</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Modify or cleanup with AI
              </p>
            </div>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={async () => {
              try {
                await materialsAPI.downloadReport(materialId, materialTitle);
              } catch (err: any) {
                 setError("Failed to download report: " + (err.message || "Unknown error"));
              }
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all group"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <FileDown size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--foreground)]">Export Learning Report</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Download PDF summary
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
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Material</p>
              <p className="text-xs text-red-500/70 dark:text-red-400/70">
                This action cannot be undone
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
