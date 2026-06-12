export function DataError({ message }: { message: string }) {
  return (
    <section className="rounded border border-red-200 bg-white p-6 shadow-panel">
      <p className="text-sm font-semibold text-red-700">Could not load data</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Check the Supabase views</h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">{message}</p>
    </section>
  );
}
