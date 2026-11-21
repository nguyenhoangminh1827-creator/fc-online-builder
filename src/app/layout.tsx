import type { Metadata } from 'next';
import { MainNav } from '@/components/sidebar/MainNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'FC Online Squad Builder & Player Database',
  description: 'Xây dựng đội hình, cân lương 270, tính Team Color và so sánh cầu thủ FC Online',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <MainNav />
        {children}
      </body>
    </html>
  );
}