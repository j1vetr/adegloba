import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { announcementInputSchema } from "../shared/announcement";
import { AnnouncementService, AnnouncementValidationError, type AnnouncementStore } from "./services/announcementService";

declare module "express-session" {
  interface SessionData {
    announcementDismissedVersion?: string;
  }
}

export function registerAnnouncementRoutes(
  app: Express,
  store: AnnouncementStore,
  isAdminAuthenticated: RequestHandler,
) {
  const service = new AnnouncementService(store);
  const noCache: RequestHandler = (_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.vary("Cookie");
    next();
  };
  const requireUser: RequestHandler = (req, res, next) => {
    if (!req.session?.userId || !req.session.isAuthenticated) {
      res.status(401).json({ message: "Oturum açmanız gerekiyor." });
      return;
    }
    next();
  };

  app.get("/api/admin/announcement", noCache, isAdminAuthenticated, async (_req, res) => {
    try {
      res.json(await service.get());
    } catch (error) {
      console.error("Error reading announcement:", error);
      res.status(500).json({ message: "Duyuru yüklenemedi." });
    }
  });

  app.put("/api/admin/announcement", noCache, isAdminAuthenticated, async (req, res) => {
    const parsed = announcementInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || "Duyuru ayarları geçersiz." });
      return;
    }
    try {
      res.json(await service.save(parsed.data));
    } catch (error) {
      if (error instanceof AnnouncementValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      console.error("Error saving announcement:", error);
      res.status(500).json({ message: "Duyuru kaydedilemedi. Lütfen tekrar deneyin." });
    }
  });

  app.get("/api/user/announcement", noCache, requireUser, async (req, res) => {
    try {
      res.json({
        announcement: await service.forUser(req.session.userId!, req.session.announcementDismissedVersion),
      });
    } catch (error) {
      console.error("Error loading customer announcement:", error);
      res.status(500).json({ message: "Duyuru yüklenemedi." });
    }
  });

  app.post("/api/user/announcement/dismiss", noCache, requireUser, async (req, res) => {
    const parsed = z.object({ version: z.string().min(1).max(100) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Duyuru sürümü geçersiz." });
      return;
    }
    try {
      const announcement = await service.get();
      if (announcement.version !== parsed.data.version) {
        res.status(409).json({ message: "Duyuru güncellendi. Lütfen tekrar okuyun." });
        return;
      }
      if (announcement.displayMode === "once") {
        await service.markRead(req.session.userId!, announcement.version);
      } else if (announcement.displayMode === "every_login") {
        req.session.announcementDismissedVersion = announcement.version;
        await new Promise<void>((resolve, reject) => {
          req.session.save(error => error ? reject(error) : resolve());
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error dismissing announcement:", error);
      res.status(500).json({ message: "Duyuru kapatılamadı. Lütfen tekrar deneyin." });
    }
  });
}
