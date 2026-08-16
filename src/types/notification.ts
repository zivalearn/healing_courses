export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string | null;
  reference_id?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export type CreateNotificationInput = {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type?: string | null;
  reference_id?: string | null;
  is_read?: boolean;
};
