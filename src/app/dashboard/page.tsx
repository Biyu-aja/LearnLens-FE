"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Plus, Sparkles, FileText, MessageSquare, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { MaterialUpload } from "@/components/MaterialUpload";
import { materialsAPI, MaterialSummary } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch materials
  useEffect(() => {
    if (user) {
      fetchMaterials();
    }
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.list();
      setMaterials(response.materials);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setIsLoading(false);
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
      // Redirect to the new research session
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
      
      await materialsAPI.create({ 
        title: data.title, 
        content: combinedContent,
        type: fileType
      });
    } 
    // Text mode - direct content
    else if (data.content) {
      await materialsAPI.create({
        title: data.title,
        content: data.content,
        type: "text"
      });
    }
    await fetchMaterials();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar 
        materials={materials} 
        onNewMaterial={() => setShowUpload(true)}
      />

      {/* Main content */}
      <main className="lg:pl-72 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pt-16 lg:pt-12">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Welcome back, {user.name?.split(" ")[0] || "Learner"} 👋
            </h1>
            <p className="text-sm sm:text-base text-[var(--foreground-muted)]">
              Choose a material to study or upload something new
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            </div>
          ) : materials.length === 0 ? (
            /* Empty state */
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-teal-100 dark:from-indigo-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <BookOpen size={32} className="sm:w-10 sm:h-10 text-indigo-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">No materials yet</h2>
              <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-md mx-auto mb-6 sm:mb-8 px-4">
                Upload your first learning material to get started with AI-powered tutoring.
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition-colors font-medium text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                Add Your First Material
              </button>
            </div>
          ) : (
            /* Materials grid */
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">Your Materials</h2>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-xs sm:text-sm font-medium"
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                  Add New
                </button>
              </div>

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => router.push(`/material/${material.id}`)}
                    className="group text-left p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FileText size={18} className="sm:w-5 sm:h-5 text-[var(--primary)]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-[var(--primary)] transition-colors">
                          {material.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                          {new Date(material.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {material.summary && (
                      <p className="text-xs sm:text-sm text-[var(--foreground-muted)] line-clamp-2 mb-2 sm:mb-3">
                        {material.summary.slice(0, 100)}...
                      </p>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={10} className="sm:w-3 sm:h-3" />
                        {material._count.messages} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle size={10} className="sm:w-3 sm:h-3" />
                        {material._count.quizzes} quizzes
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Upload modal */}
      <MaterialUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
