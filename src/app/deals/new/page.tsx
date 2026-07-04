import Link from "next/link";
import { DataError } from "@/components/data-error";
import { NewDealForm } from "@/components/deals/NewDealForm";
import { EnvError } from "@/components/env-error";
import { MissingEnvError } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function NewDealPage() {
  try {
    return (
      <div>
        <section className="rounded border border-ink/10 bg-white p-6 shadow-panel">
          <Link
            href="/deals"
            className="text-sm font-semibold text-black underline-offset-4 hover:underline"
          >
            Back to Deals
          </Link>

          <div className="mt-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-clay">
              DD Intake
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
              New Deal
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65 sm:text-base">
              Create a minimal deal record. Source files, rent roll, and
              simulations can be linked later.
            </p>
          </div>

          <NewDealForm />
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return <EnvError error={error} />;
    }

    return (
      <DataError
        message={error instanceof Error ? error.message : "An unknown error occurred."}
      />
    );
  }
}
