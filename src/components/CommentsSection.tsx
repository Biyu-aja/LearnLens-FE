"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { exploreAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface CommentsSectionProps {
    materialId: string;
}

export function CommentsSection({ materialId }: CommentsSectionProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        exploreAPI.getComments(materialId).then(res => setComments(res.comments)).catch(console.error);
    }, [materialId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await exploreAPI.addComment(materialId, newComment);
            setComments([res.comment, ...comments]);
            setNewComment("");
        } catch (error) {
            console.error(error);
            alert("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await exploreAPI.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (e) {
            console.error(e);
            alert("Failed to delete comment");
        }
    };

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-6 text-[var(--foreground)] flex items-center gap-2">
                <MessageSquare size={20} className="text-teal-500"/>
                Comments ({comments.length})
            </h2>

            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-bold text-sm shrink-0 overflow-hidden">
                        {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover"/> : (user?.name?.[0] || 'U')}
                    </div>
                    <div className="flex-1">
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add to the discussion..." 
                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm min-h-[80px] resize-y"
                        />
                        <div className="flex justify-end mt-2">
                            <button 
                                type="submit" 
                                disabled={!newComment.trim() || isSubmitting}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Posting..." : "Post Comment"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="space-y-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                         <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-sm shrink-0 overflow-hidden">
                            {comment.user.image ? <img src={comment.user.image} alt="" className="w-full h-full object-cover"/> : (comment.user.name?.[0] || 'U')}
                        </div>
                        <div className="flex-1">
                             <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-[var(--foreground)]">{comment.user.name || 'Anonymous'}</span>
                                <span className="text-xs text-[var(--foreground-muted)]">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            
                            {user && user.id === comment.user.id && (
                                <button
                                    onClick={() => handleDelete(comment.id)} 
                                    className="mt-2 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                
                {comments.length === 0 && (
                    <div className="text-center py-8 text-[var(--foreground-muted)] text-sm italic">
                        No comments yet. Be the first to start the conversation!
                    </div>
                )}
            </div>
        </div>
    );
}
