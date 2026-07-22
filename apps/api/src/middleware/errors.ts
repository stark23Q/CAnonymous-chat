import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found." });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed.",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof Error && error.name === "ForbiddenError") {
    res.status(403).json({ error: error.message });
    return;
  }

  logger.error({ error }, "request failed");
  res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error." });
}
