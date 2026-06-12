import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { env } from "../config/env.js";

export const allowedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "application/pdf"
]);

const emojiPattern = /^\p{Extended_Pictographic}[\p{Extended_Pictographic}\uFE0F\u200D]*$/u;

export function sanitizeText(input: string, maxLength = 4_000): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\u0000/g, "")
    .slice(0, maxLength)
    .trim();
}

export function sanitizeOptionalText(input: string | null | undefined, maxLength = 4_000): string | null {
  if (!input) {
    return null;
  }

  const value = sanitizeText(input, maxLength);
  return value.length > 0 ? value : null;
}

export function validateEmoji(input: string): string {
  const emoji = input.trim();
  if (!emojiPattern.test(emoji) || emoji.length > 32) {
    throw new Error("Unsupported reaction emoji.");
  }

  return emoji;
}

export const mediaUploadSchema = z.object({
  groupId: z.string().min(1),
  channelId: z.string().min(1).optional(),
  filename: z.string().min(1).max(180),
  contentType: z.string().refine((value) => allowedMediaTypes.has(value), "Unsupported file type."),
  size: z.number().int().positive().max(env.MAX_UPLOAD_BYTES)
});
