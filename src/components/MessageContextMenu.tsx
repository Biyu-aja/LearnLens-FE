"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Copy, X } from "lucide-react";

interface MessageContextMenuProps {
  messageId: string;
  messageContent: string;
  messageRole: "user" | "assistant";
  onDelete?: (messageId: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export function MessageContextMenu({
  messageId,
  messageContent,
  messageRole,
  onDelete,
  onClose,
  position,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

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
  }, [position]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      onClose();
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(messageId);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        minWidth: "160px",
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

        {onDelete && (
          <button
            onClick={handleDelete}
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
