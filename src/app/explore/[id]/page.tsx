"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Heart, GitFork, FileText, Book, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { exploreAPI, ExploreMaterial, Material, materialsAPI, MaterialSummary } from "@/lib/api";

export default function ExploreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [material, setMaterial] = useState<(ExploreMaterial & Material) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarMaterials, setSidebarMaterials] = useState<MaterialSummary[]>([]);

  useEffect(() => {
    if (user) {
        fetchMaterial();
        fetchSidebarMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const fetchSidebarMaterials = async () => {
      try {
          const res = await materialsAPI.list();
          setSidebarMaterials(res.materials);
      } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // ignore
      }
  };

  const fetchMaterial = async () => {
    try {
      const response = await exploreAPI.get(id);
      setMaterial({ ...response.material, isLiked: response.material.isLiked });
    } catch (error) {
      console.error("Failed to fetch material:", error);
      router.push("/explore");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFork = async () => {
      if (!material) return;
      if (!confirm(`Save copy of "${material.title}"?`)) return;
      try {
          await exploreAPI.fork(material.id);
          alert("Saved to library! You can now chat and take quizzes.");
          router.push("/dashboard");
      } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
          alert("Failed to save.");
      }
  };

  if (isLoading) return (
      <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" /></div>
  );

  if (!material) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar materials={sidebarMaterials} onNewMaterial={() => router.push("/dashboard")} />
      
      <main className="lg:pl-72 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
            <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <ArrowLeft size={20} /> Back to Explore
            </button>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--foreground)]">{material.title}</h1>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm overflow-hidden">
                                {material.user.image ? <img src={material.user.image} alt="" className="w-full h-full object-cover"/> : (material.user.name?.[0] || 'U')}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">{material.user.name || 'Anonymous'}</p>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    Published on {new Date(material.publishedAt || material.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                     <button 
                        onClick={handleFork}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                    >
                        <GitFork size={18} /> 
                        <span>Save to Library</span>
                    </button>
                </div>

                {material.description && (
                    <div className="p-4 bg-[var(--background)] rounded-xl mb-8 text-sm text-[var(--foreground-muted)] border border-[var(--border)]">
                        {material.description}
                    </div>
                )}
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                     <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 text-center">
                        <Heart className="w-6 h-6 mx-auto mb-2 text-teal-600 dark:text-teal-400" />
                        <div className="text-lg font-bold text-teal-700 dark:text-teal-300">{material.likeCount}</div>
                        <div className="text-xs text-teal-600/70 dark:text-teal-400/70">Likes</div>
                     </div>
                     <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 text-center">
                        <GitFork className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{material.forkCount}</div>
                        <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Saves</div>
                     </div>
                     <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-center">
                        <Book className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300 text-sm">Read Only</div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Mode</div>
                     </div>
                </div>
                
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--foreground)]">
                    <FileText size={20} className="text-[var(--primary)]"/>
                    Content Preview
                </h2>
                <div className="prose dark:prose-invert max-w-none p-6 border border-[var(--border)] rounded-xl bg-[var(--background)] min-h-[200px] text-[var(--foreground)] opacity-80 relative overflow-hidden">
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                         {material.content?.slice(0, 1500)}
                    </div>
                    {material.content && material.content.length > 1500 && (
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent flex items-end justify-center pb-8">
                            <span className="bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] shadow-sm">
                                Save to library to read full content
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            {(material.summary) && (
                 <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8">
                    <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)] flex items-center gap-2">
                        <MessageSquare size={20} className="text-orange-500"/>
                        AI Summary
                    </h2>
                    <div className="prose dark:prose-invert max-w-none text-sm text-[var(--foreground)]">
                        <div className="whitespace-pre-wrap">{material.summary}</div>
                    </div>
                 </div>
            )}
        </div>
      </main>
    </div>
  );
}
