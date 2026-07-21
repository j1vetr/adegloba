import { db } from './db';
import {
  settings, emailSettings, admin_users, ships, plans, users,
  coupons, credentialPools, orders, orderItems, orderCredentials,
  cartItems, couponUsage, tickets, ticketMessages, ticketAttachments,
  emailTemplates, emailCampaigns, emailLogs, systemLogs,
  pushSubscriptions, userSegments, errorLogs, systemMetrics,
} from '@shared/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const BACKUPS_DIR = './backups';

// Tables in insert order (children after parents)
const TABLE_ORDER = [
  'settings',
  'email_settings',
  'admin_users',
  'ships',
  'plans',
  'email_templates',
  'email_campaigns',
  'users',
  'coupons',
  'credential_pools',
  'orders',
  'order_items',
  'order_credentials',
  'cart_items',
  'coupon_usage',
  'tickets',
  'ticket_messages',
  'ticket_attachments',
  'email_logs',
  'system_logs',
  'push_subscriptions',
  'user_segments',
  'error_logs',
  'system_metrics',
] as const;

const TABLE_MAP: Record<string, any> = {
  settings,
  email_settings:      emailSettings,
  admin_users,
  ships,
  plans,
  users,
  coupons,
  credential_pools:    credentialPools,
  orders,
  order_items:         orderItems,
  order_credentials:   orderCredentials,
  cart_items:          cartItems,
  coupon_usage:        couponUsage,
  tickets,
  ticket_messages:     ticketMessages,
  ticket_attachments:  ticketAttachments,
  email_templates:     emailTemplates,
  email_campaigns:     emailCampaigns,
  email_logs:          emailLogs,
  system_logs:         systemLogs,
  push_subscriptions:  pushSubscriptions,
  user_segments:       userSegments,
  error_logs:          errorLogs,
  system_metrics:      systemMetrics,
};

export interface BackupMeta {
  filename:  string;
  size:      number;
  createdAt: string;
  rowCount?: number;
  version?:  string;
}

export async function createBackup(): Promise<BackupMeta> {
  await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });

  const tableData: Record<string, any[]> = {};
  let totalRows = 0;

  for (const key of TABLE_ORDER) {
    const rows = await db.select().from(TABLE_MAP[key]);
    tableData[key] = rows;
    totalRows += rows.length;
  }

  const payload = {
    version:   '2.0',
    createdAt: new Date().toISOString(),
    rowCount:  totalRows,
    tables:    tableData,
  };

  const ts       = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
  const filename = `yedek_${ts}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  await fs.promises.writeFile(filePath, JSON.stringify(payload));
  const stats = await fs.promises.stat(filePath);

  return { filename, size: stats.size, createdAt: payload.createdAt, rowCount: totalRows, version: '2.0' };
}

export async function restoreBackup(filename: string): Promise<{ tablesRestored: number; rowsRestored: number }> {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Geçersiz dosya adı');
  }

  const filePath = path.join(BACKUPS_DIR, filename);
  const content  = await fs.promises.readFile(filePath, 'utf-8');
  const backup   = JSON.parse(content);

  if (!backup.tables || !backup.version) {
    throw new Error('Geçersiz yedek dosyası formatı (version/tables eksik)');
  }

  // Clear all tables in reverse dependency order with CASCADE
  await db.execute(sql`
    TRUNCATE TABLE
      system_metrics, error_logs, user_segments, push_subscriptions,
      system_logs, email_logs, email_campaigns, email_templates,
      ticket_attachments, ticket_messages, tickets,
      coupon_usage, cart_items, order_credentials, order_items, orders,
      credential_pools, coupons, users, plans, ships, admin_users,
      email_settings, settings
    CASCADE
  `);

  let tablesRestored = 0;
  let rowsRestored   = 0;

  // Insert in forward dependency order
  for (const key of TABLE_ORDER) {
    const rows = backup.tables[key];
    if (!rows || rows.length === 0) { tablesRestored++; continue; }

    const table = TABLE_MAP[key];
    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
      await db.insert(table).values(rows.slice(i, i + batchSize)).onConflictDoNothing();
    }

    tablesRestored++;
    rowsRestored += rows.length;
  }

  return { tablesRestored, rowsRestored };
}

export async function listBackups(): Promise<BackupMeta[]> {
  await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });

  let files: string[];
  try { files = await fs.promises.readdir(BACKUPS_DIR); }
  catch { return []; }

  const backupFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.sql'));

  const metas = await Promise.all(backupFiles.map(async (filename) => {
    const filePath = path.join(BACKUPS_DIR, filename);
    const stats    = await fs.promises.stat(filePath);

    let rowCount: number | undefined;
    let version:  string | undefined;

    if (filename.endsWith('.json')) {
      try {
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        rowCount = data.rowCount;
        version  = data.version;
      } catch { /* skip if unreadable */ }
    } else {
      version = '1.0 (pg_dump)';
    }

    return { filename, size: stats.size, createdAt: stats.mtime.toISOString(), rowCount, version };
  }));

  return metas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteBackup(filename: string): Promise<void> {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Geçersiz dosya adı');
  }
  await fs.promises.unlink(path.join(BACKUPS_DIR, filename));
}
