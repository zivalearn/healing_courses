import React, { useState, useEffect } from 'react';
import { DiscussionThread, DiscussionReply } from '../../types/discussion';
import {
  getThreads,
  createThread,
  createReply,
  getReplies,
  updateThread,
} from '../../services/discussionService';
import { MessageSquare, ThumbsUp, Send, User, Pin, Lock, CornerDownRight, Loader2, Sparkles } from 'lucide-react';

interface StudentDiscussionsProps {
  userId: string;
  lessonId: string;
  studentName: string;
}

interface ThreadWithReplies extends DiscussionThread {
  replies?: DiscussionReply[];
  isExpanded?: boolean;
}

export const StudentDiscussions: React.FC<StudentDiscussionsProps> = ({
  userId,
  lessonId,
  studentName,
}) => {
  const [threads, setThreads] = useState<ThreadWithReplies[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [replyContentMap, setReplyContentMap] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState<boolean>(false);

  useEffect(() => {
    loadThreads();
  }, [lessonId]);

  const loadThreads = async () => {
    setLoading(true);
    const { data } = await getThreads(lessonId);
    setThreads(data || []);
    setLoading(false);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    const { data } = await createThread({
      lesson_id: lessonId,
      user_id: userId,
      title: newTitle,
      content: newContent,
    });

    if (data) {
      setThreads((prev) => [data, ...prev]);
      setNewTitle('');
      setNewContent('');
    }
    setIsPosting(false);
  };

  const handleToggleExpand = async (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const nextExpanded = !t.isExpanded;
          if (nextExpanded && !t.replies) {
            // Fetch replies
            getReplies(threadId).then(({ data }) => {
              setThreads((curr) =>
                curr.map((item) => (item.id === threadId ? { ...item, replies: data || [] } : item))
              );
            });
          }
          return { ...t, isExpanded: nextExpanded };
        }
        return t;
      })
    );
  };

  const handleLikeThread = async (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;
    const newLikes = (thread.likes_count || 0) + 1;
    const { data } = await updateThread(threadId, { likes_count: newLikes });
    if (data) {
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, likes_count: data.likes_count } : t)));
    }
  };

  const handleSendReply = async (threadId: string) => {
    const text = replyContentMap[threadId];
    if (!text || !text.trim()) return;

    const { data } = await createReply({
      thread_id: threadId,
      user_id: userId,
      content: text,
    });

    if (data) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, replies: [...(t.replies || []), data], replies_count: (t.replies_count || 0) + 1 }
            : t
        )
      );
      setReplyContentMap((prev) => ({ ...prev, [threadId]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Lesson Discussion & Q&A Forum</h3>
        </div>
        <span className="text-xs text-slate-500 font-semibold">{threads.length} Threads</span>
      </div>

      {/* Post New Discussion Thread Form */}
      <form onSubmit={handleCreateThread} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ask a Question or Share Insight</span>
        </h4>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Topic / Question Title..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Elaborate on your question or thoughts here..."
          rows={3}
          className="w-full p-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-y"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPosting || !newTitle.trim() || !newContent.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isPosting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Post Thread</span>
          </button>
        </div>
      </form>

      {/* Threads List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading discussions...</span>
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
          <p className="text-xs font-semibold text-slate-600">No discussions started for this lesson yet.</p>
          <p className="text-[11px] text-slate-400">Be the first student to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div key={thread.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {thread.is_pinned && (
                      <span className="p-1 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <h5 className="text-xs font-bold text-slate-900">{thread.title}</h5>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{thread.content}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleLikeThread(thread.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-bold text-slate-600 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{thread.likes_count || 0}</span>
                  </button>
                </div>
              </div>

              {/* Replies Toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Student ID: {thread.user_id.slice(0, 8)}</span>
                </span>
                <button
                  onClick={() => handleToggleExpand(thread.id)}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  {thread.isExpanded ? 'Hide Replies' : `View Replies (${thread.replies_count || 0})`}
                </button>
              </div>

              {/* Thread Expanded Replies Section */}
              {thread.isExpanded && (
                <div className="pl-4 pt-3 border-l-2 border-indigo-200 space-y-3">
                  {thread.replies && thread.replies.length > 0 ? (
                    thread.replies.map((reply) => (
                      <div key={reply.id} className="p-2.5 rounded-lg bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>User {reply.user_id.slice(0, 8)}</span>
                          <span>{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800">{reply.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No replies yet. Start the conversation!</p>
                  )}

                  {/* Add Reply Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={replyContentMap[thread.id] || ''}
                      onChange={(e) =>
                        setReplyContentMap((prev) => ({ ...prev, [thread.id]: e.target.value }))
                      }
                      placeholder="Write a reply..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={() => handleSendReply(thread.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
