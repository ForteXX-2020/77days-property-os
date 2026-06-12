export function PageHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-clay">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 sm:text-base">
        {description}
      </p>
    </div>
  );
}
