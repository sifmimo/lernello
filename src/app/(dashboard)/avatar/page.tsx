'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AvatarCustomizer } from '@/components/avatar';

export default function AvatarPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    if (!id) {
      router.push('/profiles');
      return;
    }
    setProfileId(id);
    setLoading(false);
  }, [router]);

  if (loading || !profileId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <AvatarCustomizer 
        studentId={profileId} 
        onSave={() => router.push('/dashboard')}
      />
    </div>
  );
}
