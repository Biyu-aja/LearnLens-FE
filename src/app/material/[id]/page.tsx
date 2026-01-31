"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  ArrowLeft, 
  MoreVertical,
  Book,
  BarChart3,
  Layers,
  BrainCircuit,
  Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { SummaryPanel } from "@/components/SummaryPanel";
import { QuizPanel } from "@/components/QuizPanel";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { FlashcardPanel } from "@/components/FlashcardPanel";
import MindMapPanel from "@/components/MindMapPanel";
import StudyPlanPanel from "@/components/StudyPlanPanel";
import { MaterialUpload } from "@/components/MaterialUpload";
import { EditMaterialModal } from "@/components/EditMaterialModal";
import { SettingsModal } from "@/components/SettingsModal";
import { QuizConfigModal, QuizConfig } from "@/components/QuizConfigModal";
import { SummaryConfigModal, SummaryConfig } from "@/components/SummaryConfigModal";
import { MaterialOptionsModal } from "@/components/MaterialOptionsModal";
import { materialsAPI, chatAPI, aiAPI, analyticsAPI, Material, MaterialSummary, Message, Quiz, GlossaryTerm, Flashcard } from "@/lib/api";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { PublishConfigModal } from "@/components/PublishConfigModal";
import { AILanguage } from "@/components/MaterialOptionsModal";

type Tab = "chat" | "summary" | "quiz" | "glossary" | "flashcards" | "analytics" | "mindmap" | "study-plan";

