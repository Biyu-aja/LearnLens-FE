"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { exploreAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface CommentsSectionProps {
    materialId: string;
}

// Helper to format relative time
function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
}

function Avatar({ src, name, size = "md" }: { src?: string | null, name?: string | null, size?: "sm" | "md" }) {
    const initials = name ? name.substring(0, 1).toUpperCase() : "?";
    const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    
    const colors = [
        "bg-blue-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-green-500",
        "bg-orange-500",
        "bg-teal-500",
    ];
    const colorIndex = name ? name.length % colors.length : 0;

    return (
        <div className={`${sizeClasses} rounded-full ${colors[colorIndex]} flex items-center justify-center font-semibold text-white shrink-0`}>
            {src ? <img src={src} alt={name || "User"} className="w-full h-full rounded-full object-cover" /> : initials}
        </div>
    );
}

export function CommentsSection({ materialId }: CommentsSectionProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);
    const [replyingTo, setReplyingTo] = useState<{ id: string, name: string, rootId: string } | null>(null);

    useEffect(() => {
        exploreAPI.getComments(materialId).then(res => setComments(res.comments)).catch(console.error);
    }, [materialId]);
    
    const handleReply = (commentId: string, username: string, rootId?: string) => {
        setReplyingTo({ id: commentId, name: username, rootId: rootId || commentId });
        setNewComment("");
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setNewComment("");
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const parentId = replyingTo ? replyingTo.rootId : undefined;
            const res = await exploreAPI.addComment(materialId, newComment, parentId);
            
            if (parentId) {
                setComments(prev => prev.map(c => {
                   if (c.id === parentId) {
                       return { ...c, replies: [...(c.replies || []), res.comment] };
                   } 
                   return c;
                }));
            } else {
                setComments([res.comment, ...comments]);
            }
            
            setNewComment("");
            setReplyingTo(null);
        } catch (error) {
            console.error(error);
            alert("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string, parentId?: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await exploreAPI.deleteComment(commentId);
            if (parentId) {
                 setComments(prev => prev.map(c => {
                    if (c.id === parentId) {
                        return { ...c, replies: (c.replies || []).filter((r: any) => r.id !== commentId) };
                    }
                    return c;
                 }));
            } else {
                setComments(comments.filter(c => c.id !== commentId));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete comment");
        }
    };

    const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

    const renderComment = (comment: any, isReply = false, rootId?: string) => (
        <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
            <Avatar src={comment.user.image} name={comment.user.name} size={isReply ? "sm" : "md"} />
            
            <div className="flex-1 min-w-0">
                {/* Comment bubble */}
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2 inline-block max-w-full">
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100">
                            {comment.user.name || 'Anonymous'}
                        </span>
                        {user && user.id === comment.user.id && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">You</span>
                        )}
                    </div>
                    <p className="text-[14px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
                        {comment.content}
                    </p>
                </div>
                
                {/* Actions row */}
                <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span title={new Date(comment.createdAt).toLocaleString()}>
                        {formatTimeAgo(comment.createdAt)}
                    </span>
                    <button 
                        onClick={() => handleReply(comment.id, comment.user.name || 'Anonymous', rootId || comment.id)}
                        className="font-semibold hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        Reply
                    </button>
                    {user && user.id === comment.user.id && (
                        <button
                            onClick={() => handleDelete(comment.id, rootId)} 
                            className="font-semibold hover:text-red-500 transition-colors"
                        >
                           Delete
                        </button>
                    )}
                </div>

                {/* Replies */}
                {!isReply && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {comment.replies.map((reply: any) => renderComment(reply, true, comment.id))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                <MessageCircle size={18} className="text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Comments
                </h2>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {totalComments}
                </span>
            </div>

            {/* Comments List */}
            <div className="space-y-4 mb-6">
                {comments.map((comment) => renderComment(comment))}
                
                {comments.length === 0 && (
                    <div className="text-center py-8">
                        <MessageCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">No comments yet</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Be the first to comment!</p>
                    </div>
                )}
            </div>

            {/* Comment Input */}
            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <Avatar src={user?.image} name={user?.name || user?.email} />
                <form onSubmit={handleSubmit} className="flex-1">
                    {replyingTo && (
                        <div className="flex items-center gap-2 mb-2 text-sm">
                            <span className="text-zinc-500 dark:text-zinc-400">Replying to</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">@{replyingTo.name}</span>
                            <button 
                                type="button"
                                onClick={cancelReply}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input 
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting}
                            placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!newComment.trim() || isSubmitting}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
