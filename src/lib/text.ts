/**
 * src/lib/text.ts
 * ---------------------------------------------------------------------------
 * Chuẩn hoá chuỗi để tìm kiếm không dấu: "Quế Ngọc Hải" → "que ngoc hai", "Čech" → "cech".
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Khớp khi MỌI từ trong `query` đều xuất hiện trong `haystack` (cả hai đã chuẩn hoá). */
export function matchesAllTokens(haystack: string, query: string): boolean {
  if (!query) return true;
  return query.split(' ').every((token) => haystack.includes(token));
}