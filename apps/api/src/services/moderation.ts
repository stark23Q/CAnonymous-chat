import { ModerationStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const toxicTerms = ["dox", "swat", "kill yourself", "real address", "phone number"];

export type ModerationResult = {
  status: ModerationStatus;
  reason?: string;
};

export async function moderateMessage(content: string | null): Promise<ModerationResult> {
  if (!content) {
    return { status: ModerationStatus.CLEAN };
  }

  const lowered = content.toLowerCase();
  const localHit = toxicTerms.find((term) => lowered.includes(term));
  if (localHit) {
    return { status: ModerationStatus.FLAGGED, reason: `Local policy match: ${localHit}` };
  }

  if (!env.MODERATION_WEBHOOK_URL) {
    return { status: ModerationStatus.CLEAN };
  }

  try {
    const response = await fetch(env.MODERATION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.MODERATION_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.MODERATION_WEBHOOK_TOKEN}` } : {})
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, "moderation webhook returned non-2xx");
      return { status: ModerationStatus.CLEAN };
    }

    const result = (await response.json()) as Partial<ModerationResult>;
    if (result.status === ModerationStatus.BLOCKED || result.status === ModerationStatus.FLAGGED) {
      return {
        status: result.status,
        reason: result.reason ?? "External moderation decision"
      };
    }
  } catch (error) {
    logger.warn({ error }, "moderation webhook failed");
  }

  return { status: ModerationStatus.CLEAN };
}
