import type { Express } from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import type { IncomingMessage } from "node:http";
import { env, isProduction } from "../config/env.js";
import { logger } from "../lib/logger.js";

export function configureSecurity(app: Express) {
  app.set("trust proxy", isProduction ? 1 : false);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false
    })
  );
  app.use(hpp());
  app.use(compression());
  app.use(
    cors({
      origin: isProduction 
        ? env.APP_ORIGIN 
        : [env.APP_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    })
  );
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === "/healthz"
      }
    })
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Too many requests. Slow down and try again." }
    })
  );
}
