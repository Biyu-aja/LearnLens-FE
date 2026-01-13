"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Book, MessageSquare, X } from "lucide-react";

interface SelectionMenuProps {
  onAddToGlossary: (text: string) => void;
  onAskAI: (text: string) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function SelectionMenu({
  onAddToGlossary,
  onAskAI,
  containerRef,
}: SelectionMenuProps) {
  const [selectedText, setSelectedText] = useState<string>("");
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hideMenu = useCallback(() => {
    setIsVisible(false);
    setSelectedText("");
    setMenuPosition(null);
  }, []);

  const handleMouseUp = useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length === 0 || text.length > 500) {
        hideMenu();
        return;
      }

      // Check if selection is within the container
      const container = containerRef.current;
      if (!container || !selection?.rangeCount) {
        hideMenu();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        hideMenu();
        return;
      }

      // Get position using viewport coordinates (fixed positioning)
      const rect = range.getBoundingClientRect();
      
      // Calculate center position above the selection
      let x = rect.left + rect.width / 2;
      let y = rect.top - 10;

      // Adjust if too close to edges
      const menuWidth = 220;
      const menuHeight = 130;
      
      if (x - menuWidth / 2 < 10) x = menuWidth / 2 + 10;
      if (x + menuWidth / 2 > window.innerWidth - 10) x = window.innerWidth - menuWidth / 2 - 10;
      
      // If not enough space above, show below
      if (y - menuHeight < 10) {
        y = rect.bottom + 10;
      }

      setSelectedText(text);
      setMenuPosition({ x, y });
      setIsVisible(true);
    }, 50);
  }, [containerRef, hideMenu]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Small delay to allow button clicks to register
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection?.toString().trim()) {
            hideMenu();
          }
        }, 100);
      }
    };

    const handleScroll = () => {
      hideMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideMenu();
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hideMenu]);

  // Listen for mouseup on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, handleMouseUp]);

  const handleAction = (action: "explain" | "glossary") => {
    if (action === "explain") {
      onAskAI(selectedText);
    } else {
      onAddToGlossary(selectedText);
    }
    hideMenu();
    window.getSelection()?.removeAllRanges();
  };

  if (!isVisible || !menuPosition) return null;

  const showAbove = menuPosition.y > 100;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999]"
      style={{
        left: menuPosition.x,
        top: showAbove ? menuPosition.y : undefined,
        bottom: showAbove ? undefined : `calc(100vh - ${menuPosition.y}px)`,
        transform: showAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      <div 
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* Selected text preview */}
        <div className="px-3 py-2 bg-[var(--background-secondary)] border-b border-[var(--border)] flex items-center gap-2">
          <p className="text-xs text-[var(--foreground-muted)] flex-1 truncate max-w-[160px]">
            "{selectedText.slice(0, 40)}{selectedText.length > 40 ? "..." : ""}"
          </p>
          <button
            onClick={() => {
              hideMenu();
              window.getSelection()?.removeAllRanges();
            }}
            className="p-1 hover:bg-[var(--surface-hover)] rounded transition-colors flex-shrink-0"
          >
            <X size={12} className="text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-1.5">
          <button
            onClick={() => handleAction("explain")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)] text-sm">Explain This</p>
              <p className="text-[10px] text-[var(--foreground-muted)]">Ask LearnLens</p>
            </div>
          </button>

          <button
            onClick={() => handleAction("glossary")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Book size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)] text-sm">Add to Glossary</p>
              <p className="text-[10px] text-[var(--foreground-muted)]">Save term</p>
            </div>
          </button>
        </div>
      </div>

      {/* Arrow */}
      {showAbove && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 -bottom-2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid var(--surface)",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))",
          }}
        />
      )}
    </div>
  );
}
