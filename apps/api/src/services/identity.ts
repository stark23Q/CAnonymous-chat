import { prisma } from "../lib/prisma.js";
import { createPseudonym } from "./pseudonyms.js";

export async function createUniqueMembershipIdentity(groupId: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const identity = createPseudonym();
    const existing = await prisma.membership.findUnique({
      where: {
        groupId_anonymousName: {
          groupId,
          anonymousName: identity.anonymousName
        }
      }
    });

    if (!existing) {
      return identity;
    }
  }

  throw new Error("Could not allocate anonymous name.");
}

export function normalizeRequestedAlias(alias?: string | null) {
  if (!alias) {
    return null;
  }

  return alias.replace(/[^a-z0-9]/gi, "").slice(0, 24) || null;
}
