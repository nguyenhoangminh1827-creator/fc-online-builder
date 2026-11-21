/** Nối className, bỏ qua giá trị falsy. (Nếu đã cài shadcn/ui, có thể thay bằng `cn` từ `@/lib/utils`.) */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}