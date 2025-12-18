import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function MockTestPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mock-test/bio');
  }, [router]);

  return null;
}
