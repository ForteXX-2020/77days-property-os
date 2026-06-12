export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-ink/20 bg-white/70 p-6 text-center">
      <p className="text-sm text-ink/60">{message}</p>
    </div>
  );
}
