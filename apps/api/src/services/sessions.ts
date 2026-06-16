import type { Response } from "express";
import type { User, UserRole } from "@prisma/client";
import { env, isProduction } from "../config/env.js";
import { createOpaqueToken, hashToken, signAccessToken, signRefreshToken } from "../lib/crypto.js";
import { prisma } from "../lib/prisma.js";

const refreshCookie = "notrace_refresh";
const accessCookie = "notrace_access";

export async function createSession(user: Pick<User, "id" | "role">, ipAddress?: string | null) {
  const placeholder = createOpaqueToken("refresh");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(placeholder),
      expiresAt,
      ipAddress: ipAddress ?? null
    }
  });

  const payload = {
    sub: user.id,
    role: user.role as UserRole,
    sid: session.id
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.authSession.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) }
  });

  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
    expiresAt
  };
}

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  const common = {
    httpOnly: true,
    sameSite: "none" as const,
    secure: isProduction,
    path: "/"
  };

  res.cookie(accessCookie, tokens.accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000
  });
  res.cookie(refreshCookie, tokens.refreshToken, {
    ...common,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(accessCookie, { path: "/" });
  res.clearCookie(refreshCookie, { path: "/" });
}

export function refreshCookieName() {
  return refreshCookie;
}

export function isDevTokenDisclosureEnabled() {
  return env.MAGIC_LINK_DEV_MODE || env.NODE_ENV === "development";
}
