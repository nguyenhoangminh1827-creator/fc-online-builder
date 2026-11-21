'use client';

/**
 * src/components/sidebar/SquadHeaderBar.tsx
 * ---------------------------------------------------------------------------
 * Thanh điều khiển đội hình (nối `useSquadStore` + `useSquadMetrics`):
 *  - Chọn sơ đồ (6 sơ đồ trong formations.ts)
 *  - Thanh cân lương real-time: xanh (hợp lệ) · vàng (sát trần: cap-5 → cap) · đỏ nhấp nháy (vượt)
 *  - OVR trung bình, tổng giá trị BP, Team Color đang kích hoạt, nút Reset
 *  - Nút "Chia sẻ đội hình": copy link `?squad=...` (lz-string) vào clipboard + toast
 */

import { useEffect, useState } from 'react';
import { Check, RotateCcw, Share2 } from 'lucide-react';

import { formatBp } from '@/data/bp-prices';
import { FORMATIONS } from '@/data/formations';
import {
  clampSalaryCap,
  toSnapshot,
  useSquadMetrics,
  useSquadStore,
} from '@/features/squad/useSquadStore';
import { STARTING_XI_SIZE } from '@/features/team-color/teamColorEngine';
import { cn } from '@/lib/cn';
import { buildShareUrl, copyToClipboard } from '@/lib/url-share';
import type { TeamColorKind } from '@/types/fc-online';

/* ───────────────────────────── Salary status ───────────────────────────── */

/** Còn ≤ 5 lương so với trần (265–270 khi cap = 270) → cảnh báo vàng. */
export const NEAR_CAP_MARGIN = 5;

type SalaryStatus = 'ok' | 'near' | 'over';

export function getSalaryStatus(current: number, cap: number): SalaryStatus {
  if (current > cap) return 'over';
  if (current >= cap - NEAR_CAP_MARGIN) return 'near';
  return 'ok';
}

const STATUS_STYLE: Readonly<
  Record<SalaryStatus, { bar: string; text: string; border: string; label: string }>
> = {
  ok: {
    bar: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    label: 'Hợp lệ',
  },
  near: {
    bar: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    label: 'Sát trần lương',
  },
  over: {
    bar: 'animate-pulse bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.85)]',
    text: 'text-red-400',
    border: 'animate-pulse border-red-500/60',
    label: 'Vượt cân lương',
  },
};

const KIND_STYLE: Readonly<Record<TeamColorKind, string>> = {
  club: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  nation: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  league: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  season: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  enhancement: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200',
};

/* ───────────────────────────── Small pieces ───────────────────────────── */

function SalaryCapInput({ cap, onCommit }: { cap: number; onCommit: (cap: number) => void }) {
  const [draft, setDraft] = useState(String(cap));
  useEffect(() => setDraft(String(cap)), [cap]);

  const commit = (): void => {
    const value = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(value)) {
      onCommit(value);
      setDraft(String(clampSalaryCap(value)));
    } else {
      setDraft(String(cap));
    }
  };

  return (
    <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
      Trần lương
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={999}
        value={draft}
        aria-label="Giới hạn lương"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className="w-14 rounded-md border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-zinc-100 focus:border-emerald-400 focus:outline-none"
      />
    </label>
  );
}

function StatTile({
  label,
  value,
  hint,
  title,
}: {
  label: string;
  value: string;
  hint?: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="min-w-[88px] rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5"
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-black tabular-nums text-zinc-100">{value}</span>
        {hint && <span className="text-[11px] font-bold text-cyan-300">{hint}</span>}
      </div>
    </div>
  );
}

/* ───────────────────────────── SquadHeaderBar ───────────────────────────── */

