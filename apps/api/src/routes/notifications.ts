import express, { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import webpush from "web-push";
import { z } from "zod";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "public_key_here";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "private_key_here";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:test@test.com";

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} catch (err) {
  console.warn("Push notifications disabled: Invalid or missing VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your environment.");
}

export function notificationRoutes(): Router {
  const router = express.Router();

  const subscribeSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  });

  router.get("/vapid-public-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  router.post("/subscribe", requireAuth, async (req, res, next) => {
    try {
      const { endpoint, keys } = subscribeSchema.parse(req.body);
      const userId = req.auth!.userId;

      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint
          }
        },
        update: {
          auth: keys.auth,
          p256dh: keys.p256dh
        },
        create: {
          userId,
          endpoint,
          auth: keys.auth,
          p256dh: keys.p256dh
        }
      });

      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/unsubscribe", requireAuth, async (req, res, next) => {
    try {
      const endpoint = req.body.endpoint;
      const userId = req.auth!.userId;
      if (!endpoint) {
        res.status(400).json({ error: "Endpoint is required" });
        return;
      }

      await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint
        }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
