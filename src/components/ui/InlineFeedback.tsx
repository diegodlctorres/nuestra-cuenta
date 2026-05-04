import React from 'react';

export function InlineFeedback({
  message,
  tone = 'error'
}: {
  message: string;
  tone?: 'error' | 'warning';
}) {
  const classes = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-secondary-200 bg-secondary-50 text-secondary-700';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${classes}`} role="alert">
      {message}
    </div>
  );
}
