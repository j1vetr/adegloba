import { z } from "zod";

const translationSchema = z.object({
  title: z.string().trim().max(160, "Başlık en fazla 160 karakter olabilir."),
  content: z.string().max(30000, "İçerik en fazla 30.000 karakter olabilir."),
});

export const announcementInputSchema = z.object({
  enabled: z.boolean(),
  displayMode: z.enum(["every_login", "always", "once"]),
  startsAt: z.string().datetime({ offset: true }).nullable(),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  translations: z.object({ tr: translationSchema, en: translationSchema }),
  resetSeen: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (value.startsAt && value.endsAt && new Date(value.startsAt) >= new Date(value.endsAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır." });
  }
});

export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
export type Announcement = Omit<AnnouncementInput, "resetSeen"> & {
  version: string;
  updatedAt: string | null;
};
export type AnnouncementLanguage = "tr" | "en";
export const defaultAnnouncement: Announcement = {
  enabled: false,
  displayMode: "every_login",
  startsAt: null,
  endsAt: null,
  translations: {
    tr: { title: "", content: "" },
    en: { title: "", content: "" },
  },
  version: "initial",
  updatedAt: null,
};

export function isAnnouncementScheduledNow(announcement: Announcement, now = new Date()): boolean {
  return announcement.enabled
    && (!announcement.startsAt || new Date(announcement.startsAt) <= now)
    && (!announcement.endsAt || new Date(announcement.endsAt) > now);
}
