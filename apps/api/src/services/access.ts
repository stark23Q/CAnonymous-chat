import { MembershipStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function getApprovedMembership(userId: string, groupId: string) {
  return prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } }
  });
}

export async function assertApprovedMembership(userId: string, groupId: string) {
  const membership = await getApprovedMembership(userId, groupId);
  if (!membership || membership.status !== MembershipStatus.APPROVED) {
    const error = new Error("You are not an approved member of this group.");
    error.name = "ForbiddenError";
    throw error;
  }

  return membership;
}
