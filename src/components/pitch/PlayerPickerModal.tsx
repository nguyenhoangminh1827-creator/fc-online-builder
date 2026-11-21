'use client';

/**
 * src/components/pitch/PlayerPickerModal.tsx
 * ---------------------------------------------------------------------------
 * Hộp chọn cầu thủ cho một slot (đá chính hoặc dự bị).
 *
 * Sắp xếp theo mức phù hợp với vị trí của slot:
 *   1. "Đúng vị trí" (xanh lá)  — thẻ có vị trí này (vị trí chính trước, vị trí phụ sau)
 *   2. "Gần vị trí"  (vàng)     — không có trong thẻ nhưng bị trừ ≤ NEAR_POSITION_MAX_PENALTY OVR
 *   3. "Trái vị trí" (đỏ)       — còn lại (bị trừ nhiều)
 * Trong mỗi nhóm: OVR tại vị trí đó giảm dần.
 *
 * Bộ lọc nhanh: tìm tên không dấu · nhóm vị trí (Tất cả/Đúng vị trí/FW/MF/DF/GK) ·
 * mùa thẻ · lương tối đa (kèm nút "Vừa khung lương còn lại").
 */

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Search, X } from 'lucide-react';

import { PLAYERS, SEASONS, getPlayer, getSeason } from '@/data/players';
import { useSquadMetrics, useSquadStore } from '@/features/squad/useSquadStore';
import { cn } from '@/lib/cn';
import { getPositionFit, type PositionFit } from '@/lib/ovr-calculator';
import { matchesAllTokens, normalizeSearchText } from '@/lib/text';
import {
  POSITION_GROUP,
  type Player,
  type Position,
  type PositionGroup,
  type SeasonCode,
} from '@/types/fc-online';

/* ───────────────────────────── Config & types ───────────────────────────── */

/** Cầu thủ không có vị trí trong thẻ nhưng bị trừ không quá số này vẫn xếp vào nhóm "Gần vị trí". */
export const NEAR_POSITION_MAX_PENALTY = 8;

export type FitTier = 'exact' | 'near' | 'far';
export type PositionFilter = 'ALL' | 'FIT' | PositionGroup;
type SeasonFilter = SeasonCode | 'ALL';

const TIER_RANK: Readonly<Record<FitTier, number>> = { exact: 0, near: 1, far: 2 };
const KIND_RANK: Readonly<Record<PositionFit['kind'], number>> = {
  natural: 0,
  alternate: 1,
  'out-of-position': 2,
};

const TIER_META: Readonly<Record<FitTier, { title: string; header: string }>> = {
  exact: { title: 'Đúng vị trí', header: 'text-emerald-300' },
  near: { title: 'Gần vị trí', header: 'text-amber-300' },
  far: { title: 'Trái vị trí', header: 'text-red-300' },
};

const GROUP_FILTERS: ReadonlyArray<{ value: PositionFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'FIT', label: 'Đúng vị trí' },
  { value: 'FW', label: 'FW' },
  { value: 'MF', label: 'MF' },
  { value: 'DF', label: 'DF' },
  { value: 'GK', label: 'GK' },
];

const SALARY_MAX = Math.max(...PLAYERS.map((p) => p.salary));

/** Chỉ mục tìm kiếm chuẩn hoá (không dấu), dựng một lần. */
const SEARCH_INDEX: ReadonlyMap<string, string> = new Map(
  PLAYERS.map((p) => [
    p.id,
    normalizeSearchText(
      [
        p.name,
        p.shortName,
        p.club.name,
        p.club.shortName,
        p.nation.name,
        p.nation.code,
        p.seasonCode,
        getSeason(p.seasonCode).name,
        p.positions.map((r) => r.position).join(' '),
      ].join(' '),
    ),
  ]),
);

const SEASON_COUNTS: Readonly<Record<string, number>> = PLAYERS.reduce<Record<string, number>>(
  (acc, p) => {
    acc[p.seasonCode] = (acc[p.seasonCode] ?? 0) + 1;
    return acc;
  },
  {},
);

export function getFitTier(fit: PositionFit): FitTier {
  if (fit.kind !== 'out-of-position') return 'exact';
  return fit.delta >= -NEAR_POSITION_MAX_PENALTY ? 'near' : 'far';
}

interface PickerRow {
  player: Player;
  fit: PositionFit | null;
  tier: FitTier | null;
}

/* ───────────────────────────── Small UI pieces ───────────────────────────── */

function Chip({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      style={active && accent ? { borderColor: accent, color: accent } : undefined}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-bold transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400',
        active
          ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
      )}
    >
      {children}
    </button>
  );
}

function FitBadge({ fit, tier }: { fit: PositionFit; tier: FitTier }) {
  if (tier === 'exact') {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
          Đúng vị trí
        </span>
        {fit.kind === 'alternate' && (
          <span className="text-[10px] text-zinc-500">
            vị trí phụ{fit.delta !== 0 ? ` ${fit.delta}` : ''}
          </span>
        )}
      </span>
    );
  }
  if (tier === 'near') {
    return (
      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
        Gần vị trí {fit.delta}
      </span>
    );
  }
  return (
    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
      Trái vị trí {fit.delta}
    </span>
  );
}

