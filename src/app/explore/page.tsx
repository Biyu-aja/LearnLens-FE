"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Heart, GitFork, Globe, BookOpen, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { exploreAPI, ExploreMaterial, materialsAPI, MaterialSummary } from "@/lib/api";
import { MaterialUpload } from "@/components/MaterialUpload";

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Feed state
  const [publicMaterials, setPublicMaterials] = useState<ExploreMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sidebar state
  const [userMaterials, setUserMaterials] = useState<MaterialSummary[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch Data
  useEffect(() => {
    if (user) {
      fetchPublicMaterials();
      fetchUserMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortBy]);

  const fetchUserMaterials = async () => {
    try {
      const response = await materialsAPI.list();
      setUserMaterials(response.materials);
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    //   console.error("Failed to fetch user materials:", error);
    }
  };

  const fetchPublicMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await exploreAPI.list(sortBy, searchQuery);
      setPublicMaterials(response.materials);
    } catch (error) {
      console.error("Failed to fetch public materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicMaterials();
  };

  const handleLike = async (id: string, currentLiked: boolean) => {
    // Optimistic update
    setPublicMaterials(prev => prev.map(m => 
        m.id === id 
            ? { ...m, isLiked: !currentLiked, likeCount: currentLiked ? m.likeCount - 1 : m.likeCount + 1 }
            : m
    ));

    try {
        await exploreAPI.toggleLike(id);
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Revert on error
        fetchPublicMaterials();
    }
  };

  const handleFork = async (id: string, title: string) => {
    if (!confirm(`Save "${title}" to your library?`)) return;
    
    try {
        await exploreAPI.fork(id);
        alert("Material saved to your library!");
        fetchUserMaterials(); // Update sidebar
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        alert("Failed to save material.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpload = async (data: any) => {
    // Placeholder - user should go to dashboard to manage upload usually, 
    // but sidebar allows it. We'll reuse the logic from Dashboard if needed or just redirect.
    // For now, let's keep it simple and redirect to dashboard after upload.
    router.push('/dashboard');
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
        materials={userMaterials} 
        onNewMaterial={() => setShowUpload(true)}
      />

      {/* Main content */}
      <main className="lg:pl-72 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pt-16 lg:pt-12">
          
          {/* Header & Search */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 flex items-center gap-2">
                <Globe className="text-teal-500" />
                Explore Community
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search topics, titles..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                    />
                </form>

                <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
                    <button 
                        onClick={() => setSortBy('latest')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === 'latest' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <span className="flex items-center gap-1.5"><Clock size={14}/> Newest</span>
                    </button>
                    <button 
                        onClick={() => setSortBy('popular')}
                         className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${sortBy === 'popular' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                    >
                        <span className="flex items-center gap-1.5"><TrendingUp size={14}/> Popular</span>
                    </button>
                </div>
            </div>
          </div>

          {/* Feed */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
            </div>
          ) : publicMaterials.length === 0 ? (
            <div className="text-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)] border-dashed">
                <Globe size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-[var(--foreground)]">No materials found</h3>
                <p className="text-[var(--foreground-muted)]">Be the first to share your learning material!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {publicMaterials.map((material) => (
                    <div key={material.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col">
                        <div className="p-5 flex-1">
                            {/* Author */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                    {material.user.image ? <img src={material.user.image} alt={material.user.name || "User"} className="w-full h-full rounded-full" /> : (material.user.name?.[0] || 'U')}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{material.user.name || 'Anonymous'}</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)]">{new Date(material.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
                                <a href={`/explore/${material.id}`} className="hover:underline">{material.title}</a>
                            </h3>
                            
                            {material.description && (
                                <p className="text-sm text-[var(--foreground-muted)] line-clamp-3 mb-4">
                                    {material.description}
                                </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 font-medium capitalize">
                                    {material.type}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => handleLike(material.id, material.isLiked)}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${material.isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}
                                >
                                    <Heart size={16} fill={material.isLiked ? "currentColor" : "none"} />
                                    {material.likeCount}
                                </button>
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <GitFork size={16} />
                                    {material.forkCount}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => handleFork(material.id, material.title)}
                                className="text-xs font-medium bg-[var(--surface-hover)] hover:bg-[var(--border)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors flex items-center gap-1.5"
                            >
                                <BookOpen size={14} />
                                Save Copy
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          )}

        </div>
      </main>
      
      {/* Upload modal reuse (optional, hidden by default but needed for sidebar prop) */}
      <MaterialUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
