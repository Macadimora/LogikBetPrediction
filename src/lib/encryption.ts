import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const encodedKey =
    process.env.INTEGRATION_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY is not configured."
    );
  }

  const key =
    Buffer.from(
      encodedKey,
      "base64"
    );

  if (key.length !== 32) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must be a 32-byte base64 key."
    );
  }

  return key;
}

export function encryptSecret(
  value: string
) {
  const key =
    getEncryptionKey();

  const iv =
    crypto.randomBytes(12);

  const cipher =
    crypto.createCipheriv(
      ALGORITHM,
      key,
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        value,
        "utf8"
      ),
      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(
  encryptedValue: string
) {
  const parts =
    encryptedValue.split(".");

  if (parts.length !== 3) {
    throw new Error(
      "Encrypted secret has an invalid format."
    );
  }

  const [
    ivPart,
    authTagPart,
    encryptedPart,
  ] = parts;

  const iv =
    Buffer.from(
      ivPart,
      "base64url"
    );

  const authTag =
    Buffer.from(
      authTagPart,
      "base64url"
    );

  const encrypted =
    Buffer.from(
      encryptedPart,
      "base64url"
    );

  const decipher =
    crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      iv
    );

  decipher.setAuthTag(
    authTag
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted
      ),
      decipher.final(),
    ]);

  return decrypted.toString(
    "utf8"
  );
}

export function isEncryptedSecret(
  value: string
) {
  const parts =
    value.split(".");

  return parts.length === 3;
}
