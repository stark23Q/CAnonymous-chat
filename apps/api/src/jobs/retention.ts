import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";

export function startRetentionSweeper() {
  const sweep = async () => {
    try {
      const result = await prisma.message.deleteMany({
        where: {
          expiresAt: {
            not: null,
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        logger.info({ deleted: result.count }, "expired messages purged");
      }
    } catch (error) {
      logger.error({ error }, "retention sweep failed");
    }
  };

  const interval = setInterval(sweep, env.RETENTION_SWEEP_INTERVAL_MS);
  void sweep();

  return () => clearInterval(interval);
}
