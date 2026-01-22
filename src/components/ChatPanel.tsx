"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Settings, Edit, ChevronDown, FileText, HelpCircle, Book, Sparkles, Square, User, Bot, UserIcon, Layers } from "lucide-react";
import { Message } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { FormattedAIContent } from "@/lib/format-ai-response";
import { SelectionMenu } from "@/components/SelectionMenu";
import { MessageContextMenu } from "@/components/MessageContextMenu";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onRegenerateFromMessage?: (messageIndex: number, userMessage: string) => Promise<void>;
  isLoading: boolean;
  onStopGeneration?: () => void;
  onEditMaterial?: () => void;
  onOpenSettings: () => void;
  onGenerateSummary: () => Promise<void>;
  onGenerateQuiz: () => Promise<void>;
  onGenerateGlossary?: () => Promise<void>;
  onGenerateFlashcards?: () => Promise<void>;
  onAddTermToGlossary?: (term: string) => void;
  isSummaryLoading: boolean;
  isQuizLoading: boolean;
  isGlossaryLoading?: boolean;
  isFlashcardsLoading?: boolean;
  hasSummary: boolean;
  hasQuiz: boolean;
  hasGlossary?: boolean;
  hasFlashcards?: boolean;
  language?: string;
  onLanguageChange?: (lang: string) => void;
}

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  onClearHistory,
  onDeleteMessage,
  onRegenerateFromMessage,
  isLoading,
  onStopGeneration,
  onEditMaterial,
  onOpenSettings,
  onGenerateSummary,
  onGenerateQuiz,
  onGenerateGlossary,
  onGenerateFlashcards,
  onAddTermToGlossary,
  isSummaryLoading,
  isQuizLoading,
  isGlossaryLoading,
  isFlashcardsLoading,
  hasSummary,
  hasQuiz,
  hasGlossary,
  hasFlashcards,
  language = "id",
  onLanguageChange
}: ChatPanelProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    messageId: string;
    messageContent: string;
    messageRole: "user" | "assistant";
    messageIndex: number;
    position: { x: number; y: number };
  } | null>(null);

  // Long press handling for mobile
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  // Calculate memory usage
  // Use custom API settings if configured, otherwise use default settings
  const isUsingCustomAPI = user?.customApiUrl && user?.hasCustomApiKey;
  const MAX_CONTEXT = isUsingCustomAPI 
    ? (user?.customMaxContext || 8000) 
    : (user?.maxContext || 1000000); // 1M for HaluAI Gateway
    
  const memoryUsage = {
    used: messages.reduce((sum, msg) => sum + msg.content.length, 0),
    max: MAX_CONTEXT,
    percentage: Math.round((messages.reduce((sum, msg) => sum + msg.content.length, 0) / MAX_CONTEXT) * 100),
    status: (() => {
      const pct = (messages.reduce((sum, msg) => sum + msg.content.length, 0) / MAX_CONTEXT) * 100;
      if (pct > 80) return 'critical';
      if (pct > 50) return 'warning';
      return 'ok';
    })()
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Handle text selection - Ask AI to explain
  const handleAskAI = (text: string) => {
    const prompt = `Please explain the following term or concept from the material: "${text}"`;
    setInput(prompt);
    inputRef.current?.focus();
  };

  // Handle text selection - Add to glossary
  const handleAddToGlossary = (text: string) => {
    if (onAddTermToGlossary) {
      onAddTermToGlossary(text);
    } else {
      // Fallback: ask AI to define the term
      const prompt = `Please provide a brief definition for the term: "${text}"`;
      setInput(prompt);
      inputRef.current?.focus();
    }
  };
  
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
    
    // Keep focus on input after sending
    inputRef.current?.focus();
    
    await onSendMessage(message);
    
    // Refocus after message is sent (in case focus was lost during async operation)
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle message context menu
  const handleMessageClick = (
    e: React.MouseEvent,
    message: Message,
    index: number
  ) => {
    // Prevent context menu if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

    // Open context menu
    if (message.id) {
      e.preventDefault();
      setContextMenu({
        messageId: message.id,
        messageContent: message.content,
        messageRole: message.role as "user" | "assistant",
        messageIndex: index,
        position: { x: e.clientX, y: e.clientY },
      });
    }
  };

  // Mobile long press handlers
  const handleTouchStart = (message: Message, index: number) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      if (message.id) {
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        setContextMenu({
          messageId: message.id,
          messageContent: message.content,
          messageRole: message.role as "user" | "assistant",
          messageIndex: index,
          position: { x: window.innerWidth / 2 - 90, y: window.innerHeight / 2 - 80 },
        });
      }
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteFromMenu = async (messageId: string) => {
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    }
    setContextMenu(null);
  };

  const handleRegenerateFromMenu = async (messageId: string, messageIndex: number) => {
    if (onRegenerateFromMessage) {
      // Find the user message that triggered this
      // If this is an assistant message, get the previous user message
      // If this is a user message, use this message
      const targetMessage = messages[messageIndex];
      let userMessage: string;
      
      if (targetMessage.role === "user") {
        userMessage = targetMessage.content;
      } else {
        // Find the previous user message
        const prevUserIndex = messageIndex - 1;
        if (prevUserIndex >= 0 && messages[prevUserIndex].role === "user") {
          userMessage = messages[prevUserIndex].content;
        } else {
          // Fallback - shouldn't happen normally
          console.error("Could not find user message for regeneration");
          return;
        }
      }
      
      await onRegenerateFromMessage(messageIndex, userMessage);
    }
    setContextMenu(null);
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

      {/* Memory Indicator */}
      {messages.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--foreground-muted)] font-medium">AI Memory</span>
                <span className="text-[var(--foreground-muted)]">
                  {formatNumber(memoryUsage.used)} / {formatNumber(memoryUsage.max)} chars
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    memoryUsage.status === 'critical' ? 'bg-red-500' :
                    memoryUsage.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(memoryUsage.percentage, 100)}%` }}
                />
              </div>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded ${
              memoryUsage.status === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
              memoryUsage.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            }`}>
              {memoryUsage.percentage}%
            </div>
          </div>
          {memoryUsage.status === 'critical' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
              ⚠️ Memory almost full. Consider clearing chat history or exporting this session.
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative"
      >
        {/* Selection Menu */}
        <SelectionMenu
          containerRef={messagesContainerRef}
          onAddToGlossary={handleAddToGlossary}
          onAskAI={handleAskAI}
        />
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-teal-100 dark:from-indigo-900/30 dark:to-teal-900/30 flex items-center justify-center mb-4">
              <Send size={20} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-[var(--foreground-muted)] text-sm max-w-sm">
              Ask questions about your learning material.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Check if this is the loading state (streaming with "...")
            const isLoadingDots = message.id?.startsWith("streaming-") && message.content === "...";
            
            // If it's the loading dots, render without bubble
            if (isLoadingDots) {
              return (
                <div
                  key={message.id || index}
                  className="flex justify-start fade-in"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Render based on chat theme
            const chatTheme = settings.chatTheme || "modern";

            if (chatTheme === "classic") {
              // Classic theme - flat style with left border
              return (
                <div
                  key={message.id || index}
                  className="fade-in mb-3"
                  onClick={(e) => handleMessageClick(e, message, index)}
                  onContextMenu={(e) => handleMessageClick(e, message, index)}
                  onTouchStart={() => handleTouchStart(message, index)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  <div
                    className={`border-l-3 pl-3 py-2 cursor-pointer select-text ${
                      message.role === "user"
                        ? "border-l-[var(--primary)]"
                        : "border-l-emerald-500"
                    }`}
                    style={{ borderLeftWidth: '3px' }}
                  >
                    <div className={`text-md font-bold mb-1 ${
                      message.role === "user"
                        ? "text-[var(--primary)]"
                        : "text-emerald-500"
                    }`}>
                      {message.role === "user" ? <span className="flex gap-2 items-center"><UserIcon /> You</span> : <span className="flex gap-2 items-center"><Bot /> LearnLens AI</span>}
                    </div>
                    <div className={`markdown-content text-sm ${
                      message.id?.startsWith("streaming-") && isLoading ? "streaming-cursor" : ""
                    }`}>
                      {message.role === "assistant" ? (
                        message.id?.startsWith("streaming-") && message.content ? (
                          <span>{message.content}</span>
                        ) : (
                          <FormattedAIContent content={message.content} />
                        )
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (chatTheme === "minimal") {
              // Minimal theme - clean inline with labels
              return (
                <div
                  key={message.id || index}
                  className="fade-in mb-2"
                  onClick={(e) => handleMessageClick(e, message, index)}
                  onContextMenu={(e) => handleMessageClick(e, message, index)}
                  onTouchStart={() => handleTouchStart(message, index)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  <div className="flex items-start gap-2 cursor-pointer select-text py-1">
                    <div className={`flex items-center gap-1 shrink-0 mt-0.5 ${
                      message.role === "user"
                        ? "text-[var(--primary)]"
                        : "text-emerald-500"
                    }`}>
                      {message.role === "user" ? (
                        <User size={14} />
                      ) : (
                        <Bot size={14} />
                      )}
                    </div>
                    <div className={`flex-1 text-sm ${
                      message.id?.startsWith("streaming-") && isLoading ? "streaming-cursor" : ""
                    }`}>
                      {message.role === "assistant" ? (
                        <div className="markdown-content">
                          {message.id?.startsWith("streaming-") && message.content ? (
                            <span>{message.content}</span>
                          ) : (
                            <FormattedAIContent content={message.content} />
                          )}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Modern theme (default) - premium bubble style with avatars
            return (
              <div
                key={message.id || index}
                className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"} fade-in mb-1`}
              >
                {/* AI Avatar - shown on left for assistant */}
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles size={14} className="text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] sm:max-w-[70%] px-4 py-3 cursor-pointer select-text transition-all ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-indigo-500/20"
                      : "bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-md shadow-sm hover:shadow-md"
                  }`}
                  onClick={(e) => handleMessageClick(e, message, index)}
                  onContextMenu={(e) => handleMessageClick(e, message, index)}
                  onTouchStart={() => handleTouchStart(message, index)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  <div className={`markdown-content text-sm ${
                    message.role === "user" ? "" : "text-[var(--foreground)]"
                  } ${
                    message.id?.startsWith("streaming-") && isLoading ? "streaming-cursor" : ""
                  }`}>
                    {message.role === "assistant" ? (
                      message.id?.startsWith("streaming-") && message.content ? (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      ) : (
                        <FormattedAIContent content={message.content} />
                      )
                    ) : (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    )}
                  </div>
                </div>

                {/* User Avatar - shown on right for user */}
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                    <User size={14} className="text-white" />
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Show typing indicator only if loading AND no streaming message exists */}
        {isLoading && !messages.some(m => m.id?.startsWith("streaming-")) && (
          <div className="flex justify-start fade-in">
            <div className="bg-[var(--assistant-bubble)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          messageId={contextMenu.messageId}
          messageContent={contextMenu.messageContent}
          messageRole={contextMenu.messageRole}
          messageIndex={contextMenu.messageIndex}
          totalMessages={messages.length}
          onDelete={onDeleteMessage ? handleDeleteFromMenu : undefined}
          onRegenerate={onRegenerateFromMessage ? handleRegenerateFromMenu : undefined}
          onClose={() => setContextMenu(null)}
          position={contextMenu.position}
        />
      )}

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
            disabled={isSummaryLoading || isQuizLoading || isGlossaryLoading || isFlashcardsLoading}
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

        {onGenerateFlashcards && (
          <button
            onClick={onGenerateFlashcards}
            disabled={isSummaryLoading || isQuizLoading || isGlossaryLoading || isFlashcardsLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              hasFlashcards 
                ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400"
                : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            } disabled:opacity-50`}
          >
            {isFlashcardsLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Layers size={14} />
            )}
            <span>{hasFlashcards ? "View Flashcards" : "Generate Flashcards"}</span>
            {hasFlashcards && <Sparkles size={12} className="text-cyan-500" />}
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
            placeholder={isLoading ? "AI is generating..." : `Ask something about your material...`}
            rows={1}
            className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm max-h-[150px]"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="p-3 bg-[var(--error)] text-white rounded-xl hover:opacity-90 transition-colors shrink-0 shadow-sm"
              title="Stop generation"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
            >
              <Send size={20} />
            </button>
          )}
        </div>
        <p className="hidden sm:block text-xs text-[var(--foreground-muted)] text-center mt-2 opacity-70">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
