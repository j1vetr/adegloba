import { randomUUID } from "node:crypto";
import sanitizeHtml from "sanitize-html";
import {
  announcementInputSchema,
  defaultAnnouncement,
  isAnnouncementScheduledNow,
  type Announcement,
  type AnnouncementInput,
} from "../../shared/announcement";

export interface AnnouncementStore {
  getSetting(key: string): Promise<{ value: string | null } | null>;
  upsertSetting(key: string, value: string, category?: string): Promise<unknown>;
}

export const ANNOUNCEMENT_KEY = "customer_announcement";
const receiptKey = (userId: string) => `announcement_read:${userId}`;
export class AnnouncementValidationError extends Error {}

export function sanitizeAnnouncementContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "hr", "code", "pre"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attribs) => ({
        tagName: "a",
        attribs: { href: attribs.href || "", target: "_blank", rel: "noopener noreferrer" },
      }),
    },
  });
}

export function prepareAnnouncement(input: AnnouncementInput, previous: Announcement): Announcement {
  const parsed = announcementInputSchema.parse(input);
  const translations = {
    tr: { title: parsed.translations.tr.title, content: sanitizeAnnouncementContent(parsed.translations.tr.content) },
    en: { title: parsed.translations.en.title, content: sanitizeAnnouncementContent(parsed.translations.en.content) },
  };
  if (parsed.enabled) {
    for (const language of ["tr", "en"] as const) {
      const { title, content } = translations[language];
      const text = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })
        .replace(/&nbsp;|&#160;|&#x[aA]0;|\u00a0|\u200b/g, " ").trim();
      if (!title || !text) {
        throw new AnnouncementValidationError(`${language === "tr" ? "Türkçe" : "İngilizce"} başlık ve içerik duyuruyu etkinleştirmek için zorunludur.`);
      }
    }
  }
  const changed = JSON.stringify(translations) !== JSON.stringify(previous.translations);
  return {
    enabled: parsed.enabled,
    displayMode: parsed.displayMode,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    translations,
    version: changed || parsed.resetSeen ? randomUUID() : previous.version,
    updatedAt: new Date().toISOString(),
  };
}

export class AnnouncementService {
  constructor(private store: AnnouncementStore) {}

  async get(): Promise<Announcement> {
    const row = await this.store.getSetting(ANNOUNCEMENT_KEY);
    if (!row?.value) return structuredClone(defaultAnnouncement);
    const value = JSON.parse(row.value);
    const parsed = announcementInputSchema.parse(value);
    if (typeof value.version !== "string" || !value.version) {
      throw new Error("Duyuru sürüm bilgisi geçersiz.");
    }
    return {
      ...parsed,
      version: value.version,
      updatedAt: value.updatedAt || null,
      translations: {
        tr: { ...parsed.translations.tr, content: sanitizeAnnouncementContent(parsed.translations.tr.content) },
        en: { ...parsed.translations.en, content: sanitizeAnnouncementContent(parsed.translations.en.content) },
      },
    };
  }

  async save(input: AnnouncementInput): Promise<Announcement> {
    const next = prepareAnnouncement(input, await this.get());
    await this.store.upsertSetting(ANNOUNCEMENT_KEY, JSON.stringify(next), "announcements");
    return next;
  }

  async forUser(userId: string, dismissedVersion?: string): Promise<Announcement | null> {
    const announcement = await this.get();
    if (!isAnnouncementScheduledNow(announcement)) return null;
    if (announcement.displayMode === "every_login" && dismissedVersion === announcement.version) return null;
    if (announcement.displayMode === "once") {
      const receipt = await this.store.getSetting(receiptKey(userId));
      if (receipt?.value === announcement.version) return null;
    }
    return announcement;
  }

  async markRead(userId: string, version: string): Promise<void> {
    await this.store.upsertSetting(receiptKey(userId), version, "announcement_receipts");
  }
}
