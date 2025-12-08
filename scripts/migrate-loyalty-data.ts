/**
 * Sadakat Sistemi Geçmiş Veri Aktarım Scripti
 * 
 * Bu script, mevcut siparişlerden kullanıcıların bu ayki GB alımlarını hesaplar
 * ve loyalty_discount_percent alanını günceller.
 * 
 * KULLANIM:
 * DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx tsx scripts/migrate-loyalty-data.ts
 */

import pg from 'pg';
const { Pool } = pg;

const LOYALTY_TIERS = [
  { minGb: 100, discountPercent: 15 },
  { minGb: 50, discountPercent: 10 },
  { minGb: 25, discountPercent: 5 },
  { minGb: 0, discountPercent: 0 }
];

function calculateDiscount(totalGb: number): number {
  for (const tier of LOYALTY_TIERS) {
    if (totalGb >= tier.minGb) {
      return tier.discountPercent;
    }
  }
  return 0;
}

async function migrateLoyaltyData() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    console.log('🚀 Sadakat verisi aktarımı başlatılıyor...\n');
    
    // Bu ayın başlangıç ve bitiş tarihleri
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    console.log(`📅 Tarih aralığı: ${startOfMonth.toISOString()} - ${endOfMonth.toISOString()}\n`);
    
    // Bu ay içinde tamamlanmış siparişleri kullanıcı bazında grupla
    // order_items tablosunda qty ve planId var, plans tablosundan data_limit_gb alınıyor
    const query = `
      SELECT 
        o.user_id,
        u.username,
        u.email,
        SUM(p.data_limit_gb * oi.qty) as total_gb
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN plans p ON oi.plan_id = p.id
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'paid'
        AND o.paid_at >= $1
        AND o.paid_at <= $2
      GROUP BY o.user_id, u.username, u.email
      ORDER BY total_gb DESC
    `;
    
    const result = await pool.query(query, [startOfMonth.toISOString(), endOfMonth.toISOString()]);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  Bu ay için işlenecek sipariş bulunamadı.\n');
      console.log('✅ Tüm kullanıcılar 0 GB ile başlayacak.\n');
      return;
    }
    
    console.log(`📊 ${result.rows.length} kullanıcı için veri bulundu:\n`);
    console.log('─'.repeat(60));
    console.log('| Kullanıcı'.padEnd(25) + '| GB'.padEnd(10) + '| İndirim'.padEnd(12) + '|');
    console.log('─'.repeat(60));
    
    let updatedCount = 0;
    
    for (const row of result.rows) {
      const totalGb = parseInt(row.total_gb) || 0;
      const discountPercent = calculateDiscount(totalGb);
      
      console.log(`| ${row.username.substring(0, 22).padEnd(23)}| ${totalGb.toString().padEnd(8)}| %${discountPercent.toString().padEnd(9)}|`);
      
      // Kullanıcının loyalty verilerini güncelle
      await pool.query(`
        UPDATE users 
        SET 
          monthly_data_gb = $1,
          loyalty_discount_percent = $2,
          loyalty_month_start = $3
        WHERE id = $4
      `, [totalGb, discountPercent, startOfMonth.toISOString(), row.user_id]);
      
      updatedCount++;
    }
    
    console.log('─'.repeat(60));
    console.log(`\n✅ ${updatedCount} kullanıcı başarıyla güncellendi!\n`);
    
    // Özet istatistikler
    const stats = {
      tier15: result.rows.filter(r => parseInt(r.total_gb) >= 100).length,
      tier10: result.rows.filter(r => parseInt(r.total_gb) >= 50 && parseInt(r.total_gb) < 100).length,
      tier5: result.rows.filter(r => parseInt(r.total_gb) >= 25 && parseInt(r.total_gb) < 50).length,
      noDiscount: result.rows.filter(r => parseInt(r.total_gb) < 25).length
    };
    
    console.log('📈 İndirim Dağılımı:');
    console.log(`   • %15 indirim (100+ GB): ${stats.tier15} kullanıcı`);
    console.log(`   • %10 indirim (50-99 GB): ${stats.tier10} kullanıcı`);
    console.log(`   • %5 indirim (25-49 GB): ${stats.tier5} kullanıcı`);
    console.log(`   • İndirim yok (0-24 GB): ${stats.noDiscount} kullanıcı`);
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔒 Veritabanı bağlantısı kapatıldı.');
  }
}

migrateLoyaltyData();
