'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminNav from '@/components/admin/AdminNav';
import { useAuth } from '@/hooks/useAuth';

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If on login page, show without layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If not authenticated, don't show anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Show admin layout with navigation
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
