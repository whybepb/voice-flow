import OpenAI from "openai";
import prisma from "../prisma";
import { getUserOpenAIKey } from "./user-secrets.service";

interface PostCallAnalysis {
  summary: string;
  sentiment: string;
  actionItems: string;
}

function parseAnalysis(jsonString: string | null | undefined): PostCallAnalysis {
  const parsed = JSON.parse(jsonString || "{}") as Partial<PostCallAnalysis>;

  if (!parsed.summary || !parsed.sentiment || !parsed.actionItems) {
    throw new Error("Invalid post-call analysis response shape");
  }

  return {
    summary: parsed.summary,
    sentiment: parsed.sentiment,
    actionItems: parsed.actionItems,
  };
}

export async function runPostCallAnalysis(callSid: string): Promise<void> {
  const callLog = await prisma.callLog.findUnique({
    where: { sid: callSid },
    select: {
      id: true,
      userId: true,
      transcript: true,
    },
  });

  if (!callLog || !callLog.transcript) {
    return;
  }

  const apiKey = await getUserOpenAIKey(callLog.userId);
  if (!apiKey) {
    throw new Error("Missing user OpenAI API key for post-call analysis");
  }

  const completion = await new OpenAI({ apiKey }).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You analyze call transcripts. Extract exactly 3 fields: summary (1-2 sentences), sentiment (Positive/Neutral/Negative/etc), and actionItems (bulleted string or 'None'). Return valid JSON only.",
      },
      { role: "user", content: `Transcript:\n${callLog.transcript}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "post_call_analysis",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            sentiment: { type: "string" },
            actionItems: { type: "string" },
          },
          required: ["summary", "sentiment", "actionItems"],
        },
      },
    },
  });

  const analysis = parseAnalysis(completion.choices[0]?.message?.content);

  await prisma.callLog.update({
    where: { id: callLog.id },
    data: {
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      actionItems: analysis.actionItems,
    },
  });
}
