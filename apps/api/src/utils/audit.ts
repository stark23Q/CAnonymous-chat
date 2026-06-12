import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function audit(input: {
  actorId?: string | undefined;
  groupId?: string | undefined;
  action: string;
  targetId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    action: input.action,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.groupId ? { groupId: input.groupId } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {})
  };

  await prisma.auditLog.create({
    data
  });
}
