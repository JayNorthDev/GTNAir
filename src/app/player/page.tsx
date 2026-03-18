
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlayerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home as this route is deprecated
    router.replace('/');
  }, [router]);

  return null;
}
