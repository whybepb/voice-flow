import dotenv from "dotenv";
dotenv.config();

import prisma from "../prisma";
import {
  assertSecretEncryptionConfigured,
  encryptSecret,
  isEncryptedSecret,
} from "../utils/secret-crypto";

async function main() {
  assertSecretEncryptionConfigured();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      openaiApiKey: true,
      twilioAccountSid: true,
      twilioAuthToken: true,
    },
  });

  let updated = 0;
  for (const user of users) {
    const nextOpenAI =
      user.openaiApiKey && !isEncryptedSecret(user.openaiApiKey)
        ? encryptSecret(user.openaiApiKey)
        : user.openaiApiKey;
    const nextTwilioSid =
      user.twilioAccountSid && !isEncryptedSecret(user.twilioAccountSid)
        ? encryptSecret(user.twilioAccountSid)
        : user.twilioAccountSid;
    const nextTwilioToken =
      user.twilioAuthToken && !isEncryptedSecret(user.twilioAuthToken)
        ? encryptSecret(user.twilioAuthToken)
        : user.twilioAuthToken;

    const changed =
      nextOpenAI !== user.openaiApiKey ||
      nextTwilioSid !== user.twilioAccountSid ||
      nextTwilioToken !== user.twilioAuthToken;

    if (!changed) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        openaiApiKey: nextOpenAI,
        twilioAccountSid: nextTwilioSid,
        twilioAuthToken: nextTwilioToken,
      },
    });
    updated++;
  }

  console.log(`[Secrets] Re-encrypted credentials for ${updated} user(s).`);
}

main()
  .catch((error) => {
    console.error("[Secrets] Failed to re-encrypt existing credentials:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
