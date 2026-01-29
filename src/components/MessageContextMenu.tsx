"use client";

import { useRef, useEffect, useState } from "react";
import { Trash2, Copy, X, RefreshCw, AlertTriangle, Check, Edit } from "lucide-react";

interface MessageContextMenuProps {
  messageId: string;
  messageContent: string;
  messageRole: "user" | "assistant";
  messageIndex: number;
  totalMessages: number;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string, messageIndex: number) => void;
  onEdit?: (messageId: string, content: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

type ConfirmAction = "delete" | "regenerate" | null;

export function MessageContextMenu({
  messageId,
  messageContent,
  messageRole,
  messageIndex,
  totalMessages,
  onDelete,
  onRegenerate,
  onEdit,
  onClose,
  position,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmAction) {
          setConfirmAction(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, confirmAction]);

  // Adjust position to stay in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${position.x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${position.y - rect.height}px`;
      }
    }
  }, [position, confirmAction]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      onClose();
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDeleteClick = () => {
    setConfirmAction("delete");
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(messageId);
    }
    onClose();
  };

  const handleRegenerateClick = () => {
    setConfirmAction("regenerate");
  };

  const handleRegenerateConfirm = () => {
    if (onRegenerate) {
      onRegenerate(messageId, messageIndex);
    }
    onClose();
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(messageId, messageContent);
    }
    onClose();
  };

  const handleCancel = () => {
    setConfirmAction(null);
  };

  // Check if this message can be regenerated
  const canRegenerate = onRegenerate !== undefined;
  const isLastMessage = messageIndex === totalMessages - 1;
  const willDeleteLater = !isLastMessage && totalMessages > messageIndex + 1;
  const messagesToDelete = totalMessages - messageIndex - 1;

  // Confirmation view
  if (confirmAction) {
    const isDelete = confirmAction === "delete";
    
    return (
      <div
        ref={menuRef}
        className="fixed z-[100] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: position.x,
          top: position.y,
          minWidth: "220px",
        }}
      >
        {/* Header */}
        <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] ${
          isDelete ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"
        }`}>
          <AlertTriangle size={16} className={isDelete ? "text-red-500" : "text-amber-500"} />
          <span className={`text-sm font-medium ${isDelete ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
            {isDelete ? "Delete Message?" : "Regenerate?"}
          </span>
        </div>

        {/* Confirmation message */}
        <div className="px-3 py-3">
          <p className="text-xs text-[var(--foreground-muted)] mb-3">
            {isDelete ? (
              "This message will be permanently deleted."
            ) : willDeleteLater ? (
              <>This will delete <strong>{messagesToDelete} message{messagesToDelete > 1 ? 's' : ''}</strong> after this and regenerate.</>
            ) : (
              "This will regenerate the AI response."
            )}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={isDelete ? handleDeleteConfirm : handleRegenerateConfirm}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors ${
                isDelete 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              <Check size={14} />
              {isDelete ? "Delete" : "Regenerate"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal menu view
  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        minWidth: "180px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-hover)]">
        <span className="text-xs font-medium text-[var(--foreground-muted)]">
          {messageRole === "user" ? "Your message" : "AI response"}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--border)] transition-colors"
        >
          <X size={12} className="text-[var(--foreground-muted)]" />
        </button>
      </div>

      {/* Actions */}
      <div className="py-1">
        <button
          onClick={handleCopy}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors text-left"
        >
          <Copy size={16} className="text-[var(--foreground-muted)]" />
          <span className="text-sm">Copy</span>
        </button>

        {canRegenerate && (
          <button
            onClick={handleRegenerateClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <RefreshCw size={16} className="text-[var(--foreground-muted)]" />
            <div className="flex flex-col">
              <span className="text-sm">
                {messageRole === "user" ? "Resend" : "Regenerate"}
              </span>
              {willDeleteLater && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  Will delete {messagesToDelete} message{messagesToDelete > 1 ? 's' : ''} after
                </span>
              )}
            </div>
          </button>
        )}

        {onEdit && messageRole === "user" && (
          <button
            onClick={handleEditClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <Edit size={16} className="text-[var(--foreground-muted)]" />
            <span className="text-sm">Edit</span>
          </button>
        )}

        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-400"
          >
            <Trash2 size={16} />
            <span className="text-sm">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
