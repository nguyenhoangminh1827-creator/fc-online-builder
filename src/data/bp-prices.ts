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
  // Giá gốc (+1) của cầu thủ mới sẽ được nạp vào đây
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