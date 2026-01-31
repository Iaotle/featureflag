'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FlagForm from '@/components/admin/FlagForm';
import { CreateFlagData } from '@/types/flag';
import * as flagsApi from '@/lib/admin-flags';

export default function NewFlagPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(data: CreateFlagData) {
    setIsSubmitting(true);
    try {
      await flagsApi.createFlag(data);
      router.push('/admin/flags');
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/flags"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Flags
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Feature Flag</h1>

      <FlagForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
