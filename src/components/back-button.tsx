'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function BackButton() {
  const router = useRouter();

  return (
    <Button variant="link" className="mb-2" onClick={() => router.back()}>
      ← Back
    </Button>
  );
}
