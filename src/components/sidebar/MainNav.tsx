'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/', label: 'Xây dựng đội hình & Cân lương', icon: Shield },
  { href: '/players', label: 'Tra cứu & So sánh cầu thủ', icon: Users },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <Scale size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">
                FCO <span className="text-emerald-400">BUILDER</span>
              </span>
              <span className="hidden sm:inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                Cân lương 270
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400">
              Phát triển bởi <strong className="text-emerald-400">Hoàng Minh</strong>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:text-sm',
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                )}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}