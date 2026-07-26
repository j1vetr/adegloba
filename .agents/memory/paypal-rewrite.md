---
name: PayPal 7-Phase Rewrite
description: Full rewrite of PayPal backend/frontend — prevents users being charged without receiving packages.
---

## Problem
Users were successfully charged (confirmed via PayPal dashboard) but never received packages.

## Root Causes Fixed

| Faz | Sorun | Düzeltme |
|-----|-------|---------|
| 1 | `paypalOrderId` DB'ye sadece `/complete-payment` anında yazılıyordu; webhook bunu bulamıyordu | `create-order` anında `customId=dbOrderId` (PayPal'a) + `storage.updateOrder()` ile erken link |
| 2 | Frontend ayrıca `/capture-order`, sonra `/complete-payment` çağırıyordu — aralarında bağlantı kopunca para alındı ama paket yok | `complete-payment` tek endpoint'te hem capture hem fulfill yapıyor; PayPalButton ayrı capture çağrısını kaldırdı |
| 3 | `withPaypalCredentials` mutex `process.env`'i mutate ediyordu; race condition ve bottleneck | Mutex tamamen kaldırıldı; `createPayPalClient()` her çağrıda DB'den okur |
| 4 | Auto-cancel 30dk paypalOrderId'siz siparişleri iptal ediyordu; ama 3DS/OTP akışlarında yavaş tamamlanan siparişler de gidiyordu | paypalOrderId olan siparişler için ayrı 2 saatlik kural eklendi |
| 5 | Webhook imza doğrulaması sadece header varlığını kontrol ediyordu | `verifyPayPalWebhookSig()` PayPal REST API üzerinden gerçek kriptografik doğrulama yapıyor; admin panelinde `paypalWebhookId` alanı eklendi |
| 6 | `processPaymentCompletion` tek transaction'da `paid` + credential atama yapıyordu; credential stoku yoksa transaction rollback edince sipariş `paid` olmuyordu | İki ayrı transaction: Faz A (paid + cart clear, her zaman commit), Faz B (credential atama, stok yoksa admin alert, fixIncompletePaidOrders retry) |
| 7 | Webhook `paypalOrderId` ile arama yapıyordu, o da henüz yazılmamış olabiliyordu; "deferred" döndürüyordu | Webhook `custom_id` (DB order ID) ile önce arar, sonra `paypalOrderId` fallback; bulamazsa admin log (orphan) |

## Değiştirilen Dosyalar
- `server/paypal.ts` — `dbOrderId` + `customId` desteği
- `server/routes.ts` — mutex kaldırma, create-order erken link, register-paypal-order dead code, complete-payment yeniden yazma, webhook Faz5+7
- `server/services/orderService.ts` — `processPaymentCompletion` iki fazlı yaklaşım
- `server/services/orderCancelService.ts` — 2 saatlik kural + `isNotNull` import
- `client/src/components/PayPalButton.tsx` — capture kaldırıldı, dbOrderId eklendi, STEPS güncellendi
- `client/src/pages/admin/AdminSettings.tsx` — `paypalWebhookId` alanı

## "No pending order found" fix (session 4)
Hata: Para çekilip sipariş iptal statüsüne düşüyordu.
Kök neden: Auto-cancel servisi 30 dk `paypalOrderId`'siz siparişi iptal ediyor. Ödeme geç gelince `complete-payment` pending sipariş bulamıyor. Recovery yalnızca `o.paypalOrderId === paypalOrderId` eşleşmesi arıyordu — iptal öncesi link yapılamamışsa null ≠ gerçek ID → recovery de başarısız.
Düzeltmeler:
1. `complete-payment` recovery: `(o.paypalOrderId === paypalOrderId || !o.paypalOrderId)` — auto-cancel kurbanı sipariş de bulunuyor, bulununca paypalOrderId yazılıyor. Pencere 1h → 2h.
2. `processPaymentCompletion` Phase 1: `status === 'cancelled'` artık izin veriliyor (reactivation). Webhook da aynı fonksiyonu kullandığı için otomatik düzeltildi.

## Full End-to-End Audit (session 3)
Tüm sipariş adımları denetlendi. Sadece 1 gerçek bug bulundu:
- **Kupon çift kayıt**: `validateCoupon` yalnızca `status='paid'` siparişleri sayar. Checkout'ta `recordCouponUsage` kaydı oluşturulur (sipariş `pending`). `complete-payment` aynı `couponCode` ile yeniden valide edince sipariş hâlâ `pending` → validasyon geçer → ikinci kayıt → kupon kullanım sayısı 2 görünür. Düzeltme: `!pendingOrder.couponId` guard'ı ile, coupon zaten checkout'ta uygulanmışsa re-validate ve re-record atlanır.
- **Race condition "CRITICAL"**: SAHTE ALARM. `processPaymentCompletion` Phase 1'de `FOR UPDATE` kilidi var (satır 127). Eş zamanlı iki istek serialized, ikincisi `alreadyPaid=true` döner.
- **Diğer bulgular**: PayPalButton orphan component (Checkout'ta render edilmiyor — CreditCardDrawer kart ödemelerini yapıyor); cart-total vs order-total reporting farkı (minor, gerçek ücret etkilenmiyor); webhook orphan logging (CRITICAL log + admin alert — kabul edilebilir); auto-cancel vs active session (FOR UPDATE + recovery zaten koruyor).

## Post-Rewrite Fixes (session 2)
4 ek sorun bulunup düzeltildi:
1. `complete-payment`: boş/null `paypalOrderId` → 400 veriyordu (ücretsiz sipariş akışını kırıyordu). Düzeltme: `rawPaypalOrderId` normalize edildi → `'manual-payment'`.
2. `CreditCardDrawer`: ölü `/register-paypal-order` endpoint çağrısı kaldırıldı; `/api/orders/pending-mine` (yeni) ile `dbOrderId` alınıp create-order'a geçildi (Faz 1 erken link kart ödemelerinde de çalışıyor).
3. `/api/orders/:orderId/complete`: PayPal capture adımı yoktu. APPROVED statüsündeki PayPal siparişler `capture` yapılmadan `paid` işaretlenebilirdi. Tam verify+capture mantığı eklendi (complete-payment ile aynı).
4. `/api/paypal/order` (eski duplicate route): warning log eklendi, ilerisi için yorum bırakıldı.
5. `GET /api/orders/pending-mine`: yeni endpoint — kullanıcının bekleyen siparişinin ID'sini döndürür.

## Kritik Kurallar
- **Capture ve fulfill asla ayrı client çağrısı olmamalı** — `complete-payment` endpoint her ikisini yapar
- **processPaymentCompletion idempotent** — zaten paid sipariş mevcut credential'ları döndürür
- **fixIncompletePaidOrders** — ödendi ama credential atanmadıysa admin panelden retry yapar
- **paypalWebhookId** admin panelde boş bırakılırsa webhook signature verification atlanır (sandbox için güvenli)
- **`paypalOrderId` boş string = `'manual-payment'`** — complete-payment ve orders/:id/complete her ikisi de normalleştirir; `!== 'manual-payment'` guard'ları buna göre çalışır

**Why:** Para alındı ama paket teslim edilmedi şikayeti üretimde doğrulandı.
