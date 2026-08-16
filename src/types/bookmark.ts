export interface Bookmark {
  id: string;
  user_id: string;
  lesson_id: string;
  created_at?: string;
}

export type CreateBookmarkInput = {
  id?: string;
  user_id: string;
  lesson_id: string;
};
