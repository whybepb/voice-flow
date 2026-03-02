import prisma from "../prisma";
import { decryptSecret, redactSecret } from "../utils/secret-crypto";

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export async function getUserOpenAIKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openaiApiKey: true },
  });
  return decryptSecret(user?.openaiApiKey);
}

export async function getUserTwilioCredentials(
  userId: string,
): Promise<TwilioCredentials | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioPhoneNumber: true,
    },
  });

  const accountSid = decryptSecret(user?.twilioAccountSid);
  const authToken = decryptSecret(user?.twilioAuthToken);
  const phoneNumber = user?.twilioPhoneNumber || null;

  if (!accountSid || !authToken || !phoneNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
  };
}

export async function getRedactedCredentialStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioPhoneNumber: true,
      openaiApiKey: true,
    },
  });

  if (!user) {
    return null;
  }

  const openaiApiKey = decryptSecret(user.openaiApiKey);
  const twilioAccountSid = decryptSecret(user.twilioAccountSid);

  return {
    hasOpenAIKey: Boolean(openaiApiKey),
    openaiKeyPreview: openaiApiKey ? redactSecret(openaiApiKey, 4, 3) : null,
    hasTwilioCredentials: Boolean(
      twilioAccountSid && user.twilioAuthToken && user.twilioPhoneNumber,
    ),
    twilioSidPreview: twilioAccountSid
      ? redactSecret(twilioAccountSid, 5, 4)
      : null,
    twilioPhoneNumber: user.twilioPhoneNumber,
  };
}
