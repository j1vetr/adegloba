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

## CreditCardDrawer 3-katmanlı dbOrderId çözümü (session 6)
dbOrderId null olduğunda 3. kaynak olarak /api/cart/checkout çağrılıyor.
Öncelik: (1) propDbOrderId (URL'den), (2) pending-mine API, (3) /api/cart/checkout son çare.
Böylece kullanıcının hiç pending siparişi olmasa bile para hareketinden önce her zaman bir DB siparişi yaratılıyor.
dbOrderId: null vakası artık teorik olarak imkânsız (sepet dolu olduğu sürece).

## dbOrderId → complete-payment fix (session 5)
CreditCardDrawer artık `dbOrderId`'yi hem `create-order`'a hem `complete-payment` body'sine gönderiyor.
Server tarafında `complete-payment`, `bodyDbOrderId` ile direkt sipariş lookup yapıyor (paypalOrderId lookup'tan sonra, userOrders scan'dan önce).
Böylece erken link başarısız olsa bile (dbOrderId: null → paypalOrderId link yok) complete-payment doğru siparişi bulabiliyor.
Ayrıca Checkout.tsx artık URL'deki orderId'yi `CreditCardDrawer`'a `dbOrderId` prop olarak geçiriyor.

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

## Reconciliation Güvenlik Ağı (session 7)
"Para çekildi, paket yok" için NİHAİ güvenlik ağı: `PaymentReconciliationService` (server/services/) her 10 dk'da son 48 saatin paypalOrderId'li ama ödenmemiş (pending/cancelled/failed) siparişlerini PayPal'a sorar; PayPal COMPLETED diyorsa `processPaymentCompletion` ile otomatik teslim eder ve `reconciliation_recovered` payment_event yazar. Client akışı nerede koparsa kopsun (create-order 500, capture timeout, kapanan tarayıcı, kaçan webhook) bu yakalar.
- Kart ödemelerinde (`payment_source.card`) PayPal parayı ORDER CREATE anında çekebilir — create-order 500 dönse bile para gitmiş olabilir. "Failed to create order" + para çekildi vakalarının açıklaması bu.
- `processPaymentCompletion` artık 'failed' siparişi de reaktive eder (DECLINED webhook sonrası başarılı retry senaryosu).

## Determinizm Kuralları (code review sonrası)
- **Belirsiz kurtarma YASAK**: complete-payment recovery, paypalOrderId'siz iptal sipariş adayı BİRDEN FAZLAysa tahmin etmez — `ambiguous_recovery_blocked` (CRITICAL) log yazıp durur. Tek aday varsa kurtarır.
- **/api/cart/checkout in-flight koruması**: <15 dk yaşında PayPal'a bağlı pending sipariş varsa 409 döner, İPTAL ETMEZ (başka sekmedeki aktif ödemeyi öldürmemek için).
- **/api/orders/:orderId/complete ownership check**: sipariş session kullanıcısına ait değilse 403 + security log.
- Reconciliation adayları `createdAt ASC` sıralı (starvation önlenir), tur başına max 20, çağrılar arası 500ms.

## Mimari Denetim Kararı (session 8 — henüz UYGULANMADI, kullanıcı onayı bekliyor)
Tam akış denetimi yapıldı. Karar önerisi: sıfırdan yazma DEĞİL, tek "payment orchestrator" modülünde konsolidasyon. Doğrulanmış açık bulgular (düzeltilene kadar geçerli):
- `/api/settings/payment` auth'suz — PayPal client secret'ı herkese dönüyor + console.log'a yazıyor (EN KRİTİK)
- `manual-payment` yolu: paypalOrderId'siz complete-payment isteği, "toplam 0 mı" kontrolü olmadan pending siparişi ücretsiz teslim ediyor (bedava paket açığı)
- Tutar doğrulaması yok: create-order client'ın gönderdiği amount'u kullanıyor; complete-payment capture tutarını sipariş toplamıyla karşılaştırmıyor (1 cent öde → tam paket)
- `/api/paypal/create-order` session/sahiplik kontrolü yok; early-link istediği dbOrderId'ye yazıyor
- paypal.ts kart numarası+CVV'yi console.log'a ve SDK logBody'ye yazıyor (PCI ihlali)
- İki tamamlama rotası (~100 satır kopya), loyalty sadece /api/orders/:id/complete'te güncelleniyor (cart akışında atlanıyor)

## Kritik Kurallar
- **Capture ve fulfill asla ayrı client çağrısı olmamalı** — `complete-payment` endpoint her ikisini yapar
- **processPaymentCompletion idempotent** — zaten paid sipariş mevcut credential'ları döndürür
- **fixIncompletePaidOrders** — ödendi ama credential atanmadıysa admin panelden retry yapar
- **paypalWebhookId** admin panelde boş bırakılırsa webhook signature verification atlanır (sandbox için güvenli)
- **`paypalOrderId` boş string = `'manual-payment'`** — complete-payment ve orders/:id/complete her ikisi de normalleştirir; `!== 'manual-payment'` guard'ları buna göre çalışır

**Why:** Para alındı ama paket teslim edilmedi şikayeti üretimde doğrulandı.
