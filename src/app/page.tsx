'use client';

/**
 * src/app/page.tsx
 * ---------------------------------------------------------------------------
 * Trang chủ Squad Builder: ghép SquadHeaderBar + TacticalPitch + bảng chi tiết đội hình.
 * `useSquadHydration()` nạp đội hình đã lưu trong localStorage (store dùng skipHydration).
 * Nếu URL có `?squad=...` (link chia sẻ), đội hình đó được nạp SAU khi hydrate xong (ưu tiên hơn
 * localStorage) rồi tham số được gỡ khỏi thanh địa chỉ để F5 không ghi đè các chỉnh sửa về sau.
 */

import { useEffect, useState } from 'react';


import { TacticalPitch } from '@/components/pitch/TacticalPitch';
import { SquadHeaderBar } from '@/components/sidebar/SquadHeaderBar';
import { getPlayer, getSeason } from '@/data/players';
import {
  useSquadHydration,
  useSquadMetrics,
  useSquadStore,
} from '@/features/squad/useSquadStore';
import { cn } from '@/lib/cn';
import { formatEnhancement } from '@/lib/ovr-calculator';
import { parseSquadFromSearch, stripSquadParam } from '@/lib/url-share';

/* ───────────────────────────── Nạp đội hình từ link chia sẻ ───────────────────────────── */

interface ShareNotice {
  kind: 'success' | 'warning' | 'error';
  text: string;
}

const NOTICE_STYLE: Readonly<Record<ShareNotice['kind'], string>> = {
  success: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  error: 'border-red-400/40 bg-red-400/10 text-red-200',
};

function useSharedSquadFromUrl(hydrated: boolean): {
  notice: ShareNotice | null;
  dismiss: () => void;
} {
  const loadSnapshot = useSquadStore((s) => s.loadSnapshot);
  const [notice, setNotice] = useState<ShareNotice | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const result = parseSquadFromSearch(window.location.search);
    if (result.status === 'none') return;
    stripSquadParam();

    if (result.status === 'invalid') {
      setNotice({ kind: 'error', text: 'Link đội hình không hợp lệ hoặc đã bị cắt ngắn.' });
      return;
    }

    const { snapshot } = result;
    const loaded = loadSnapshot(snapshot);
    if (loaded === null || loaded === 0) {
      setNotice({ kind: 'error', text: 'Link không chứa cầu thủ hợp lệ nào để nạp.' });
      return;
    }
    const skipped = snapshot.s.length - loaded;
    setNotice(
      skipped > 0
        ? {
            kind: 'warning',
            text: `Đã nạp đội hình ${snapshot.f} từ link chia sẻ (${loaded} cầu thủ, bỏ qua ${skipped} mục không hợp lệ).`,
          }
        : {
            kind: 'success',
            text: `Đã nạp đội hình ${snapshot.f} từ link chia sẻ (${loaded} cầu thủ).`,
          },
    );
  }, [hydrated, loadSnapshot]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);

  return { notice, dismiss: () => setNotice(null) };
}

function SquadBreakdownPanel() {
  const slots = useSquadStore((s) => s.slots);
  const m = useSquadMetrics();

  return (
    <section
      aria-label="Chi tiết đội hình"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4"
    >
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
        Chi tiết đá chính
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-1.5 pr-2 font-bold">Vị trí</th>
              <th className="py-1.5 pr-2 font-bold">Cầu thủ</th>
              <th className="py-1.5 pr-2 text-right font-bold">Lương</th>
              <th className="py-1.5 pr-2 font-bold">Công thức OVR</th>
              <th className="py-1.5 text-right font-bold">OVR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {slots.map((slot) => {
              const player = slot.playerId ? getPlayer(slot.playerId) : undefined;
              const b = m.slotBreakdown[slot.slotId];
              if (!player || !b) {
                return (
                  <tr key={slot.slotId} className="text-zinc-600">
                    <td className="py-1.5 pr-2 font-bold">{slot.position}</td>
                    <td className="py-1.5 pr-2" colSpan={4}>
                      Trống
                    </td>
                  </tr>
                );
              }
              const season = getSeason(player.seasonCode);
              return (
                <tr key={slot.slotId} className="text-zinc-300">
                  <td className="py-1.5 pr-2 font-bold text-zinc-100">{slot.position}</td>
                  <td className="py-1.5 pr-2">
                    <span className="font-semibold text-zinc-100">{player.shortName}</span>{' '}
                    <span
                      className="rounded px-1 py-px text-[9px] font-black uppercase"
                      style={{ background: season.theme.accent, color: season.theme.primary }}
                    >
                      {season.label}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-right font-bold tabular-nums text-sky-300">
                    {player.salary}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums text-zinc-400">
                    {b.baseOvr}
                    <span className="text-zinc-500"> {formatEnhancement(slot.enhancement)}</span>{' '}
                    {b.enhancementBonus > 0 && (
                      <span className="text-emerald-400">+{b.enhancementBonus}</span>
                    )}
                    {b.positionDelta !== 0 && (
                      <span className={b.positionDelta < 0 ? ' text-red-400' : ' text-emerald-400'}>
                        {' '}
                        {b.positionDelta > 0 ? `+${b.positionDelta}` : b.positionDelta}
                        <span className="text-zinc-500"> vt</span>
                      </span>
                    )}
                    {b.teamColorBonus > 0 && (
                      <span className="text-cyan-300">
                        {' '}
                        +{b.teamColorBonus}
                        <span className="text-zinc-500"> tc</span>
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right text-sm font-black tabular-nums text-zinc-100">
                    {b.finalOvr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        <span className="text-emerald-400">+n</span> cấp thẻ ·{' '}
        <span className="text-red-400">vt</span> chênh lệch vị trí ·{' '}
        <span className="text-cyan-300">tc</span> Team Color. Tổng lương đá chính:{' '}
        <span className="font-bold text-sky-300">
          {m.currentSalary}/{m.maxSalary}
        </span>
        .
      </p>
    </section>
  );
}

export default function HomePage() {
  const hydrated = useSquadHydration();
  const { notice, dismiss } = useSharedSquadFromUrl(hydrated);

  return (
    <main className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)] text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              FC Online <span className="text-emerald-400">Squad Builder</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Xếp đội hình · cân lương · Team Color — kéo-thả để hoán đổi, bấm ô trống để chọn cầu thủ.
            </p>
          </div>
        </div>

        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs font-semibold',
              NOTICE_STYLE[notice.kind],
            )}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Đóng thông báo"
              className="rounded px-1.5 text-base leading-none opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        <div
          aria-busy={!hydrated}
          className={cn(
            'space-y-4 transition-opacity duration-300',
            hydrated ? 'opacity-100' : 'opacity-0',
          )}
        >
          <SquadHeaderBar />
          <div className="grid items-start gap-4 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <TacticalPitch />
            <SquadBreakdownPanel />
          </div>
        </div>
      </div>
    </main>
  );
}