export function SquadHeaderBar({ className }: { className?: string }) {
  const formationId = useSquadStore((s) => s.formationId);
  const setFormation = useSquadStore((s) => s.setFormation);
  const setSalaryCap = useSquadStore((s) => s.setSalaryCap);
  const resetSquad = useSquadStore((s) => s.resetSquad);
  const benchFilled = useSquadStore((s) => s.bench.filter((b) => b.playerId !== null).length);
  const m = useSquadMetrics();

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const canShare = m.filledSlots + benchFilled > 0;
  const handleShare = async (): Promise<void> => {
    const url = buildShareUrl(toSnapshot(useSquadStore.getState()));
    const copied = await copyToClipboard(url);
    if (copied) {
      setToast('Đã sao chép link!');
    } else {
      window.prompt('Không thể tự động sao chép. Hãy sao chép link bên dưới:', url);
    }
  };

  const [confirmingReset, setConfirmingReset] = useState(false);
  useEffect(() => {
    if (!confirmingReset) return;
    const timer = setTimeout(() => setConfirmingReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingReset]);

  const status = getSalaryStatus(m.currentSalary, m.maxSalary);
  const style = STATUS_STYLE[status];
  const fillPercent = Math.min(100, Math.max(0, (m.currentSalary / m.maxSalary) * 100));
  const nearTickPercent = Math.max(0, ((m.maxSalary - NEAR_CAP_MARGIN) / m.maxSalary) * 100);
  const teamColorBonus = Math.round((m.teamOvr - m.baseTeamOvr) * 10) / 10;
  const visibleProgress = m.teamColors.progress.slice(0, 4);

  const handleReset = (): void => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetSquad();
    setConfirmingReset(false);
  };

  return (
    <header
      className={cn(
        'space-y-3 rounded-xl border bg-zinc-950/85 p-3 backdrop-blur sm:p-4',
        style.border,
        className,
      )}
    >
      {/* Sơ đồ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sơ đồ</span>
        <div role="radiogroup" aria-label="Sơ đồ chiến thuật" className="flex flex-wrap gap-1.5">
          {FORMATIONS.map((formation) => {
            const selected = formation.id === formationId;
            return (
              <button
                key={formation.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setFormation(formation.id)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-bold tabular-nums transition',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400',
                  selected
                    ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.35)]'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100',
                )}
              >
                {formation.name}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <SalaryCapInput cap={m.maxSalary} onCommit={setSalaryCap} />
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={!canShare}
            title={canShare ? 'Sao chép link đội hình vào clipboard' : 'Hãy xếp ít nhất 1 cầu thủ để chia sẻ'}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold transition',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400',
              'border-cyan-400/50 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cyan-400/10',
            )}
          >
            {toast ? <Check size={13} aria-hidden="true" /> : <Share2 size={13} aria-hidden="true" />}
            {toast ? 'Đã sao chép!' : 'Chia sẻ đội hình'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold transition',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400',
              confirmingReset
                ? 'border-red-400 bg-red-500/20 text-red-200'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-400/60 hover:text-red-200',
            )}
          >
            <RotateCcw size={13} aria-hidden="true" />
            {confirmingReset ? 'Bấm lần nữa để xác nhận' : 'Reset đội hình'}
          </button>
        </div>
      </div>

      {/* Cân lương + chỉ số */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="flex-1">
          <div className="mb-1.5 flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Cân lương
              </span>
              <span className={cn('text-2xl font-black tabular-nums', style.text)}>
                {m.currentSalary}
                <span className="text-base font-bold text-zinc-500"> / {m.maxSalary}</span>
              </span>
            </div>
            <span
              role={status === 'over' ? 'alert' : 'status'}
              className={cn('text-xs font-bold', style.text)}
            >
              {status === 'over'
                ? `⚠ Vượt ${m.currentSalary - m.maxSalary} — giảm lương để hợp lệ`
                : `${style.label} · còn ${m.remainingSalary}`}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Cân lương đội hình"
            aria-valuemin={0}
            aria-valuemax={m.maxSalary}
            aria-valuenow={m.currentSalary}
            className="relative h-3 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className={cn('h-full rounded-full transition-all duration-300', style.bar)}
              style={{ width: `${fillPercent}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute top-0 h-full w-px bg-white/30"
              style={{ left: `${nearTickPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatTile
            label="OVR đội hình"
            value={m.filledSlots > 0 ? m.teamOvr.toFixed(1) : '—'}
            hint={teamColorBonus > 0 ? `+${teamColorBonus} TC` : undefined}
            title={`OVR chưa tính Team Color: ${m.baseTeamOvr.toFixed(1)}`}
          />
          <StatTile
            label="Tổng BP"
            value={formatBp(m.totalBp)}
            title={`Đá chính: ${formatBp(m.starterBp)} · Dự bị: ${formatBp(m.benchBp)}`}
          />
          <StatTile label="Đá chính" value={`${m.filledSlots}/${STARTING_XI_SIZE}`} />
        </div>
      </div>

      {/* Team Color */}
      <div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Team Color
        </div>
        {m.teamColors.active.length === 0 && visibleProgress.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Chưa có Team Color — xếp từ 3 cầu thủ cùng CLB, quốc gia hoặc mùa thẻ.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {m.teamColors.active.map(({ buff, matchingCount, activeTier, nextTier }) => (
              <li
                key={buff.id}
                title={
                  nextTier
                    ? `Mốc tiếp theo: ${nextTier.minPlayers} cầu thủ (+${nextTier.ovrBonus} OVR)`
                    : 'Đã đạt mốc tối đa'
                }
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                  KIND_STYLE[buff.kind],
                )}
              >
                <span>{buff.label}</span>
                <span className="rounded-full bg-black/30 px-1.5 tabular-nums">
                  {matchingCount}
                </span>
                <span className="font-black tabular-nums">+{activeTier?.ovrBonus ?? 0} OVR</span>
              </li>
            ))}
            {visibleProgress.map(({ buff, matchingCount, nextTier }) => (
              <li
                key={buff.id}
                title="Chưa đạt mốc kích hoạt"
                className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-500"
              >
                <span>{buff.label}</span>
                <span className="tabular-nums">
                  {matchingCount}/{nextTier?.minPlayers ?? matchingCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-bold text-zinc-950 shadow-[0_8px_30px_rgba(16,185,129,0.45)]"
        >
          {toast}
        </div>
      )}
    </header>
  );
}