'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalFlags: 0,
    activeFlags: 0,
    inactiveFlags: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/flags`, {
        credentials: 'include',
      });
      if (response.ok) {
        const flags = await response.json();
        setStats({
          totalFlags: flags.length,
          activeFlags: flags.filter((f: any) => f.is_active).length,
          inactiveFlags: flags.filter((f: any) => !f.is_active).length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Flags</h2>
          <p className="text-3xl font-bold">{stats.totalFlags}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Active Flags</h2>
          <p className="text-3xl font-bold text-green-600">{stats.activeFlags}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Inactive Flags</h2>
          <p className="text-3xl font-bold text-gray-400">{stats.inactiveFlags}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <Link
            href="/admin/flags"
            className="block px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          >
            Manage Feature Flags
          </Link>
          <Link
            href="/admin/flags/new"
            className="block px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 text-center"
          >
            Create New Flag
          </Link>
        </div>
      </div>
    </div>
  );
}
