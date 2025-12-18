import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useSession } from '@/lib/auth-client';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [router, session, isPending]);

  return <>{children}</>;
}
