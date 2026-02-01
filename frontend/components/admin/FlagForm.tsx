'use client';

import { useState } from 'react';
import { CreateFlagData, FeatureFlag, UserGroup, RolloutType } from '@/types/flag';

interface FlagFormProps {
  initialData?: FeatureFlag;
  onSubmit: (data: CreateFlagData) => Promise<void>;
  isSubmitting: boolean;
}

const USER_GROUPS: UserGroup[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Convert ISO datetime string to datetime-local format (YYYY-MM-DDTHH:mm)
 */
function toDatetimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  // Take first 16 characters of ISO string (YYYY-MM-DDTHH:mm)
  return isoString.slice(0, 16);
}

export default function FlagForm({ initialData, onSubmit, isSubmitting }: FlagFormProps) {
  const [formData, setFormData] = useState<CreateFlagData>({
    name: initialData?.name || '',
    key: initialData?.key || '',
    description: initialData?.description || '',
    is_active: initialData?.is_active ?? true,
    rollout_type: initialData?.rollout_type || 'boolean',
    enabled_groups: initialData?.enabled_groups || [],
    scheduled_start_at: toDatetimeLocal(initialData?.scheduled_start_at),
    scheduled_end_at: toDatetimeLocal(initialData?.scheduled_end_at),
  });

  const [error, setError] = useState('');

  function handleChange<K extends keyof CreateFlagData>(field: K, value: CreateFlagData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleGroupToggle(group: UserGroup) {
    const currentGroups = formData.enabled_groups || [];
    const newGroups = currentGroups.includes(group)
      ? currentGroups.filter((g) => g !== group)
      : [...currentGroups, group];
    handleChange('enabled_groups', newGroups);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.key.trim()) {
      setError('Key is required');
      return;
    }
    if (formData.rollout_type === 'user_groups' && (!formData.enabled_groups || formData.enabled_groups.length === 0)) {
      setError('Please select at least one user group');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save flag');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Damage Photo Upload"
        />
      </div>

      <div>
        <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
          Key *
        </label>
        <input
          type="text"
          id="key"
          value={formData.key}
          onChange={(e) => handleChange('key', e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., damage_photo_upload"
        />
        <p className="mt-1 text-sm text-gray-500">
          Unique identifier for this flag (use lowercase and underscores)
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description of what this flag controls"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rollout Type *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="rollout_type"
              value="boolean"
              checked={formData.rollout_type === 'boolean'}
              onChange={(e) => handleChange('rollout_type', e.target.value as RolloutType)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Boolean (all users or none)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="rollout_type"
              value="user_groups"
              checked={formData.rollout_type === 'user_groups'}
              onChange={(e) => handleChange('rollout_type', e.target.value as RolloutType)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              User Groups (specific groups only)
            </span>
          </label>
        </div>
      </div>

      {formData.rollout_type === 'user_groups' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enabled Groups *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {USER_GROUPS.map((group) => (
              <label
                key={group}
                className="flex items-center p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={formData.enabled_groups?.includes(group) || false}
                  onChange={() => handleGroupToggle(group)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium">Group {group}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Schedule (Optional)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduled_start_at" className="block text-sm font-medium text-gray-700 mb-1">
              Start At
            </label>
            <input
              type="datetime-local"
              id="scheduled_start_at"
              value={formData.scheduled_start_at || ''}
              onChange={(e) => handleChange('scheduled_start_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="scheduled_end_at" className="block text-sm font-medium text-gray-700 mb-1">
              End At
            </label>
            <input
              type="datetime-local"
              id="scheduled_end_at"
              value={formData.scheduled_end_at || ''}
              onChange={(e) => handleChange('scheduled_end_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md font-medium"
        >
          {isSubmitting ? 'Saving...' : 'Save Flag'}
        </button>
      </div>
    </form>
  );
}
