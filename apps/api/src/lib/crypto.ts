import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  role: "ADMIN" | "MEMBER";
  sid?: string;
};

export function createOpaqueToken(prefix = "nt"): string {
  return `${prefix}_${nanoid(48)}`;
}

export function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", env.TOKEN_HASH_SECRET)
    .update(token)
    .digest("hex");
}

export function hashLookupValue(value: string): string {
  return crypto
    .createHmac("sha256", env.TOKEN_HASH_SECRET)
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    audience: "notrace-web",
    expiresIn: "15m",
    issuer: "notrace-api"
  });
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    audience: "notrace-web",
    expiresIn: "30d",
    issuer: "notrace-api"
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    audience: "notrace-web",
    issuer: "notrace-api"
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    audience: "notrace-web",
    issuer: "notrace-api"
  }) as AccessTokenPayload;
}
