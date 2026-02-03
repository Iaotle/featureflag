'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFlags } from '@/hooks/useFlags';
import type { DamageReport } from '@/types/report';
import PriorityBadge from '@/components/PriorityBadge';
import AIDamageDetection from '@/components/AIDamageDetection';
import Image from 'next/image';

export default function ViewReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<DamageReport | null>(null);
  const [loading, setLoading] = useState(true);

  const flags = useFlags(['priority_indicators', 'ai_damage_detection']);

  async function fetchReport() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/reports/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
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

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this report?')) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/reports/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/reports');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Report not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/reports" className="text-blue-600 hover:underline">
            ← Back to Reports
          </Link>
        </div>

        <div className="bg-white rounded shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <div className="flex gap-4">
              <Link
                href={`/reports/${report.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
              <p>{report.damage_location}</p>
            </div>
            {flags.priority_indicators && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                <PriorityBadge priority={report.priority} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <p className="capitalize">{report.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
              <p>{new Date(report.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="whitespace-pre-wrap">{report.description}</p>
          </div>

          {report.photos && report.photos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Photos</h3>
              <div className="grid grid-cols-3 gap-4">
                {report.photos.map((photo, index) => (
                  <div
                    key={photo}
                    className="relative bg-gray-100 rounded overflow-hidden"
                  >
                    <div className="aspect-square w-full bg-gray-200 relative">
                      <Image
                        src={photo}
                        alt={`Damage photo ${index + 1}`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-700 truncate" title={photo}>
                        {photo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flags.ai_damage_detection && report.photos && report.photos.length > 0 && (
            <AIDamageDetection reportId={report.id} photos={report.photos} />
          )}
        </div>
      </div>
    </div>
  );
}
