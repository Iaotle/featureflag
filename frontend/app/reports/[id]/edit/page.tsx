'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFlags } from '@/hooks/useFlags';
import type { DamageReport, Priority } from '@/types/report';
import PhotoUpload from '@/components/PhotoUpload';

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<DamageReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const flags = useFlags(['damage_photo_upload']);

  useEffect(() => {
    fetchReport();
  }, [params.id]);

  async function fetchReport() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/reports/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        router.push('/reports');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      router.push('/reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData) return;

    setSubmitting(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/reports/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 403) {
        const data = await response.json();
        setError(data.message || 'Feature not available');
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      router.push(`/reports/${params.id}`);
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Failed to update report. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading report...</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Report not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href={`/reports/${params.id}`} className="text-blue-600 hover:underline">
            ← Back to Report
          </Link>
        </div>

        <div className="bg-white rounded shadow p-8">
          <h1 className="text-3xl font-bold mb-6">Edit Damage Report</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Damage Location *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.damage_location}
                onChange={(e) => setFormData({ ...formData, damage_location: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Priority *</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Priority })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {flags.damage_photo_upload && (
              <div className="mb-4">
                <PhotoUpload
                  photos={formData.photos || []}
                  onChange={(photos) => setFormData({ ...formData, photos })}
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/reports/${params.id}`}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
