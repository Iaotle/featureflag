'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFlags } from '@/hooks/useFlags';
import { getUserId } from '@/lib/flags';
import type { DamageReport } from '@/types/report';
import PriorityBadge from '@/components/PriorityBadge';
import UserInfo from '@/components/UserInfo';

export default function ReportsPage() {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);

  const flags = useFlags(['priority_indicators', 'bulk_actions', 'pdf_export']);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    const userId = getUserId();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/reports?user_identifier=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedReports.length === 0) return;
    if (!confirm(`Delete ${selectedReports.length} report(s)?`)) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/reports/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedReports }),
      });

      if (response.ok) {
        // Remove deleted reports from state
        setReports(reports.filter((r) => !selectedReports.includes(r.id)));
        setSelectedReports([]);
      } else {
        alert('Failed to delete reports');
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      alert('Failed to delete reports');
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedReports(reports.map((r) => r.id));
    } else {
      setSelectedReports([]);
    }
  }

  function handleExportPDF() {
    alert('PDF export functionality - feature enabled!');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserInfo />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Car Damage Reports</h1>
            <div className="flex gap-4">
              {flags.pdf_export && (
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Export PDF
                </button>
              )}
              <Link
                href="/reports/new"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                New Report
              </Link>
            </div>
          </div>

          {flags.bulk_actions && selectedReports.length > 0 && (
            <div className="mb-4 p-4 bg-white rounded shadow">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected ({selectedReports.length})
              </button>
            </div>
          )}

          {reports.length === 0 ? (
            <div className="bg-white rounded shadow p-8 text-center">
              <p className="text-gray-500">No reports found. Create your first report!</p>
            </div>
          ) : (
            <div className="bg-white rounded shadow">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    {flags.bulk_actions && (
                      <th className="p-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedReports.length === reports.length && reports.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          title="Select all reports"
                        />
                      </th>
                    )}
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">Location</th>
                    {flags.priority_indicators && (
                      <th className="p-4 text-left">Priority</th>
                    )}
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Created</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-t hover:bg-gray-50">
                      {flags.bulk_actions && (
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReports([...selectedReports, report.id]);
                              } else {
                                setSelectedReports(selectedReports.filter((id) => id !== report.id));
                              }
                            }}
                          />
                        </td>
                      )}
                      <td className="p-4 font-medium">{report.title}</td>
                      <td className="p-4">{report.damage_location}</td>
                      {flags.priority_indicators && (
                        <td className="p-4">
                          <PriorityBadge priority={report.priority} />
                        </td>
                      )}
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                          {report.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-blue-600 hover:underline mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/reports/${report.id}/edit`}
                          className="text-green-600 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
