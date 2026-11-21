import type { Metadata } from 'next';
import { MainNav } from '@/components/sidebar/MainNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'FC Online Squad Builder — Hoàng Minh',
  description: 'Xây dựng đội hình, cân lương 270, tính Team Color và so sánh cầu thủ FC Online bởi Hoàng Minh',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased">
        <MainNav />
        <div className="flex-1">{children}</div>
        <footer className="mt-12 border-t border-zinc-800/80 bg-zinc-950/90 py-5 text-center text-xs text-zinc-400">
          <div className="mx-auto max-w-7xl px-4">
            © 2026 <strong className="font-bold text-white">FCO Builder</strong> · Thiết kế & Xây dựng bởi{' '}
            <span className="font-bold text-emerald-400">Hoàng Minh</span>
          </div>
        </footer>
      </body>
    </html>
  );
}