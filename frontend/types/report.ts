export type Priority = 'low' | 'medium' | 'high';

export interface DamageReport {
  id: number;
  title: string;
  description: string;
  damage_location: string;
  priority?: Priority;
  status: string;
  photos: string[] | null;
  user_identifier: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  title: string;
  description: string;
  damage_location?: string;
  priority?: Priority;
  status?: string;
  photos?: string[];
  user_identifier: string;
}
