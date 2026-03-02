import { NextFunction, Request, Response } from "express";
import twilio from "twilio";
import prisma from "../prisma";
import { decryptSecret } from "../utils/secret-crypto";
import { AppError } from "./errorHandler";

function shouldValidateTwilioSignature(): boolean {
  if (process.env.TWILIO_SIGNATURE_VALIDATION === "true") return true;
  if (process.env.TWILIO_SIGNATURE_VALIDATION === "false") return false;
  return process.env.NODE_ENV === "production";
}

function requestUrlForSignature(req: Request): string {
  const forwardedProto = req
    .header("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = req.header("x-forwarded-host")?.trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host") || "";
  return `${protocol}://${host}${req.originalUrl}`;
}

async function resolveTwilioAuthToken(req: Request): Promise<string | null> {
  const callSid = req.body?.CallSid || req.body?.callSid;
  if (callSid && typeof callSid === "string") {
    const callLog = await prisma.callLog.findUnique({
      where: { sid: callSid },
      include: {
        user: {
          select: {
            twilioAuthToken: true,
          },
        },
      },
    });

    const token = decryptSecret(callLog?.user?.twilioAuthToken);
    if (token) return token;
  }

  const possibleNumbers = [
    req.body?.To,
    req.body?.From,
    req.body?.to,
    req.body?.from,
  ]
    .filter((value): value is string => Boolean(value && typeof value === "string"))
    .map((value) => value.trim())
    .filter(Boolean);

  const dedupedNumbers = Array.from(new Set(possibleNumbers));
  for (const phoneNumber of dedupedNumbers) {
    const user = await prisma.user.findFirst({
      where: { twilioPhoneNumber: phoneNumber },
      select: { twilioAuthToken: true },
    });
    const token = decryptSecret(user?.twilioAuthToken);
    if (token) return token;
  }

  return null;
}

export async function verifyTwilioSignature(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!shouldValidateTwilioSignature()) {
      return next();
    }

    const signature = req.header("x-twilio-signature");
    if (!signature) {
      return next(new AppError("Missing Twilio signature header", 403));
    }

    const authToken = await resolveTwilioAuthToken(req);
    if (!authToken) {
      return next(
        new AppError(
          "Could not resolve Twilio auth token for signature validation",
          403,
        ),
      );
    }

    const url = requestUrlForSignature(req);
    const params =
      req.body && typeof req.body === "object" ? req.body : ({} as Record<string, string>);
    const valid = twilio.validateRequest(authToken, signature, url, params);

    if (!valid) {
      return next(new AppError("Invalid Twilio signature", 403));
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