/* ───────────────────────────── PlayerPickerModal ───────────────────────────── */

export interface PlayerPickerModalProps {
  slotId: string;
  /** Vị trí của slot đá chính; `null` nếu là slot dự bị */
  position: Position | null;
  /** Cầu thủ đang đứng ở slot (nếu có) */
  occupantPlayerId: string | null;
  onClose: () => void;
  onPick: (playerId: string) => void;
}

export function PlayerPickerModal({
  slotId,
  position,
  occupantPlayerId,
  onClose,
  onPick,
}: PlayerPickerModalProps) {
  const slots = useSquadStore((s) => s.slots);
  const bench = useSquadStore((s) => s.bench);
  const metrics = useSquadMetrics();

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('ALL');
  const [maxSalary, setMaxSalary] = useState<number>(SALARY_MAX);

  const label = position ?? 'DỰ BỊ';
  const occupant = occupantPlayerId ? getPlayer(occupantPlayerId) : undefined;

  /** Lương còn trống nếu đặt cầu thủ MỚI vào slot này (trả lại lương người đang đứng nếu là đá chính). */
  const availableSalary =
    metrics.maxSalary - metrics.currentSalary + (position !== null && occupant ? occupant.salary : 0);
  const fitSalary = Math.max(0, Math.min(SALARY_MAX, availableSalary));

  /* Focus: vào ô tìm kiếm khi mở, trả focus khi đóng; Esc để đóng */
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab') return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /** Vị trí hiện tại của từng cầu thủ trong đội hình. */
  const placed = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of slots) if (s.playerId) map.set(s.playerId, s.position);
    for (const b of bench) if (b.playerId) map.set(b.playerId, 'DỰ BỊ');
    return map;
  }, [slots, bench]);

  /** Toàn bộ cầu thủ kèm mức phù hợp với slot (chưa lọc). */
  const baseRows = useMemo<PickerRow[]>(
    () =>
      PLAYERS.map((player) => {
        const fit = position ? getPositionFit(player, position) : null;
        return { player, fit, tier: fit ? getFitTier(fit) : null };
      }),
    [position],
  );

  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);

  const rows = useMemo(() => {
    return baseRows
      .filter(({ player, tier }) => {
        if (positionFilter === 'FIT' && tier !== 'exact') return false;
        if (
          positionFilter !== 'ALL' &&
          positionFilter !== 'FIT' &&
          POSITION_GROUP[player.position] !== positionFilter
        ) {
          return false;
        }
        if (seasonFilter !== 'ALL' && player.seasonCode !== seasonFilter) return false;
        if (player.salary > maxSalary) return false;
        return matchesAllTokens(SEARCH_INDEX.get(player.id) ?? '', normalizedQuery);
      })
      .sort((a, b) => {
        if (a.fit && b.fit && a.tier && b.tier) {
          const tier = TIER_RANK[a.tier] - TIER_RANK[b.tier];
          if (tier !== 0) return tier;
          const kind = KIND_RANK[a.fit.kind] - KIND_RANK[b.fit.kind];
          if (kind !== 0) return kind;
          const atPos = b.fit.ovrAtPosition - a.fit.ovrAtPosition;
          if (atPos !== 0) return atPos;
        }
        return b.player.ovr - a.player.ovr || a.player.name.localeCompare(b.player.name);
      });
  }, [baseRows, positionFilter, seasonFilter, maxSalary, normalizedQuery]);

  const tierCounts = useMemo(() => {
    const counts: Record<FitTier, number> = { exact: 0, near: 0, far: 0 };
    for (const row of rows) if (row.tier) counts[row.tier] += 1;
    return counts;
  }, [rows]);

  const filtersActive =
    query !== '' || positionFilter !== 'ALL' || seasonFilter !== 'ALL' || maxSalary < SALARY_MAX;

  const clearFilters = (): void => {
    setQuery('');
    setPositionFilter('ALL');
    setSeasonFilter('ALL');
    setMaxSalary(SALARY_MAX);
  };

  let lastTier: FitTier | null = null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-slot-id={slotId}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-zinc-900 shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 id={titleId} className="text-sm font-bold text-zinc-100">
              Chọn cầu thủ — <span className="text-emerald-400">{label}</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Lương còn lại:{' '}
              <span
                className={cn(
                  'font-bold tabular-nums',
                  availableSalary < 0 ? 'text-red-400' : 'text-emerald-300',
                )}
              >
                {availableSalary}
              </span>{' '}
              / {metrics.maxSalary}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tìm kiếm + bộ lọc */}
        <div className="space-y-2.5 border-b border-zinc-800 px-4 py-3">
          <label className="relative block">
            <span className="sr-only">Tìm cầu thủ</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên (không cần dấu), CLB, quốc gia…"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <div
            role="radiogroup"
            aria-label="Lọc theo nhóm vị trí"
            className="flex flex-wrap items-center gap-1.5"
          >
            {GROUP_FILTERS.filter((f) => f.value !== 'FIT' || position !== null).map((f) => (
              <Chip
                key={f.value}
                active={positionFilter === f.value}
                onClick={() => setPositionFilter(f.value)}
              >
                {f.label}
              </Chip>
            ))}
          </div>

          <div role="radiogroup" aria-label="Lọc theo mùa thẻ" className="flex flex-wrap gap-1.5">
            <Chip active={seasonFilter === 'ALL'} onClick={() => setSeasonFilter('ALL')}>
              Mọi mùa thẻ
            </Chip>
            {SEASONS.map((season) => (
              <Chip
                key={season.code}
                active={seasonFilter === season.code}
                accent={season.theme.accent}
                onClick={() => setSeasonFilter(season.code)}
              >
                {season.label}
                <span className="ml-1 font-normal opacity-60">{SEASON_COUNTS[season.code] ?? 0}</span>
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <label className="flex flex-1 items-center gap-2 text-[11px] text-zinc-400">
              <span className="whitespace-nowrap">Lương tối đa</span>
              <input
                type="range"
                min={0}
                max={SALARY_MAX}
                step={1}
                value={maxSalary}
                aria-label="Lương tối đa"
                onChange={(event) => setMaxSalary(Number(event.target.value))}
                className="min-w-[120px] flex-1 accent-emerald-400"
              />
              <span className="w-24 text-right font-bold tabular-nums text-zinc-200">
                {maxSalary >= SALARY_MAX ? 'Không giới hạn' : `≤ ${maxSalary}`}
              </span>
            </label>
            <button
              type="button"
              onClick={() => setMaxSalary(fitSalary)}
              disabled={maxSalary === fitSalary}
              title="Chỉ hiện cầu thủ có lương không vượt quá phần lương còn lại"
              className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-40"
            >
              Vừa khung lương (≤ {fitSalary})
            </button>
          </div>
        </div>

        {/* Kết quả */}
        <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-zinc-500">
          <span aria-live="polite">
            {rows.length}/{PLAYERS.length} cầu thủ
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-bold text-emerald-400 hover:underline"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>

        <ul className="flex-1 overflow-y-auto border-t border-zinc-800/70">
          {rows.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-zinc-500">
              Không có cầu thủ phù hợp bộ lọc.
            </li>
          )}
          {rows.map(({ player, fit, tier }) => {
            const heading =
              tier && tier !== lastTier ? (
                <li
                  key={`h-${tier}`}
                  role="presentation"
                  className={cn(
                    'sticky top-0 z-10 flex items-center justify-between bg-zinc-900/95 px-4 py-1.5',
                    'border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider backdrop-blur',
                    TIER_META[tier].header,
                  )}
                >
                  <span>{TIER_META[tier].title}</span>
                  <span className="tabular-nums opacity-70">{tierCounts[tier]}</span>
                </li>
              ) : null;
            lastTier = tier;

            const location = placed.get(player.id);
            const isCurrent = occupant?.id === player.id;
            const overCap = !location && player.salary > availableSalary;
            const season = getSeason(player.seasonCode);

            return (
              <Fragment key={player.id}>
                {heading}
                <li className="border-b border-zinc-800/60">
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onPick(player.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-800/70 focus-visible:bg-zinc-800 focus-visible:outline-none disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-center leading-none"
                      style={{
                        background: `linear-gradient(160deg, ${season.theme.primary}, #09090b)`,
                        color: season.theme.text,
                        boxShadow: `inset 0 0 0 1px ${season.theme.accent}`,
                      }}
                    >
                      <span className="text-base font-black tabular-nums">
                        {fit ? fit.ovrAtPosition : player.ovr}
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold">
                        {fit ? label : player.position}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-zinc-100">
                          {player.name}
                        </span>
                        <span
                          className="shrink-0 rounded px-1 py-px text-[9px] font-black uppercase"
                          style={{ background: season.theme.accent, color: season.theme.primary }}
                        >
                          {season.label}
                        </span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                        <span>
                          {player.club.shortName} · {player.nation.code}
                        </span>
                        <span>{player.positions.map((p) => p.position).join('/')}</span>
                        {fit && tier && <FitBadge fit={fit} tier={tier} />}
                        {location && (
                          <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200">
                            {isCurrent ? 'Đang ở vị trí này' : `Đang ở ${location} · hoán đổi`}
                          </span>
                        )}
                      </span>
                    </span>

                    <span
                      className={cn(
                        'shrink-0 rounded-md px-2 py-1 text-xs font-black tabular-nums',
                        overCap ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-300',
                      )}
                      title={overCap ? 'Vượt cân lương nếu thêm cầu thủ này' : 'Mức lương'}
                    >
                      {player.salary}
                    </span>
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
}