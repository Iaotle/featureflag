export type RolloutType = 'boolean' | 'user_groups';

export type UserGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface FeatureFlag {
  id: number;
  name: string;
  key: string;
  description: string | null;
  is_active: boolean;
  rollout_type: RolloutType;
  enabled_groups: UserGroup[] | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFlagData {
  name: string;
  key: string;
  description?: string;
  is_active: boolean;
  rollout_type: RolloutType;
  enabled_groups?: UserGroup[];
  scheduled_start_at?: string;
  scheduled_end_at?: string;
}

export type UpdateFlagData = Partial<CreateFlagData>;
