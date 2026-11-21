/**
 * src/lib/url-share.ts
 * ---------------------------------------------------------------------------
 * Mã hoá / giải mã đội hình để chia sẻ qua URL (`?squad=...`) bằng lz-string.
 *
 * Định dạng văn bản trước khi nén (v1):
 *   1~<formationId>~<salaryCap>~<slotId>:<playerId>:<enhancement>|<slotId>:<playerId>:<enhancement>|...
 * Ví dụ: 1~4-2-2-2~270~GK:dc-courtois:1|LS:icon-ronaldo-r9:10|bench-0:cc-alisson:1
 *
 * Link là dữ liệu không đáng tin: `decodeSquad` kiểm tra kỹ cấu trúc/giới hạn kích thước;
 * việc kiểm tra cầu thủ có tồn tại / trùng lặp do `useSquadStore.loadSnapshot` đảm nhiệm.
 * Huấn luyện không nằm trong snapshot (theo `SquadSnapshot` của Phase 1).
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

import { isFormationId } from '@/data/formations';
import { isEnhancementLevel } from '@/lib/ovr-calculator';
import type { EnhancementLevel, SquadSnapshot } from '@/types/fc-online';

export const SQUAD_QUERY_PARAM = 'squad';
export const SHARE_FORMAT_VERSION = '1';

const MAX_ENCODED_LENGTH = 4000;
const MAX_PLAIN_LENGTH = 1500;
const MAX_ENTRIES = 40;
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

/* ───────────────────────────── Encode / decode ───────────────────────────── */

export function serializeSnapshot(snapshot: SquadSnapshot): string {
  const entries = snapshot.s
    .map(([slotId, playerId, enhancement]) => `${slotId}:${playerId}:${enhancement}`)
    .join('|');
  const cap = snapshot.c !== undefined && Number.isFinite(snapshot.c) ? String(Math.round(snapshot.c)) : '';
  return [SHARE_FORMAT_VERSION, snapshot.f, cap, entries].join('~');
}

export function parseSnapshot(plain: string): SquadSnapshot | null {
  const parts = plain.split('~');
  if (parts.length !== 4) return null;
  const [version, formation, capText, entriesText] = parts;

  if (version !== SHARE_FORMAT_VERSION) return null;
  if (!isFormationId(formation)) return null;

  const entries: Array<readonly [string, string, EnhancementLevel]> = [];
  if (entriesText !== '') {
    const rawEntries = entriesText.split('|');
    if (rawEntries.length > MAX_ENTRIES) return null;
    for (const raw of rawEntries) {
      const fields = raw.split(':');
      if (fields.length !== 3) continue;
      const [slotId, playerId, enhancementText] = fields;
      const enhancement = Number(enhancementText);
      if (!ID_PATTERN.test(slotId) || !ID_PATTERN.test(playerId)) continue;
      if (!isEnhancementLevel(enhancement)) continue;
      entries.push([slotId, playerId, enhancement]);
    }
  }

  const cap = capText === '' ? undefined : Number(capText);
  return {
    v: 1,
    f: formation,
    s: entries,
    ...(cap !== undefined && Number.isFinite(cap) ? { c: cap } : {}),
  };
}

export function encodeSquad(snapshot: SquadSnapshot): string {
  return compressToEncodedURIComponent(serializeSnapshot(snapshot));
}

/** Giải mã chuỗi `squad`; trả về `null` nếu hỏng, bị cắt, sai version hoặc quá lớn. */
export function decodeSquad(encoded: string): SquadSnapshot | null {
  if (!encoded || encoded.length > MAX_ENCODED_LENGTH) return null;
  let plain: string | null;
  try {
    /* '+' trong query string có thể bị trình duyệt/ứng dụng đổi thành khoảng trắng */
    plain = decompressFromEncodedURIComponent(encoded.replace(/ /g, '+'));
  } catch {
    return null;
  }
  if (!plain || plain.length > MAX_PLAIN_LENGTH) return null;
  return parseSnapshot(plain);
}

/* ───────────────────────────── URL helpers ───────────────────────────── */

export type SquadUrlResult =
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'ok'; snapshot: SquadSnapshot };

/** Đọc tham số `squad` từ một query string (ví dụ `window.location.search`). */
export function parseSquadFromSearch(search: string): SquadUrlResult {
  const raw = new URLSearchParams(search).get(SQUAD_QUERY_PARAM);
  if (raw === null) return { status: 'none' };
  const snapshot = decodeSquad(raw);
  return snapshot ? { status: 'ok', snapshot } : { status: 'invalid' };
}

/**
 * Dựng link chia sẻ dựa trên URL hiện tại (giữ lại các query khác, bỏ hash).
 * Chuỗi nén chỉ chứa ký tự an toàn cho URL (A-Z a-z 0-9 + - $) nên không cần percent-encode thêm.
 */
export function buildShareUrl(snapshot: SquadSnapshot, base?: string): string {
  const url = new URL(base ?? window.location.href);
  url.searchParams.delete(SQUAD_QUERY_PARAM);
  const rest = url.searchParams.toString();
  const query = `${rest ? `${rest}&` : ''}${SQUAD_QUERY_PARAM}=${encodeSquad(snapshot)}`;
  return `${url.origin}${url.pathname}?${query}`;
}

/** Xoá tham số `squad` khỏi thanh địa chỉ (không reload) để F5 không ghi đè chỉnh sửa sau đó. */
export function stripSquadParam(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SQUAD_QUERY_PARAM)) return;
  url.searchParams.delete(SQUAD_QUERY_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

/* ───────────────────────────── Clipboard ───────────────────────────── */

/** Sao chép văn bản vào clipboard; tự fallback sang `execCommand` khi Clipboard API không khả dụng. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* thử fallback bên dưới */
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}