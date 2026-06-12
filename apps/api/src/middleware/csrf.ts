import type { NextFunction, Request, Response } from "express";
import cookie from "cookie";
import { createOpaqueToken } from "../lib/crypto.js";
import { isProduction } from "../config/env.js";

const csrfCookieName = "notrace_csrf";

export function issueCsrfToken(res: Response) {
  const token = createOpaqueToken("csrf");
  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    sameSite: "none",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60 * 1000
  });

  return token;
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const headerToken = req.header("x-csrf-token");
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const cookieToken = cookies[csrfCookieName];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    res.status(403).json({ error: "CSRF token is missing or invalid." });
    return;
  }

  return next();
}
