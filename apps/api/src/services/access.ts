import { MembershipStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function getApprovedMembership(userId: string, groupId: string) {
  return prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } }
  });
}

export async function assertApprovedMembership(userId: string, groupId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === UserRole.ADMIN) {
    return {
      id: "admin-bypass",
      userId,
      groupId,
      identityCommitment: "admin",
      alias: "Admin",
      status: MembershipStatus.APPROVED,
      joinedAt: new Date()
    } as any;
  }

  const membership = await getApprovedMembership(userId, groupId);
  if (!membership || membership.status !== MembershipStatus.APPROVED) {
    const error = new Error("You are not an approved member of this group.");
    error.name = "ForbiddenError";
    throw error;
  }

  return membership;
}

export async function assertGroupAdmin(userId: string, groupId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === UserRole.ADMIN) return true;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.createdById !== userId) {
    const error = new Error("Only the group creator or an administrator can perform this action.");
    error.name = "ForbiddenError";
    throw error;
  }

  return true;
}
