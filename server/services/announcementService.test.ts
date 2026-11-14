import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import {
  announcementInputSchema, defaultAnnouncement, isAnnouncementScheduledNow,
  type AnnouncementInput,
} from "../../shared/announcement";
import {
  AnnouncementService, prepareAnnouncement, sanitizeAnnouncementContent,
  type AnnouncementStore,
} from "./announcementService";
import { registerAnnouncementRoutes } from "../announcementRoutes";

class MemoryStore implements AnnouncementStore {
  rows = new Map<string, string>();
  async getSetting(key: string) {
    return this.rows.has(key) ? { value: this.rows.get(key)! } : null;
  }
  async upsertSetting(key: string, value: string) {
    this.rows.set(key, value);
  }
}

function input(overrides: Partial<AnnouncementInput> = {}): AnnouncementInput {
  return {
    ...structuredClone(defaultAnnouncement),
    enabled: true,
    translations: {
      tr: { title: "Önemli Duyuru", content: "<p><strong>Yeni</strong> paketler hazır.</p>" },
      en: { title: "Important Announcement", content: "<p><em>New</em> packages are ready.</p>" },
    },
    ...overrides,
  };
}

test("new installations default to a disabled draft without a database migration", async () => {
  const service = new AnnouncementService(new MemoryStore());
  assert.deepEqual(await service.get(), defaultAnnouncement);
  assert.equal(await service.forUser("one"), null);
});

test("both languages and formatting survive persistent save/load", async () => {
  const store = new MemoryStore();
  const saved = await new AnnouncementService(store).save(input());
  const loaded = await new AnnouncementService(store).get();
  assert.deepEqual(loaded, saved);
  assert.match(loaded.translations.tr.content, /<strong>Yeni<\/strong>/);
  assert.equal(loaded.translations.en.title, "Important Announcement");
});

