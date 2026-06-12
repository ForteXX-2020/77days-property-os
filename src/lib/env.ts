const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_MVP_USER_ID"
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

export class MissingEnvError extends Error {
  missingKeys: RequiredEnvKey[];

  constructor(missingKeys: RequiredEnvKey[]) {
    super(`Missing required environment variables: ${missingKeys.join(", ")}`);
    this.name = "MissingEnvError";
    this.missingKeys = missingKeys;
  }
}

export function getRequiredEnv() {
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MVP_USER_ID: process.env.NEXT_PUBLIC_MVP_USER_ID
  };

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !values[key]);

  if (missingKeys.length > 0) {
    throw new MissingEnvError(missingKeys);
  }

  return values as Record<RequiredEnvKey, string>;
}
