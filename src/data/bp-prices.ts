/**
 * src/data/bp-prices.ts
 * ---------------------------------------------------------------------------
 * Giá BP (mock) của 20 cầu thủ mẫu ở cấp +1, và hệ số nhân theo cấp cường hoá.
 * Phase 1 `Player` chưa có trường giá nên dữ liệu giá được tách ra file riêng;
 * khi có API thật chỉ cần thay `getBpValue`.
 * ⚠️ Toàn bộ số liệu là giả lập.
 */

import type { EnhancementLevel } from '@/types/fc-online';

/** Giá BP ở cấp +1. */
export const BASE_BP_PRICES: Readonly<Record<string, number>> = {
  'icon-zidane': 85_000_000_000,
  'icon-ronaldo-r9': 120_000_000_000,
  'icon-maldini': 60_000_000_000,
  'iconm-cafu': 45_000_000_000,
  'iconm-ronaldinho': 70_000_000_000,
  '24ts-mbappe': 100_000_000_000,
  '24ts-bellingham': 70_000_000_000,
  '24ts-haaland': 90_000_000_000,
  '24ts-de-bruyne': 55_000_000_000,
  '24ts-salah': 60_000_000_000,
  'dc-rodri': 30_000_000_000,
  'dc-van-dijk': 20_000_000_000,
  'dc-courtois': 15_000_000_000,
  'cc-yamal': 25_000_000_000,
  'cc-lewandowski': 12_000_000_000,
  'cc-alisson': 8_000_000_000,
  'cc-trent': 3_000_000_000,
  'vn-quang-hai': 400_000_000,
  'vn-van-hau': 150_000_000,
  'vn-tien-linh': 250_000_000,
  '24ts-cristiano-ronaldo': 45_000_000_000,
  '24ts-messi': 48_000_000_000,
  'vn-do-mixi': 99_000_000_000,
  'vn-truong-con-nam-dinh': 88_000_000_000,
  'vn-hoang-minh': 150_000_000_000,
};

/** Hệ số nhân giá theo cấp cường hoá (placeholder). */
export const ENHANCEMENT_PRICE_MULTIPLIER: Readonly<Record<EnhancementLevel, number>> = {
  1: 1, 2: 1.2, 3: 1.5, 4: 2, 5: 3, 6: 4.5, 7: 7, 8: 11, 9: 18, 10: 30, 11: 50, 12: 85, 13: 140,
};

/** Giá trị BP của một cầu thủ ở cấp cường hoá cho trước; 0 nếu chưa có dữ liệu giá. */
export function getBpValue(playerId: string, enhancement: EnhancementLevel): number {
  const base = BASE_BP_PRICES[playerId] ?? 0;
  return Math.round(base * ENHANCEMENT_PRICE_MULTIPLIER[enhancement]);
}

/** Định dạng BP rút gọn theo tiếng Việt: 1.5 tỷ, 400 triệu... */
export function formatBp(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number): string => n.toFixed(2).replace(/\.?0+$/, '');
  if (abs >= 1_000_000_000_000) return `${trim(value / 1_000_000_000_000)} nghìn tỷ`;
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)} tỷ`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)} triệu`;
  return value.toLocaleString('vi-VN');
}