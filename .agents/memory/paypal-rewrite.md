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

## Kritik Kurallar
- **Capture ve fulfill asla ayrı client çağrısı olmamalı** — `complete-payment` endpoint her ikisini yapar
- **processPaymentCompletion idempotent** — zaten paid sipariş mevcut credential'ları döndürür
- **fixIncompletePaidOrders** — ödendi ama credential atanmadıysa admin panelden retry yapar
- **paypalWebhookId** admin panelde boş bırakılırsa webhook signature verification atlanır (sandbox için güvenli)

**Why:** Para alındı ama paket teslim edilmedi şikayeti üretimde doğrulandı.
