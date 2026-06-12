"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded border border-red-200 bg-white p-6 shadow-panel">
      <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-ink/70">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-white"
      >
        Retry
      </button>
    </div>
  );
}
