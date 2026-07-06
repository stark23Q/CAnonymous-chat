// Force Railway rebuild trigger
import http from "node:http";
import express from "express";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { configureSecurity } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { groupRoutes } from "./routes/groups.js";
import { messageRoutes } from "./routes/messages.js";
import { notificationRoutes } from "./routes/notifications.js";
import { platformAdminRoutes } from "./routes/platform-admin.js";
import { setupRealtime } from "./realtime.js";
import { startRetentionSweeper } from "./jobs/retention.js";

const app = express();
configureSecurity(app);

app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "notrace-api",
    time: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes());
app.use("/api/admin", adminRoutes());
app.use("/api/groups", groupRoutes());
app.use("/api/messages", messageRoutes());
app.use("/api/notifications", notificationRoutes());
app.use("/api/platform-admin", platformAdminRoutes());

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
const stopRetentionSweeper = startRetentionSweeper();

try {
  logger.info("Database startup migrations check bypassed (managed via prisma migrate deploy).");
} catch (dbErr) {
  logger.error({ err: dbErr }, "Database startup migrations check failed.");
}

await setupRealtime(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "NoTrace API listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  stopRetentionSweeper();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
