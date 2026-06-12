import { MissingEnvError } from "@/lib/env";

export function EnvError({ error }: { error: unknown }) {
  if (!(error instanceof MissingEnvError)) {
    return null;
  }

  return (
    <section className="rounded border border-red-200 bg-white p-6 shadow-panel">
      <p className="text-sm font-semibold text-red-700">Missing environment variables</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">
        Add the Supabase connection settings
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        Add these values to `.env.local` so the app can load data from Supabase views.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-ink">
        {error.missingKeys.map((key) => (
          <li key={key} className="rounded bg-red-50 px-3 py-2 font-mono text-red-800">
            {key}
          </li>
        ))}
      </ul>
    </section>
  );
}
