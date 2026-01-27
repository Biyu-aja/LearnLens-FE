"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Heart, GitFork, FileText, Book, MessageSquare, ThumbsDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { exploreAPI, ExploreMaterial, Material, materialsAPI, MaterialSummary } from "@/lib/api";
import { CommentsSection } from "@/components/CommentsSection";

export default function ExploreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [material, setMaterial] = useState<(ExploreMaterial & Material) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarMaterials, setSidebarMaterials] = useState<MaterialSummary[]>([]);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

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
                
                <div className="grid grid-cols-4 gap-4 mb-8">
                     <button 
                         onClick={async () => {
                             if(!material) return;
                             try {
                                 const res = await exploreAPI.toggleLike(material.id);
                                 setMaterial(prev => prev ? ({ ...prev, isLiked: res.liked, isDisliked: false, likeCount: res.liked ? prev.likeCount + 1 : prev.likeCount - 1, dislikeCount: prev.isDisliked ? prev.dislikeCount - 1 : prev.dislikeCount }) : null);
                             } catch(e) { console.error("Like failed", e); }
                         }}
                         className={`p-4 rounded-xl border transition-all text-center group ${material.isLiked ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' : 'bg-[var(--surface-hover)] border-transparent hover:border-pink-200'}`}
                     >
                        <Heart className={`w-6 h-6 mx-auto mb-2 ${material.isLiked ? 'text-pink-600 fill-pink-600' : 'text-[var(--foreground-muted)] group-hover:text-pink-500'}`} />
                        <div className={`text-lg font-bold ${material.isLiked ? 'text-pink-700 dark:text-pink-300' : 'text-[var(--foreground)]'}`}>{material.likeCount}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">Likes</div>
                     </button>

                     <button
                        onClick={async () => {
                             if(!material) return;
                             try {
                                 const res = await exploreAPI.toggleDislike(material.id);
                                 setMaterial(prev => prev ? ({ ...prev, isDisliked: res.disliked, isLiked: false, dislikeCount: res.disliked ? prev.dislikeCount + 1 : prev.dislikeCount - 1, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount }) : null);
                             } catch(e) { console.error("Dislike failed", e); }
                        }}
                        className={`p-4 rounded-xl border transition-all text-center group ${material.isDisliked ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700' : 'bg-[var(--surface-hover)] border-transparent hover:border-zinc-300'}`}
                     >
                        <ThumbsDown className={`w-6 h-6 mx-auto mb-2 ${material.isDisliked ? 'text-zinc-700 dark:text-zinc-300 fill-zinc-700 dark:fill-zinc-300' : 'text-[var(--foreground-muted)] group-hover:text-zinc-500'}`} />
                        <div className={`text-lg font-bold ${material.isDisliked ? 'text-zinc-900 dark:text-zinc-100' : 'text-[var(--foreground)]'}`}>{material.dislikeCount}</div>
                        <div className="text-xs text-[var(--foreground-muted)]">Dislikes</div>
                     </button>

                     <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 text-center">
                        <GitFork className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                        <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{material.forkCount}</div>
                        <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Saves</div>
                     </div>
                      <button
                        onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-center hover:bg-blue-100 transition-colors"
                     >
                        <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{material.commentCount || 0}</div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Comments</div>
                     </button>
                </div>
                
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--foreground)]">
                    <FileText size={20} className="text-[var(--primary)]"/>
                    Content Preview
                </h2>
                <div className={`prose dark:prose-invert max-w-none p-6 border border-[var(--border)] rounded-xl bg-[var(--background)] relative overflow-hidden transition-all duration-500 ${isContentExpanded ? 'max-h-full' : 'max-h-[300px]'}`}>
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                         {isContentExpanded ? material.content : material.content?.slice(0, 1000)}
                    </div>
                    {!isContentExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent flex items-end justify-center pb-8 pt-20">
                            <button 
                                onClick={() => setIsContentExpanded(true)}
                                className="bg-[var(--surface)] px-6 py-2 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-hover)] transition-colors"
                            >
                                Show Full Content
                            </button>
                        </div>
                    )}
                    {isContentExpanded && (
                         <div className="flex justify-center mt-8">
                            <button 
                                onClick={() => setIsContentExpanded(false)}
                                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] underline"
                            >
                                Show Less
                            </button>
                         </div>
                    )}
                </div>
            </div>
            
            {(material.summary) && (
                 <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)] flex items-center gap-2">
                        <MessageSquare size={20} className="text-orange-500"/>
                        AI Summary
                    </h2>
                    <div className="prose dark:prose-invert max-w-none text-sm text-[var(--foreground)]">
                        <div className="whitespace-pre-wrap">{material.summary}</div>
                    </div>
                 </div>
            )}

            <div id="comments-section">
                <CommentsSection materialId={id} />
            </div>
        </div>
      </main>
    </div>
  );
}


