'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import FlagForm from '@/components/admin/FlagForm';
import { FeatureFlag, CreateFlagData } from '@/types/flag';
import * as flagsApi from '@/lib/admin-flags';

export default function EditFlagPage() {
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    loadFlag();
  }, [id]);

  async function loadFlag() {
    try {
      const data = await flagsApi.getFlag(id);
      setFlag(data);
    } catch (error) {
      console.error('Failed to load flag:', error);
      alert('Failed to load flag');
      router.push('/admin/flags');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: CreateFlagData) {
    setIsSubmitting(true);
    try {
      await flagsApi.updateFlag(Number(id), data);
      router.push('/admin/flags');
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div>Loading flag...</div>;
  }

  if (!flag) {
    return <div>Flag not found</div>;
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

      <h1 className="text-3xl font-bold mb-6">Edit Feature Flag</h1>

      <FlagForm
        initialData={flag}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
