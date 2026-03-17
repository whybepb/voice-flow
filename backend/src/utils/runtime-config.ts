function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export function getJwtSecret(): string {
  return requireEnv("JWT_SECRET");
}

export function assertRuntimeConfig() {
  getJwtSecret();
}
