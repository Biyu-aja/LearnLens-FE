"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  ArrowLeft, 
  Trash2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { SummaryPanel } from "@/components/SummaryPanel";
import { QuizPanel } from "@/components/QuizPanel";
import { MaterialUpload } from "@/components/MaterialUpload";
import { EditMaterialModal } from "@/components/EditMaterialModal";
import { SettingsModal } from "@/components/SettingsModal";
import { materialsAPI, chatAPI, aiAPI, Material, MaterialSummary, Message, Quiz } from "@/lib/api";

type Tab = "chat" | "summary" | "quiz";

export default function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [material, setMaterial] = useState<Material | null>(null);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    }
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

  const handleSendMessage = async (message: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticUserMsg: Message = {
      id: tempId,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setIsChatLoading(true);
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const response = await chatAPI.sendMessage(id, message);
      setMessages((prev) => {
        // Remove optimistic message and add real ones
        const filtered = prev.filter((m) => m.id !== tempId);
        return [...filtered, response.userMessage, response.assistantMessage];
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Rollback on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await chatAPI.clearHistory(id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const response = await materialsAPI.generateSummary(id);
      setMaterial((prev) => prev ? { ...prev, summary: response.summary } : null);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleGenerateQuiz = async (count: number) => {
    setIsQuizLoading(true);
    try {
      const response = await aiAPI.generateQuiz(id, count);
      setQuizzes(response.quizzes);
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

  const handleUpload = async (data: { title: string; content?: string; file?: File }) => {
    const response = await materialsAPI.create(data);
    await fetchMaterials();
    router.push(`/material/${response.material.id}`);
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

  const tabs = [
    { id: "chat" as Tab, label: "Chat", icon: MessageSquare },
    { id: "summary" as Tab, label: "Summary", icon: FileText },
    { id: "quiz" as Tab, label: "Quiz", icon: HelpCircle },
  ];

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
              onClick={handleDeleteMaterial}
              className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
              title="Delete material"
            >
              <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* Tabs */}
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
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearChat}
              isLoading={isChatLoading}
              onEditMaterial={() => setShowEdit(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}
          {activeTab === "summary" && (
            <SummaryPanel
              summary={material.summary || null}
              onGenerateSummary={handleGenerateSummary}
              isLoading={isSummaryLoading}
            />
          )}
          {activeTab === "quiz" && (
            <QuizPanel
              quizzes={quizzes}
              onGenerateQuiz={handleGenerateQuiz}
              isLoading={isQuizLoading}
            />
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

      {/* Settings modal - Rendered at root level */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
