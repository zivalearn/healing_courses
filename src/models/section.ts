export interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  display_order: number;
  is_locked: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateSectionInput = Omit<
  Section,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
};

export type UpdateSectionInput = Partial<
  Omit<Section, 'id' | 'course_id' | 'created_at' | 'updated_at'>
>;

export interface SectionReorderItem {
  id: string;
  display_order: number;
}
