import type { Router } from "express";
import express from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { UserRole } from "@prisma/client";

export function platformAdminRoutes(): Router {
  const router = express.Router();

  router.use(requireAuth);

  // Require platform ADMIN role
  router.use((req, res, next) => {
    if (req.auth?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Forbidden: Platform Admin access required" });
      return;
    }
    next();
  });

  const querySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    userId: z.string().optional(),
    groupId: z.string().optional()
  });

  router.get("/identities", async (req, res, next) => {
    try {
      const query = querySchema.parse(req.query);

      const where = {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.groupId ? { groupId: query.groupId } : {})
      };

      const [logs, total] = await Promise.all([
        prisma.identityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: query.limit,
          skip: (query.page - 1) * query.limit,
          include: {
            user: { select: { id: true, anonymousName: true, role: true } },
            group: { select: { id: true, name: true, slug: true } }
          }
        }),
        prisma.identityLog.count({ where })
      ]);

      res.json({
        logs,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
