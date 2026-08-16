export interface ActivityLog {
  id: string;
  user_id: string;
  entity: string;
  entity_id?: string | null;
  action: string;
  metadata?: Record<string, any> | null;
  created_at?: string;
}

export type LogActivityInput = {
  id?: string;
  user_id: string;
  entity: string;
  entity_id?: string | null;
  action: string;
  metadata?: Record<string, any> | null;
};
