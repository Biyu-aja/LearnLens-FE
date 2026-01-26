"use client";

import { useEffect, useState } from "react";
import { X, BookOpen, Clock, Heart, GitFork, FileText, User, Trash2, Edit2, Check, Save } from "lucide-react";
import { ExploreMaterial, exploreAPI, materialsAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ExploreDetailModalProps {
  materialId: string;
  isOpen: boolean;
  onClose: () => void;
  onFork: (id: string, title: string) => void;
  onLike: (id: string, currentLiked: boolean) => void;
  onUpdate?: () => void;
}

export function ExploreDetailModal({
  materialId,
  isOpen,
  onClose,
  onFork,
  onLike,
  onUpdate
}: ExploreDetailModalProps) {
  const { user } = useAuth();
  const [material, setMaterial] = useState<ExploreMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch full details when modal opens
  useEffect(() => {
    if (isOpen && materialId) {
      setLoading(true);
      exploreAPI.get(materialId)
        .then(res => {
          setMaterial(res.material);
          setEditTitle(res.material.title);
          setEditDescription(res.material.description || "");
        })
        .catch(err => {
          console.error("Failed to load material details:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setMaterial(null);
      setIsEditing(false);
    }
  }, [isOpen, materialId]);

  const handleDelete = async () => {
    if (!material || !material.originalMaterialId) return;
    
    if (!confirm("Are you sure you want to remove this post from Explore? Your local copy will remain.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await materialsAPI.unpublish(material.originalMaterialId);
      alert("Post removed from Explore.");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!material || !material.originalMaterialId) return;

    setIsSaving(true);
    try {
      // We use the publish endpoint to update existing explore content
      await materialsAPI.publish(material.originalMaterialId, {
        title: editTitle,
        description: editDescription,
        // We keep the existing content for now, or we could allow editing it too.
        // For metadata edit, this is sufficient.
      });
      
      setMaterial(prev => prev ? { ...prev, title: editTitle, description: editDescription } : null);
      setIsEditing(false);
      onUpdate?.();
      alert("Post updated successfully!");
    } catch (error) {
      console.error("Failed to update:", error);
      alert("Failed to update post.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isOwner = user && material && user.id === material.user.id;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-[var(--surface)] w-full max-w-4xl max-h-[90vh] h-auto rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BookOpen size={20} className="text-[var(--primary)]" />
            Material Details
          </h2>
          <div className="flex items-center gap-2">
            {isOwner && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary)] rounded-full transition-colors"
                  title="Edit Details"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-[var(--foreground-muted)] hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                  title="Delete Post"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : material ? (
            <div className="p-6 md:p-8 space-y-8">
              
              {/* Hero Section */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-md uppercase tracking-wider">
                    {material.type}
                  </span>
                  <span className="px-2.5 py-1 bg-[var(--surface-hover)] text-[var(--foreground-muted)] text-xs font-medium rounded-md flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(material.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-3xl md:text-4xl font-bold bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                    placeholder="Post Title"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight text-[var(--foreground)] line-clamp-2 break-all">
                    {material.title}
                  </h1>
                )}

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold border border-white/10 shadow-sm">
                    {material.user.image ? <img src={material.user.image} alt="" className="w-full h-full rounded-full" /> : <User size={18} />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{material.user.name || "Anonymous Learner"}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">Author</div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-6 py-4 border-y border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Heart size={18} className={material.isLiked ? "text-rose-500 fill-rose-500" : "text-[var(--foreground-muted)]"} />
                  <span className="font-semibold">{material.likeCount}</span>
                  <span className="text-sm text-[var(--foreground-muted)]">Likes</span>
                </div>
                <div className="w-px h-8 bg-[var(--border)]" />
                <div className="flex items-center gap-2">
                  <GitFork size={18} className="text-[var(--foreground-muted)]" />
                  <span className="font-semibold">{material.forkCount}</span>
                  <span className="text-sm text-[var(--foreground-muted)]">Forks</span>
                </div>
              </div>

              {/* Description */}
              {(material.description || isEditing) && (
                <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] text-[var(--foreground)] leading-relaxed">
                  <h3 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">About this material</h3>
                  {isEditing ? (
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full min-h-[100px] bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--primary)] outline-none resize-y"
                      placeholder="Add a description..."
                    />
                  ) : (
                    <p className="whitespace-pre-line">{material.description}</p>
                  )}
                </div>
              )}

              {/* Preview Content (if available) */}
              {(material as any).content && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-teal-500" />
                    Content Preview
                  </h3>
                  <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] font-mono text-sm leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto shadow-inner">
                    <pre className="whitespace-pre-wrap">{(material as any).content}</pre>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--foreground-muted)]">
              Material not found
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-3 shrink-0">
          
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm flex items-center gap-2"
              >
                {isSaving ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors font-medium text-sm"
              >
                Close
              </button>
              
              {material && !isOwner && (
                <>
                  <button
                    onClick={() => {
                      if (material) {
                        onLike(material.id, material.isLiked);
                        // Update local state
                        setMaterial(prev => prev ? ({ 
                          ...prev, 
                          isLiked: !prev.isLiked,
                          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 
                        }) : null);
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl border transition-colors font-medium text-sm flex items-center gap-2 ${
                      material.isLiked 
                        ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                        : "border-[var(--border)] hover:border-rose-300 hover:text-rose-600"
                    }`}
                  >
                    <Heart size={16} fill={material.isLiked ? "currentColor" : "none"} />
                    {material.isLiked ? "Liked" : "Like"}
                  </button>

                  <button
                    onClick={() => material && onFork(material.id, material.title)}
                    className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm flex items-center gap-2"
                  >
                    <GitFork size={16} />
                    Save Copy to Library
                  </button>
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