test("script, event handlers, frames, style and dangerous links are stripped", () => {
  const clean = sanitizeAnnouncementContent('<p onclick="evil()" style="color:red">Hi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><img src=x onerror=evil()><a href="javascript:alert(1)">bad</a><a href="//evil.test">relative</a><a href="https://example.com" onclick="evil()">ok</a>');
  assert.doesNotMatch(clean, /<script|<iframe|<img|onclick|onerror|style=|javascript:|href="\/\//);
  assert.match(clean, /href="https:\/\/example.com"/);
  assert.match(clean, /rel="noopener noreferrer"/);
});

test("enabled publication requires meaningful title and body in both languages", () => {
  for (const content of ["", "<p><br></p>", "<p>&nbsp;</p>", "<script>bad()</script>"]) {
    const data = input();
    data.translations.en.content = content;
    assert.throws(() => prepareAnnouncement(data, defaultAnnouncement), /İngilizce/);
  }
  const data = input();
  data.translations.tr.title = " ";
  assert.throws(() => prepareAnnouncement(data, defaultAnnouncement), /Türkçe/);
  assert.doesNotThrow(() => prepareAnnouncement(input({ enabled: false, translations: defaultAnnouncement.translations }), defaultAnnouncement));
});

test("invalid mode, oversized content, invalid dates and reversed schedule are rejected", () => {
  assert.equal(announcementInputSchema.safeParse(input({ displayMode: "invalid" as any })).success, false);
  assert.equal(announcementInputSchema.safeParse(input({ startsAt: "tomorrow" })).success, false);
  assert.equal(announcementInputSchema.safeParse(input({ startsAt: "2026-12-02T00:00:00Z", endsAt: "2026-12-01T00:00:00Z" })).success, false);
  const data = input();
  data.translations.tr.content = "x".repeat(30001);
  assert.equal(announcementInputSchema.safeParse(data).success, false);
});

test("schedule uses inclusive start and exclusive end in absolute time", () => {
  const announcement = prepareAnnouncement(input({
    startsAt: "2026-12-01T12:00:00+03:00", endsAt: "2026-12-01T13:00:00+03:00",
  }), defaultAnnouncement);
  assert.equal(isAnnouncementScheduledNow(announcement, new Date("2026-12-01T08:59:59Z")), false);
  assert.equal(isAnnouncementScheduledNow(announcement, new Date("2026-12-01T09:00:00Z")), true);
  assert.equal(isAnnouncementScheduledNow(announcement, new Date("2026-12-01T10:00:00Z")), false);
  assert.equal(isAnnouncementScheduledNow({ ...announcement, enabled: false }, new Date("2026-12-01T09:30:00Z")), false);
});

test("every login is suppressed only in the acknowledged session", async () => {
  const service = new AnnouncementService(new MemoryStore());
  const announcement = await service.save(input({ displayMode: "every_login" }));
  assert.ok(await service.forUser("one"));
  assert.equal(await service.forUser("one", announcement.version), null);
  assert.ok(await service.forUser("one", "previous-version"));
  assert.ok(await service.forUser("two"));
});

test("always mode ignores persistent and session read state", async () => {
  const service = new AnnouncementService(new MemoryStore());
  const announcement = await service.save(input({ displayMode: "always" }));
  await service.markRead("one", announcement.version);
  assert.ok(await service.forUser("one", announcement.version));
});

test("once mode is per-account and survives new service instances", async () => {
  const store = new MemoryStore();
  const service = new AnnouncementService(store);
  const announcement = await service.save(input({ displayMode: "once" }));
  await service.markRead("one", announcement.version);
  assert.equal(await new AnnouncementService(store).forUser("one"), null);
  assert.ok(await service.forUser("two"));
});

test("content edits and republish reset read state but settings-only saves do not", async () => {
  const service = new AnnouncementService(new MemoryStore());
  const first = await service.save(input({ displayMode: "once" }));
  await service.markRead("one", first.version);
  const same = await service.save(input({ displayMode: "once", endsAt: "2099-12-01T00:00:00Z" }));
  assert.equal(same.version, first.version);
  assert.equal(await service.forUser("one"), null);
  const changedInput = input({ displayMode: "once" });
  changedInput.translations.tr.title = "Güncel Duyuru";
  const edited = await service.save(changedInput);
  assert.notEqual(edited.version, first.version);
  assert.ok(await service.forUser("one"));
  await service.markRead("one", edited.version);
  const republished = await service.save({ ...changedInput, resetSeen: true });
  assert.notEqual(republished.version, edited.version);
  assert.ok(await service.forUser("one"));
});

test("future and expired announcements are not delivered", async () => {
  const service = new AnnouncementService(new MemoryStore());
  await service.save(input({ startsAt: "2099-01-01T00:00:00Z" }));
  assert.equal(await service.forUser("one"), null);
  await service.save(input({ endsAt: "2020-01-01T00:00:00Z" }));
  assert.equal(await service.forUser("one"), null);
});

test("invalid persisted data fails explicitly instead of presenting a fake empty draft", async () => {
  const store = new MemoryStore();
  store.rows.set("customer_announcement", "{invalid");
  await assert.rejects(new AnnouncementService(store).get());
});

test("HTTP routes enforce authentication, validation, receipts and stale versions", async () => {
  const store = new MemoryStore();
  const app = express();
  app.use(express.json());
  const sessions = new Map<string, any>();
  // Isolated test app only. The real app's auth is never bypassed or modified.
  app.use((req, _res, next) => {
    const testUser = req.header("x-test-user");
    if (testUser) {
      if (!sessions.has(testUser)) sessions.set(testUser, {
        userId: testUser, isAuthenticated: true,
        save: (callback: (error?: Error) => void) => callback(),
      });
      (req as any).session = sessions.get(testUser);
    }
    next();
  });
  registerAnnouncementRoutes(app, store, (req, res, next) => {
    if (req.header("x-test-admin") === "yes") next();
    else res.status(401).json({ message: "Unauthorized" });
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const request = (path: string, init?: RequestInit) => fetch(`${base}${path}`, init);
  const adminHeaders = { "Content-Type": "application/json", "x-test-admin": "yes" };
  const userHeaders = { "Content-Type": "application/json", "x-test-user": "one" };
  try {
    assert.equal((await request("/api/admin/announcement")).status, 401);
    assert.equal((await request("/api/user/announcement")).status, 401);
    assert.equal((await request("/api/user/announcement/dismiss", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"version":"x"}' })).status, 401);
    assert.equal((await request("/api/admin/announcement", { method: "PUT", headers: userHeaders, body: JSON.stringify(input()) })).status, 401);
    assert.equal((await request("/api/admin/announcement", { method: "PUT", headers: adminHeaders, body: "{}" })).status, 400);
    const invalid = input();
    invalid.translations.en.content = "<p></p>";
    assert.equal((await request("/api/admin/announcement", { method: "PUT", headers: adminHeaders, body: JSON.stringify(invalid) })).status, 400);
    let response = await request("/api/admin/announcement", { method: "PUT", headers: adminHeaders, body: JSON.stringify(input()) });
    assert.equal(response.status, 200);
    const saved = await response.json() as any;
    response = await request("/api/user/announcement", { headers: userHeaders });
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.ok(response.headers.get("Vary")?.includes("Cookie"));
    assert.equal(((await response.json()) as any).announcement.version, saved.version);
    assert.equal((await request("/api/user/announcement/dismiss", { method: "POST", headers: userHeaders, body: '{"version":"outdated"}' })).status, 409);
    assert.equal((await request("/api/user/announcement/dismiss", { method: "POST", headers: userHeaders, body: JSON.stringify({ version: saved.version }) })).status, 200);
    assert.equal(((await (await request("/api/user/announcement", { headers: userHeaders })).json()) as any).announcement, null);
    const other = await request("/api/user/announcement", { headers: { "x-test-user": "two" } });
    assert.ok(((await other.json()) as any).announcement);
    response = await request("/api/admin/announcement", { method: "PUT", headers: adminHeaders, body: JSON.stringify(input({ displayMode: "once" })) });
    const once = await response.json() as any;
    await request("/api/user/announcement/dismiss", { method: "POST", headers: userHeaders, body: JSON.stringify({ version: once.version }) });
    sessions.delete("one");
    assert.equal(((await (await request("/api/user/announcement", { headers: userHeaders })).json()) as any).announcement, null);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
