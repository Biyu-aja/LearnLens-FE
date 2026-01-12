"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Settings, Edit, ChevronDown, FileText, HelpCircle, Book, Sparkles } from "lucide-react";
import { Message } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FormattedAIContent } from "@/lib/format-ai-response";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
  isLoading: boolean;
  onEditMaterial?: () => void;
  onOpenSettings: () => void;
  onGenerateSummary: () => Promise<void>;
  onGenerateQuiz: () => Promise<void>;
  onGenerateGlossary?: () => Promise<void>;
  isSummaryLoading: boolean;
  isQuizLoading: boolean;
  isGlossaryLoading?: boolean;
  hasSummary: boolean;
  hasQuiz: boolean;
  hasGlossary?: boolean;
}

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  onClearHistory,
  isLoading,
  onEditMaterial,
  onOpenSettings,
  onGenerateSummary,
  onGenerateQuiz,
  onGenerateGlossary,
  isSummaryLoading,
  isQuizLoading,
  isGlossaryLoading,
  hasSummary,
  hasQuiz,
  hasGlossary
}: ChatPanelProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentModelName = user?.preferredModel 
    ? (user.preferredModel === "claude-4.5-sonnet" ? "Claude 4.5 Sonnet" : 
       user.preferredModel.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
    : "Gemini 2.5 Flash Lite";

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--border)] shrink-0 z-20 relative">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold flex items-center gap-2">
            LearnLens
            {/* Model Selector Button - Opens Modal Directly */}
            <button 
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-normal bg-[var(--background)] border border-[var(--border)] rounded-md hover:bg-[var(--surface-hover)] transition-colors text-[var(--foreground-muted)]"
              title="Configure AI Model & Settings"
            >
              <Settings size={12} />
              <span className="capitalize truncate max-w-[140px]">{currentModelName}</span>
              <ChevronDown size={12} />
            </button>
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">Ask questions about your material</p>
        </div>

        <div className="flex items-center gap-2">
           {onEditMaterial && (
            <button
              onClick={onEditMaterial}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              title="Edit Material Content"
            >
              <Edit size={14} />
              <span className="hidden sm:inline">Edit Content</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-2 py-1.5 text-xs text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100"
              title="Clear Chat History"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-teal-100 dark:from-indigo-900/30 dark:to-teal-900/30 flex items-center justify-center mb-4">
              <Send size={20} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-[var(--foreground-muted)] text-sm max-w-sm">
              Ask questions about your learning material using <strong>{currentModelName}</strong>.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-[var(--primary)] text-white rounded-br-md"
                    : "bg-[var(--assistant-bubble)] border border-[var(--border)] rounded-bl-md"
                }`}
              >
                <div className="markdown-content text-sm whitespace-pre-wrap">
                  {message.role === "assistant" ? (
                    <FormattedAIContent content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start fade-in">
            <div className="bg-[var(--assistant-bubble)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 flex-wrap">
        <button
          onClick={onGenerateSummary}
          disabled={isSummaryLoading || isQuizLoading || isGlossaryLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
            hasSummary 
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          } disabled:opacity-50`}
        >
          {isSummaryLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileText size={14} />
          )}
          <span>{hasSummary ? "View Summary" : "Generate Summary"}</span>
          {hasSummary && <Sparkles size={12} className="text-emerald-500" />}
        </button>

        <button
          onClick={onGenerateQuiz}
          disabled={isSummaryLoading || isQuizLoading || isGlossaryLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
            hasQuiz 
              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400"
              : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          } disabled:opacity-50`}
        >
          {isQuizLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <HelpCircle size={14} />
          )}
          <span>{hasQuiz ? "View Quiz" : "Generate Quiz"}</span>
          {hasQuiz && <Sparkles size={12} className="text-purple-500" />}
        </button>

        {onGenerateGlossary && (
          <button
            onClick={onGenerateGlossary}
            disabled={isSummaryLoading || isQuizLoading || isGlossaryLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              hasGlossary 
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            } disabled:opacity-50`}
          >
            {isGlossaryLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Book size={14} />
            )}
            <span>{hasGlossary ? "View Glossary" : "Generate Glossary"}</span>
            {hasGlossary && <Sparkles size={12} className="text-amber-500" />}
          </button>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentModelName}...`}
            rows={1}
            className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm max-h-[150px]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="hidden sm:block text-xs text-[var(--foreground-muted)] text-center mt-2 opacity-70">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
