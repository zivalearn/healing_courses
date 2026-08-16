export interface WishlistItem {
  id: string;
  user_id: string;
  course_id: string;
  created_at?: string;
}

export type AddToWishlistInput = {
  id?: string;
  user_id: string;
  course_id: string;
};
