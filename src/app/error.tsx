// app/error.tsx
'use client';

export default function Error({ error }: { error: Error }) {
  const requestId = document.cookie
    .split('; ')
    .find((row) => row.startsWith('x-request-id='))
    ?.split('=')[1];

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>Reference ID: {requestId}</p>
      <small>Quote this ID when contacting support</small>
    </div>
  );
}
