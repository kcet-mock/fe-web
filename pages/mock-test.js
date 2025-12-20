import { useRouter } from 'next/router';
import { useEffect } from 'react';

function generateSessionId() {
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function MockTestPage() {
  const router = useRouter();

  useEffect(() => {
    const sessionId = generateSessionId();
    router.replace(`/mock-test/bio?year=random&session_id=${sessionId}`);
  }, [router]);

  return null;
}
