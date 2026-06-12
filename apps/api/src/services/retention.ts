import { RetentionPolicy } from "@prisma/client";

export function expiresAtForPolicy(policy: RetentionPolicy, from = new Date()): Date | null {
  const expiresAt = new Date(from);

  switch (policy) {
    case RetentionPolicy.HOURS_24:
      expiresAt.setHours(expiresAt.getHours() + 24);
      return expiresAt;
    case RetentionPolicy.DAYS_7:
      expiresAt.setDate(expiresAt.getDate() + 7);
      return expiresAt;
    case RetentionPolicy.DAYS_30:
      expiresAt.setDate(expiresAt.getDate() + 30);
      return expiresAt;
    case RetentionPolicy.NEVER:
      return null;
    default:
      return expiresAt;
  }
}
