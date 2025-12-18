import { useRouter } from 'next/router';

export default function MockTestPage() {
  const router = useRouter();

  if (typeof window !== 'undefined') {
    router.replace('/mock-test/bio');
  }

  return null;
}
