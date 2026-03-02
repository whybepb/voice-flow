import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ENCRYPTION_PREFIX = "enc:v1:";
const ENCRYPTION_ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const FALLBACK_REDACT = "********";

let warnedMissingKey = false;

function isPlaintextFallbackAllowed() {
  return (
    process.env.ALLOW_PLAINTEXT_SECRETS === "true" ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  );
}

export function assertSecretEncryptionConfigured() {
  if (!process.env.SECRET_ENCRYPTION_KEY && !isPlaintextFallbackAllowed()) {
    throw new Error(
      "SECRET_ENCRYPTION_KEY is required. Set SECRET_ENCRYPTION_KEY for encrypted secret storage.",
    );
  }
}

function getEncryptionKey(): Buffer | null {
  const rawKey = process.env.SECRET_ENCRYPTION_KEY;
  if (!rawKey) {
    if (!isPlaintextFallbackAllowed()) {
      throw new Error(
        "SECRET_ENCRYPTION_KEY is required. Refusing plaintext secret storage.",
      );
    }

    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[Secrets] SECRET_ENCRYPTION_KEY is not set. Plaintext fallback is enabled for non-production usage.",
      );
    }
    return null;
  }

  if (/^[a-f0-9]{64}$/i.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  try {
    const decoded = Buffer.from(rawKey, "base64");
    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    // Ignore base64 parsing failure and use hash fallback.
  }

  // Keep support simple: derive a fixed 32-byte key from arbitrary input.
  return createHash("sha256").update(rawKey).digest();
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(ENCRYPTION_PREFIX));
}

export function encryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isEncryptedSecret(value)) return value;

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGO, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, ciphertext]).toString("base64");

  return `${ENCRYPTION_PREFIX}${payload}`;
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;

  // Legacy/plaintext support.
  if (!isEncryptedSecret(value)) return value;

  const key = getEncryptionKey();
  if (!key) {
    return null;
  }

  try {
    const encoded = value.slice(ENCRYPTION_PREFIX.length);
    const payload = Buffer.from(encoded, "base64");

    if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ENCRYPTION_ALGO, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}

export function redactSecret(
  value: string | null | undefined,
  visiblePrefix = 3,
  visibleSuffix = 3,
): string {
  if (!value) return FALLBACK_REDACT;
  if (value.length <= visiblePrefix + visibleSuffix) return FALLBACK_REDACT;

  return `${value.slice(0, visiblePrefix)}${FALLBACK_REDACT}${value.slice(-visibleSuffix)}`;
}
