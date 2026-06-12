import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import cookie from "cookie";
import { verifyAccessToken } from "../lib/crypto.js";

function tokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  const cookies = cookie.parse(req.headers.cookie ?? "");
  return cookies.notrace_access ?? null;
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = tokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role as UserRole,
      ...(payload.sid ? { sessionId: payload.sid } : {})
    };
  } catch {
    delete req.auth;
  }

  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    next();
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== UserRole.ADMIN) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }

    next();
  });
}
