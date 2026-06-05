"use client";

import { useState } from "react";
import { Star, CornerDownRight, MessageSquare, Send, Reply, ChevronDown, ChevronUp, Trash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CommentUser {
  name: string | null;
  avatarUrl: string | null;
  email: string;
}

export interface CommentType {
  id: string;
  postId: string;
  userId: string;
  content: string;
  rating: number | null;
  parentId: string | null;
  createdAt: string | Date;
  user: CommentUser;
}

interface BlogCommentsSectionProps {
  postId: string;
  initialComments: CommentType[];
  currentUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export default function BlogCommentsSection({
  postId,
  initialComments,
  currentUser,
}: BlogCommentsSectionProps) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newRating, setNewRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Group comments: root level vs replies
  const rootComments = comments.filter((c) => !c.parentId);
  const getRepliesFor = (commentId: string) => {
    return comments.filter((c) => c.parentId === commentId);
  };

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentContent.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: newCommentContent,
          rating: newRating,
          parentId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi bình luận");
      }

      setComments((prev) => [data.comment, ...prev]);
      setNewCommentContent("");
      setNewRating(null);
      toast.success("Đăng bình luận & đánh giá thành công!");
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddReply(parentId: string) {
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: replyContent,
          rating: null, // Replies don't have rating
          parentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi phản hồi");
      }

      setComments((prev) => [...prev, data.comment]);
      setReplyContent("");
      setReplyToId(null);
      toast.success("Gửi phản hồi thành công!");
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá/bình luận này?")) return;

    try {
      const res = await fetch(`/api/blog/comments?id=${commentId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa bình luận");
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      toast.success("Đã xóa bình luận!");
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi");
    }
  }

  // Helper component to render stars
  function Stars({ count, size = 4 }: { count: number; size?: number }) {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={`h-${size} w-${size} ${
              idx < count ? "fill-amber-400 text-amber-400" : "text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-8 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-5.5 w-5.5 text-blue-600" />
          <span>Đánh giá & Bình luận ({comments.length})</span>
        </h3>
      </div>

      {/* Main Comment Form (Logged in) */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="space-y-4 bg-slate-50/40 border border-slate-100 p-5 rounded-2xl">
          <h4 className="text-sm font-bold text-slate-800">Để lại đánh giá & ý kiến của bạn</h4>
          
          {/* Star Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Đánh giá sao (tùy chọn):</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => {
                const starVal = idx + 1;
                const isFilled = hoverRating !== null ? starVal <= hoverRating : starVal <= (newRating || 0);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewRating(starVal === newRating ? null : starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="text-slate-300 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`h-6 w-6 transition-all duration-150 ${
                        isFilled ? "fill-amber-400 text-amber-400 scale-110" : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {newRating && (
              <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                {newRating} / 5 sao
              </span>
            )}
          </div>

          <div className="relative">
            <Textarea
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
              rows={3}
              className="w-full bg-white rounded-xl border-slate-200 focus:ring-blue-500 pr-12 text-sm"
              required
            />
            <button
              type="submit"
              disabled={submitting || !newCommentContent.trim()}
              className="absolute right-3.5 bottom-3.5 h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-colors cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center p-6 bg-slate-50/50 border border-slate-100/80 rounded-2xl text-slate-500 text-sm font-medium">
          Vui lòng{" "}
          <a href="/signin" className="text-blue-600 hover:underline font-bold">
            đăng nhập
          </a>{" "}
          để đánh giá sao và gửi bình luận của bạn.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {rootComments.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-medium">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          rootComments.map((comment) => {
            const replies = getRepliesFor(comment.id);
            const userInitial = (comment.user.name || comment.user.email || "U").charAt(0).toUpperCase();

            return (
              <div key={comment.id} className="border-b border-slate-50 pb-6 last:border-b-0 space-y-4">
                {/* Parent Comment Header & Body */}
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border border-slate-100 shadow-sm shrink-0">
                    <AvatarFallback className="bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 font-bold text-sm">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {comment.user.name || "Người dùng ẩn"}
                        </span>
                        {comment.rating && <Stars count={comment.rating} size={3.5} />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>

                    {/* Comment Actions */}
                    {currentUser && (
                      <div className="flex items-center gap-4 pt-1">
                        <button
                          onClick={() => {
                            if (replyToId === comment.id) {
                              setReplyToId(null);
                            } else {
                              setReplyToId(comment.id);
                              setReplyContent("");
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          <span>Trả lời</span>
                        </button>
                        {(currentUser.id === comment.userId || currentUser.role === "ADMIN") && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Reply Form */}
                {replyToId === comment.id && (
                  <div className="ml-14 bg-slate-50/40 p-4 border border-slate-100 rounded-xl space-y-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Phản hồi đến {comment.user.name || "Người dùng"}
                    </p>
                    <div className="relative">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Nhập nội dung phản hồi..."
                        rows={2}
                        className="w-full bg-white rounded-xl border-slate-200 focus:ring-blue-500 pr-12 text-sm"
                        required
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={submitting || !replyContent.trim()}
                        className="absolute right-3 bottom-3 h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-colors cursor-pointer"
                      >
                        <Send className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies Rendering */}
                {replies.length > 0 && (
                  <div className="ml-14 pl-4 border-l border-slate-100 space-y-4 pt-2">
                    {replies.map((reply) => {
                      const replyUserInitial = (reply.user.name || reply.user.email || "R").charAt(0).toUpperCase();
                      return (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 border border-slate-100 shadow-sm shrink-0">
                            <AvatarFallback className="bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-600 font-bold text-xs">
                              {replyUserInitial}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-slate-700">
                                {reply.user.name || "Người dùng ẩn"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {new Date(reply.createdAt).toLocaleDateString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                              {reply.content}
                            </p>
                            {currentUser && (currentUser.id === reply.userId || currentUser.role === "ADMIN") && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer pt-1"
                              >
                                <Trash className="h-3 w-3" />
                                <span>Xóa</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