export default function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  // const { settings } = useSettings();
  const router = useRouter();
  
  const [material, setMaterial] = useState<Material | null>(null);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[] | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [aiLanguage, setAiLanguage] = useState<AILanguage>("en");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [isGlossaryLoading, setIsGlossaryLoading] = useState(false);
  const [isFlashcardsLoading, setIsFlashcardsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [showSummaryConfig, setShowSummaryConfig] = useState(false);
  const [showMaterialOptions, setShowMaterialOptions] = useState(false);
  const [showPublishConfig, setShowPublishConfig] = useState(false);
  const [chatInitialInput, setChatInitialInput] = useState("");

  // AbortController for stopping stream
  const abortControllerRef = useRef<AbortController | null>(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch data
  useEffect(() => {
    if (user && id) {
      fetchMaterial();
      fetchMaterials();
      fetchGlossary();
      fetchFlashcards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const fetchMaterial = async () => {
    try {
      const response = await materialsAPI.get(id);
      setMaterial(response.material);
      setMessages(response.material.messages);
      setQuizzes(response.material.quizzes);
    } catch (error) {
      console.error("Failed to fetch material:", error);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.list();
      setMaterials(response.materials);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  };

  const fetchGlossary = async () => {
    try {
      const response = await aiAPI.getGlossary(id);
      setGlossary(response.glossary.length > 0 ? response.glossary : null);
    } catch (error) {
      console.error("Failed to fetch glossary:", error);
    }
  };

  const fetchFlashcards = async () => {
    try {
      const response = await aiAPI.getFlashcards(id);
      setFlashcards(response.flashcards.length > 0 ? response.flashcards : null);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Create IDs for optimistic messages
    const optimisticUserMsgId = `user-${Date.now()}`;
    const streamingMsgId = `streaming-${Date.now()}`;
    
    // Immediately add user message (optimistic) and assistant placeholder with "..."
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticUserMsgId,
        role: "user" as const,
        content: message,
        createdAt: new Date().toISOString(),
      },
      {
        id: streamingMsgId,
        role: "assistant" as const,
        content: "...",
        createdAt: new Date().toISOString(),
      },
    ]);
    
    setIsChatLoading(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      let streamContent = "";
      // let realUserMessageId: string | null = null;
      
      await chatAPI.sendMessageStream(
        id,
        message,
        // On each chunk
        (chunk: string) => {
          streamContent += chunk;
          setMessages((prev) => 
            prev.map((m) =>
              m.id === streamingMsgId ? { ...m, content: streamContent } : m
            )
          );
        },
        // On user message received from server (replace optimistic with real)
        (userMessage: Message) => {
          // realUserMessageId = userMessage.id;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticUserMsgId ? userMessage : m
            )
          );
        },
        // On complete
        (assistantMessage: Message) => {
          // Replace streaming message with final message
          setMessages((prev) =>
            prev.map((m) => (m.id === streamingMsgId ? assistantMessage : m))
          );
          setIsChatLoading(false);

          // If research mode, update local material content
          if (material?.type === "research") {
            const newContent = `\n\nUser: ${message}\nAssistant: ${assistantMessage.content}`;
            setMaterial((prev) => 
              prev ? { ...prev, content: (prev.content || "") + newContent } : null
            );
          }
        },
        // On error
        (error: string) => {
          console.error("Stream error:", error);
          // Remove optimistic user message and streaming message on error
          setMessages((prev) => prev.filter((m) => 
            m.id !== streamingMsgId && m.id !== optimisticUserMsgId
          ));
          setIsChatLoading(false);
        },
        // Abort signal
        abortControllerRef.current?.signal
        // Note: Chat uses natural language detection - responds in user's language
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic messages on error
      setMessages((prev) => prev.filter((m) => 
        !m.id.startsWith("user-") && !m.id.startsWith("streaming-")
      ));
      setIsChatLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear all messages?")) return;
    
    try {
      await materialsAPI.deleteMessages(id);
      await analyticsAPI.deleteEvaluations(id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await materialsAPI.deleteMessage(id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleRegenerateFromMessage = async (messageIndex: number, userMessage: string) => {
    // Get the message at this index
    const targetMessage = messages[messageIndex];
    
    // Determine where to start deleting and regenerating from
    let deleteFromIndex: number;
    if (targetMessage.role === "user") {
      // If user message, delete from this message onwards
      deleteFromIndex = messageIndex;
    } else {
      // If assistant message, delete from the previous user message onwards
      deleteFromIndex = messageIndex - 1;
      if (deleteFromIndex < 0) deleteFromIndex = 0;
    }
    
    // Get messages to delete (from deleteFromIndex to end)
    const messagesToDelete = messages.slice(deleteFromIndex);
    
    // Delete messages from backend
    try {
      for (const msg of messagesToDelete) {
        if (msg.id) {
          await materialsAPI.deleteMessage(id, msg.id);
        }
      }
      
      // Update local state - remove deleted messages
      const remainingMessages = messages.slice(0, deleteFromIndex);
      
      // Create IDs for optimistic messages
      const optimisticUserMsgId = `user-${Date.now()}`;
      const streamingMsgId = `streaming-${Date.now()}`;
      
      // Immediately add user message (optimistic) and assistant placeholder with "..."
      setMessages([
        ...remainingMessages,
        {
          id: optimisticUserMsgId,
          role: "user" as const,
          content: userMessage,
          createdAt: new Date().toISOString(),
        },
        {
          id: streamingMsgId,
          role: "assistant" as const,
          content: "...",
          createdAt: new Date().toISOString(),
        },
      ]);
      
      setIsChatLoading(true);
      
      let streamContent = "";
      
      await chatAPI.sendMessageStream(
        id,
        userMessage,
        (chunk: string) => {
          streamContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId ? { ...m, content: streamContent } : m
            )
          );
        },
        (newUserMessage: Message) => {
          // Replace optimistic user message with real one
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticUserMsgId ? newUserMessage : m
            )
          );
        },
        (assistantMessage: Message) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamingMsgId ? assistantMessage : m))
          );
          setIsChatLoading(false);
        },
        (error: string) => {
          console.error("Regenerate stream error:", error);
          // Remove optimistic messages on error
          setMessages((prev) => prev.filter((m) => 
            m.id !== streamingMsgId && m.id !== optimisticUserMsgId
          ));
          setIsChatLoading(false);
        }
        // Note: Chat uses natural language detection - responds in user's language
      );
    } catch (error) {
      console.error("Failed to regenerate:", error);
      setIsChatLoading(false);
    }
  };

  const handleRewindChat = async (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return;

    // Messages to delete (from this message onwards)
    const messagesToDelete = messages.slice(index);
    
    // Update local state immediately (optimistic)
    setMessages((prev) => prev.slice(0, index));
    
    // Delete from backend
    try {
      for (const msg of messagesToDelete) {
        if (msg.id && !msg.id.startsWith("user-") && !msg.id.startsWith("streaming-")) {
          await materialsAPI.deleteMessage(id, msg.id);
        }
      }
    } catch (error) {
      console.error("Failed to rewind chat:", error);
    }
  };

  const handleGenerateSummary = async () => {
    // If already has summary, just switch to tab
    if (material?.summary) {
      setActiveTab("summary");
      return;
    }
    // Show config modal for new summary
    setShowSummaryConfig(true);
  };

  const handleSummaryConfigGenerate = async (config: SummaryConfig) => {
    setIsSummaryLoading(true);
    try {
      const response = await materialsAPI.generateSummary(id, {
        model: config.model,
        customText: config.customText,
        language: aiLanguage,
      });
      setMaterial((prev) => prev ? { ...prev, summary: response.summary } : null);
      setActiveTab("summary");
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    // If already has quiz, just switch to tab
    if (quizzes.length > 0) {
      setActiveTab("quiz");
      return;
    }
    // Show config modal for new quiz
    setShowQuizConfig(true);
  };

  const handleQuizConfigGenerate = async (config: QuizConfig) => {
    setIsQuizLoading(true);
    try {
      const response = await aiAPI.generateQuiz(id, {
        count: config.questionCount,
        difficulty: config.difficulty,
        model: config.model,
        materialIds: config.materialIds,
        customText: config.customText,
        language: aiLanguage,
      });
      setQuizzes(response.quizzes);
      setActiveTab("quiz");
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    
    try {
      await materialsAPI.delete(id);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete material:", error);
    }
  };

  const handleDeleteSummary = async () => {
    if (!confirm("Are you sure you want to delete this summary?")) return;
    
    try {
      await materialsAPI.deleteSummary(id);
      setMaterial((prev) => prev ? { ...prev, summary: undefined } : null);
      setActiveTab("chat");
    } catch (error) {
      console.error("Failed to delete summary:", error);
    }
  };

  const handleDeleteQuizzes = async () => {
    if (!confirm("Are you sure you want to delete all quizzes?")) return;
    
    try {
      await materialsAPI.deleteQuizzes(id);
      setQuizzes([]);
      setActiveTab("chat");
    } catch (error) {
      console.error("Failed to delete quizzes:", error);
    }
  };

  const handleUpload = async (data: { 
    title: string; 
    content?: string; 
    files?: File[]; 
    description?: string;
    type: "file" | "text" | "research";
    smartCleanup?: boolean 
  }) => {
    // Research mode - create and redirect to chat
    if (data.type === "research") {
      const response = await materialsAPI.create({
        title: data.title,
        type: "research"
      });
      router.push(`/material/${response.material.id}`);
      return;
    }
    // File mode - parse and combine multiple files
    else if (data.files && data.files.length > 0) {
      let combinedContent = "";
      let fileType = "text"; // Default type
      
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        
        // Determine type from first file
        if (i === 0) {
          if (file.type === "application/pdf") fileType = "pdf";
          else if (file.type.includes("word")) fileType = "docx";
          else if (file.type === "text/markdown") fileType = "markdown";
        }
        
        const parsed = await materialsAPI.parse(file, data.smartCleanup || false);
        // Add separator between files if more than one
        if (combinedContent && parsed.content) {
          combinedContent += `\n\n--- ${file.name} ---\n\n`;
        }
        combinedContent += parsed.content;
      }
      
      const response = await materialsAPI.create({ 
        title: data.title, 
        content: combinedContent,
        type: fileType
      });
      router.push(`/material/${response.material.id}`);
    } 
    // Text mode - direct content
    else if (data.content) {
      const response = await materialsAPI.create({
        title: data.title,
        content: data.content,
        type: "text"
      });
      router.push(`/material/${response.material.id}`);
    }
    
    await fetchMaterials();
  };

  const handleGenerateGlossary = async (config?: { model?: string }) => {
    setIsGlossaryLoading(true);
    try {
      const response = await aiAPI.generateGlossary(id, config?.model || "gemini-3-flash", aiLanguage);
      setGlossary(response.glossary);
      setActiveTab("glossary");
    } catch (error) {
      console.error("Failed to generate glossary:", error);
    } finally {
      setIsGlossaryLoading(false);
    }
  };

  const handleDeleteGlossary = async () => {
    if (!confirm("Are you sure you want to delete this glossary?")) return;
    
    try {
      await aiAPI.deleteGlossary(id);
      setGlossary(null);
      setActiveTab("chat");
    } catch (error) {
      console.error("Failed to delete glossary:", error);
    }
  };

  const handleAddTermToGlossary = async (term: string) => {
    try {
      const response = await aiAPI.addTermToGlossary(id, term);
      setGlossary(response.glossary);
      // Show a brief notification or switch to glossary tab
      if (response.glossary.length === 1) {
        // If this is the first term, switch to glossary tab
        setActiveTab("glossary");
      }
      alert(`"${term}" has been added to your glossary!`);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Failed to add term to glossary:", error);
      if (error.message?.includes("already exists")) {
        alert("This term already exists in the glossary.");
      } else {
        alert("Failed to add term. Please try again.");
      }
    }
  };

  const handleGenerateFlashcards = async (config?: { model?: string }) => {
    setIsFlashcardsLoading(true);
    try {
      const response = await aiAPI.generateFlashcards(id, 10, aiLanguage, config?.model || "gemini-3-flash");
      setFlashcards(response.flashcards);
      setActiveTab("flashcards");
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
    } finally {
      setIsFlashcardsLoading(false);
    }
  };

  const handleDeleteFlashcards = async () => {
    if (!confirm("Are you sure you want to delete these flashcards?")) return;
    
    try {
      await aiAPI.deleteFlashcards(id);
      setFlashcards(null);
      setActiveTab("chat");
    } catch (error) {
      console.error("Failed to delete flashcards:", error);
    }
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Material not found</p>
      </div>
    );
  }

  // Dynamic tabs - only show Summary/Quiz/Glossary if content exists
  const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];
  
  if (material.summary) {
    tabs.push({ id: "summary", label: "Summary", icon: FileText });
  }
  
  if (quizzes.length > 0) {
    tabs.push({ id: "quiz", label: "Quiz", icon: HelpCircle });
  }

  if (glossary && glossary.length > 0) {
    tabs.push({ id: "glossary", label: "Glossary", icon: Book });
  }

  if (flashcards && flashcards.length > 0) {
    tabs.push({ id: "flashcards", label: "Flashcards", icon: Layers });
  }

  // Always show Analytics tab
  // Always show Mind Map and Analytics tabs
  tabs.push({ id: "mindmap", label: "Mind Map", icon: BrainCircuit });
  tabs.push({ id: "study-plan", label: "Study Plan", icon: Calendar });
  tabs.push({ id: "analytics", label: "Analytics", icon: BarChart3 });

  const handleTogglePublic = async (shouldBePublic: boolean) => {
    try {
      if (shouldBePublic) {
        setShowPublishConfig(true);
        setShowMaterialOptions(false);
      } else {
        await materialsAPI.unpublish(id);
        alert("Material is now private.");
        fetchMaterial();
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Failed to toggle publish status:", error);
      alert(error.message || "Failed to update status");
    }
  };

  const handlePublishConfirm = async (data: { title: string; description: string; content: string }) => {
      await materialsAPI.publish(id, data);
      alert("Material published successfully! It is now visible in the Explore section.");
      fetchMaterial();
      fetchMaterial();
  };

  const handleVerifyTask = (task: string) => {
    setActiveTab("chat");
    setChatInitialInput(`I want to verify my understanding of this task from my study plan:\n\n${task}\n\nPlease give me a quick question or test to check if I have completed this correctly.`);
  };

  const handleLearnTask = (task: string) => {
    setActiveTab("chat");
    setChatInitialInput(`Help me learn this topic from my study plan:\n\n${task}\n\nPlease provide a clear explanation and some examples.`);
  };

  const handleQuizTask = async (task: string) => {
    // Generate quiz directly in Quiz Panel with custom instruction
    setIsQuizLoading(true);
    setActiveTab("quiz");
    try {
      const response = await aiAPI.generateQuiz(id, {
        count: 3,
        difficulty: "medium",
        customText: `Focus only on this specific study task: "${task}". Generate questions to verify understanding of this exact topic.`,
        language: aiLanguage,
      });
      setQuizzes(response.quizzes);
    } catch (error) {
      console.error("Failed to generate quiz for task:", error);
    } finally {
      setIsQuizLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar 
        materials={materials} 
        onNewMaterial={() => setShowUpload(true)} 
      />

      {/* Main content */}
      <main className="lg:pl-72 h-screen max-h-[100dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-1.5 sm:p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors lg:hidden shrink-0"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                  <FileText size={16} className="sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-sm sm:text-base truncate">{material.title}</h1>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                    {material.type.toUpperCase()} • {new Date(material.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowMaterialOptions(true)}
              className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors shrink-0"
              title="Material options"
            >
              <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* Tabs - Only show if more than just Chat */}
          {tabs.length > 1 && (
            <div className="px-2 sm:px-6 flex gap-0.5 sm:gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <tab.icon size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  {tab.id === "chat" && messages.length > 0 && (
                    <span className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full">
                      {messages.length}
                    </span>
                  )}
                  {tab.id === "quiz" && quizzes.length > 0 && (
                    <span className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-full">
                      {quizzes.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "chat" && (
            <ChatPanel
              messages={messages}
              materialContentLength={material.content?.length || 0}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearChat}
              onDeleteMessage={handleDeleteMessage}
              onRegenerateFromMessage={handleRegenerateFromMessage}
              onRewind={handleRewindChat}
              isLoading={isChatLoading}
              onStopGeneration={handleStopGeneration}
              onEditMaterial={() => setShowEdit(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onGenerateSummary={handleGenerateSummary}
              onGenerateQuiz={handleGenerateQuiz}
              onGenerateGlossary={handleGenerateGlossary}
              onGenerateFlashcards={handleGenerateFlashcards}
              onAddTermToGlossary={handleAddTermToGlossary}
              isSummaryLoading={isSummaryLoading}
              isQuizLoading={isQuizLoading}
              isGlossaryLoading={isGlossaryLoading}
              isFlashcardsLoading={isFlashcardsLoading}
              hasSummary={!!material.summary}
              hasQuiz={quizzes.length > 0}
              hasGlossary={!!glossary && glossary.length > 0}
              hasFlashcards={!!flashcards && flashcards.length > 0}
              language={aiLanguage}
              onLanguageChange={(lang) => setAiLanguage(lang as AILanguage)}
              initialInput={chatInitialInput}
            />
          )}
          {activeTab === "summary" && (
            <SummaryPanel
              summary={material.summary || null}
              onGenerateSummary={handleGenerateSummary}
              onShowConfig={() => setShowSummaryConfig(true)}
              onDeleteSummary={handleDeleteSummary}
              isLoading={isSummaryLoading}
            />
          )}
          {activeTab === "quiz" && (
            <QuizPanel
              quizzes={quizzes}
              materialId={id}
              onGenerateQuiz={() => handleGenerateQuiz()}
              onDeleteQuizzes={handleDeleteQuizzes}
              onShowConfig={() => setShowQuizConfig(true)}
              isLoading={isQuizLoading}
            />
          )}
          {activeTab === "glossary" && (
            <GlossaryPanel
              glossary={glossary}
              onGenerateGlossary={handleGenerateGlossary}
              onDeleteGlossary={handleDeleteGlossary}
              isLoading={isGlossaryLoading}
            />
          )}
          {activeTab === "flashcards" && (
            <FlashcardPanel
              flashcards={flashcards}
              onGenerateFlashcards={handleGenerateFlashcards}
              onDeleteFlashcards={handleDeleteFlashcards}
              isLoading={isFlashcardsLoading}
              materialId={id}
            />
          )}
          {activeTab === "mindmap" && (
            <div className="w-full h-full min-h-[600px]">
              <MindMapPanel 
                materialId={id} 
                language={aiLanguage}
                onChatAbout={(topic) => {
                  setActiveTab("chat");
                  handleSendMessage(`Tell me more about "${topic}"`);
                }}
              />
            </div>
          )}
          {activeTab === "study-plan" && (
            <StudyPlanPanel
              materialId={id}
              language={aiLanguage}
              onVerify={handleVerifyTask}
              onLearn={handleLearnTask}
              onQuiz={handleQuizTask}
            />
          )}
          {activeTab === "analytics" && (
            <AnalyticsPanel materialId={id} language={aiLanguage} />
          )}
        </div>
      </main>

      {/* Upload modal */}
      <MaterialUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      {/* Edit modal */}
      {material && (
        <EditMaterialModal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          materialId={material.id}
          initialTitle={material.title}
          initialContent={material.content}
          onUpdate={fetchMaterial}
        />
      )}

      {/* Publish Config Modal */}
      {material && (
        <PublishConfigModal
          isOpen={showPublishConfig}
          onClose={() => setShowPublishConfig(false)}
          onPublish={handlePublishConfirm}
          initialTitle={material.title}
          initialContent={material.content || ""}
          materialId={material.id}
        />
      )}

      {/* Settings modal - Rendered at root level */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Quiz Config Modal */}
      {material && (
        <QuizConfigModal
          isOpen={showQuizConfig}
          onClose={() => setShowQuizConfig(false)}
          onGenerate={handleQuizConfigGenerate}
          currentMaterialId={material.id}
          currentMaterialTitle={material.title}
        />
      )}

      {/* Summary Config Modal */}
      {material && (
        <SummaryConfigModal
          isOpen={showSummaryConfig}
          onClose={() => setShowSummaryConfig(false)}
          onGenerate={handleSummaryConfigGenerate}
          currentMaterialTitle={material.title}
        />
      )}

      {/* Material Options Modal */}
      {material && (
        <MaterialOptionsModal
          isOpen={showMaterialOptions}
          onClose={() => setShowMaterialOptions(false)}
          materialId={material.id}
          materialTitle={material.title}
          onEditContent={() => setShowEdit(true)}
          onDelete={handleDeleteMaterial}
          onRefresh={fetchMaterial}
          language={aiLanguage}
          onLanguageChange={setAiLanguage}
          isPublic={material.isPublic}
          onTogglePublic={handleTogglePublic}
        />
      )}
    </div>
  );
}
