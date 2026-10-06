const DEFAULT_HUB_USERNAME = "company";
const DEFAULT_HUB_PASSWORD = "password";
const DEFAULT_AUTH_EMAIL_DOMAIN = "company-nexus.local";

function getEnvValue(primaryKey: string, legacyKey?: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[primaryKey] ?? (legacyKey ? env[legacyKey] : undefined);
}

function resolveHubUsername(): string {
  const configured = import.meta.env.VITE_HUB_USERNAME?.trim();
  if (configured) return configured;

  const emailConfig = getEnvValue("FIREBASE_AUTH_EMAIL", "VITE_FIREBASE_AUTH_EMAIL")?.trim();
  if (emailConfig?.includes("@")) {
    return emailConfig.split("@")[0] || DEFAULT_HUB_USERNAME;
  }

  return DEFAULT_HUB_USERNAME;
}

function resolveHubPassword(): string {
  const configured = import.meta.env.VITE_HUB_PASSWORD?.trim();
  return configured || DEFAULT_HUB_PASSWORD;
}

/** Firebase Auth email for the shared hub account (not shown on the login form). */
function resolveFirebaseAuthEmail(hubUsername: string): string {
  const configured = getEnvValue("FIREBASE_AUTH_EMAIL", "VITE_FIREBASE_AUTH_EMAIL")?.trim();
  if (configured) {
    if (configured.includes("@")) return configured;
    return `${hubUsername}@${configured}`;
  }
  return `${hubUsername}@${DEFAULT_AUTH_EMAIL_DOMAIN}`;
}

const HUB_USERNAME = resolveHubUsername();
const HUB_PASSWORD = resolveHubPassword();
const FIREBASE_AUTH_EMAIL = resolveFirebaseAuthEmail(HUB_USERNAME);

export function getHubUsername(): string {
  return HUB_USERNAME;
}

export function getHubPassword(): string {
  return HUB_PASSWORD;
}

export function getFirebaseAuthEmail(): string {
  return FIREBASE_AUTH_EMAIL;
}

/** Accepts the configured username, or an email-form username when configured as one. */
export function normalizeHubLoginInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase() === HUB_USERNAME.toLowerCase()) return HUB_USERNAME;
  return trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
}

export function isValidHubUsername(value: string): boolean {
  return normalizeHubLoginInput(value).toLowerCase() === HUB_USERNAME.toLowerCase();
}

export function isValidHubPassword(value: string): boolean {
  return value === HUB_PASSWORD;
}
