export interface DiscussionThread {
  id: string;
  lesson_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  likes_count?: number;
  replies_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateThreadInput = {
  id?: string;
  lesson_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned?: boolean;
  is_locked?: boolean;
};

export type UpdateThreadInput = Partial<
  Omit<DiscussionThread, 'id' | 'lesson_id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export interface DiscussionReply {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateReplyInput = {
  id?: string;
  thread_id: string;
  user_id: string;
  content: string;
};

export type UpdateReplyInput = Partial<
  Omit<DiscussionReply, 'id' | 'thread_id' | 'user_id' | 'created_at' | 'updated_at'>
>;
