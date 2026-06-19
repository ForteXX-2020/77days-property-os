type KpiCardProps = {
  label: string;
  value: string;
};

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <article className="rounded border border-ink/10 bg-white p-5 shadow-panel">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{value}</p>
    </article>
  );
}
