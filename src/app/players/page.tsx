'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  Footprints,
  Plus,
  RotateCcw,
  Ruler,
  Scale,
  Search,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';

import { PlayerCard } from '@/components/player-card/PlayerCard';
import { PLAYERS, SEASONS, getSeason } from '@/data/players';
import { formatBp, getBpValue } from '@/data/bp-prices';
import { cn } from '@/lib/cn';
import {
  ENHANCEMENT_LEVELS,
  POSITION_GROUP,
  type EnhancementLevel,
  type Player,
  type PositionGroup,
  type SeasonCode,
} from '@/types/fc-online';
import { getEnhancementBonus } from '@/lib/ovr-calculator';

/* ───────────────────────────── Helpers ───────────────────────────── */

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

type SortKey = 'ovr' | 'salary' | 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';

const OUTFIELD_STAT_LABELS: ReadonlyArray<{ key: keyof Extract<Player['stats'], { kind: 'outfield' }>; label: string }> = [
  { key: 'pace', label: 'Tốc độ (PAC)' },
  { key: 'shooting', label: 'Sút bóng (SHO)' },
  { key: 'passing', label: 'Chuyền bóng (PAS)' },
  { key: 'dribbling', label: 'Rê bóng (DRI)' },
  { key: 'defending', label: 'Phòng thủ (DEF)' },
  { key: 'physical', label: 'Thể lực (PHY)' },
];

const GK_STAT_LABELS: ReadonlyArray<{ key: keyof Extract<Player['stats'], { kind: 'gk' }>; label: string }> = [
  { key: 'diving', label: 'Đổ người (DIV)' },
  { key: 'handling', label: 'Bắt bóng (HAN)' },
  { key: 'kicking', label: 'Phát bóng (KIC)' },
  { key: 'reflexes', label: 'Phản xạ (REF)' },
  { key: 'speed', label: 'Tốc độ (SPD)' },
  { key: 'positioning', label: 'Chọn vị trí (POS)' },
];

function getStatValue(player: Player, key: SortKey, bonus: number): number {
  if (key === 'ovr') return player.ovr + bonus;
  if (key === 'salary') return player.salary;
  if (player.stats.kind === 'outfield') {
    return player.stats[key] + bonus;
  }
  const gkMap: Record<string, number> = {
    pace: player.stats.speed,
    shooting: player.stats.kicking,
    passing: player.stats.handling,
    dribbling: player.stats.reflexes,
    defending: player.stats.diving,
    physical: player.stats.positioning,
  };
  return (gkMap[key] ?? player.ovr) + bonus;
}

/* ───────────────────────────── Main Page ───────────────────────────── */

export default function PlayersDatabasePage() {
  // Bộ lọc tìm kiếm
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | PositionGroup>('ALL');
  const [seasonFilter, setSeasonFilter] = useState<'ALL' | SeasonCode>('ALL');
  const [maxSalary, setMaxSalary] = useState<number>(35);
  const [enhancement, setEnhancement] = useState<EnhancementLevel>(1);
  const [sortBy, setSortBy] = useState<SortKey>('ovr');
  const [sortAsc, setSortAsc] = useState(false);

  // Danh sách tối đa 3 cầu thủ đang chọn để so sánh
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const enhBonus = getEnhancementBonus(enhancement);

  const toggleCompare = (playerId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= 3) return [...prev.slice(1), playerId];
      return [...prev, playerId];
    });
  };

  const comparedPlayers = useMemo(
    () => compareIds.map((id) => PLAYERS.find((p) => p.id === id)).filter((p): p is Player => Boolean(p)),
    [compareIds],
  );

  const filteredPlayers = useMemo(() => {
    const q = normalizeText(query);
    return PLAYERS.filter((p) => {
      if (groupFilter !== 'ALL' && POSITION_GROUP[p.position] !== groupFilter) return false;
      if (seasonFilter !== 'ALL' && p.seasonCode !== seasonFilter) return false;
      if (p.salary > maxSalary) return false;
      if (q) {
        const haystack = normalizeText(`${p.name} ${p.shortName} ${p.club.name} ${p.nation.name}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const va = getStatValue(a, sortBy, enhBonus);
      const vb = getStatValue(b, sortBy, enhBonus);
      return sortAsc ? va - vb : vb - va;
    });
  }, [query, groupFilter, seasonFilter, maxSalary, sortBy, sortAsc, enhBonus]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(key);
      setSortAsc(key === 'salary'); // Lương mặc định xếp thấp -> cao
    }
  };

  const resetFilters = () => {
    setQuery('');
    setGroupFilter('ALL');
    setSeasonFilter('ALL');
    setMaxSalary(35);
    setEnhancement(1);
    setSortBy('ovr');
    setSortAsc(false);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* 1. Header & Thanh chọn cấp thẻ xem trước */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black text-white sm:text-2xl">
            Dữ liệu & So sánh <span className="text-emerald-400">Cầu thủ FC Online</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Tra cứu chỉ số, mức lương, giá BP và chọn tối đa 3 cầu thủ để đặt lên bàn cân so sánh.
          </p>
        </div>

        {/* Bộ chọn cấp thẻ +1..+13 áp dụng cho toàn bảng */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
          <span className="text-xs font-bold uppercase text-zinc-400">Cấp thẻ xem trước:</span>
          <div className="flex flex-wrap gap-1">
            {ENHANCEMENT_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setEnhancement(lvl)}
                className={cn(
                  'h-6 min-w-[26px] rounded px-1.5 text-xs font-black tabular-nums transition-colors',
                  enhancement === lvl
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                )}
              >
                +{lvl}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Khu vực Bàn cân So sánh (hiện khi chọn >= 1 cầu thủ) */}
      {comparedPlayers.length > 0 && (
        <section className="rounded-2xl border border-emerald-500/40 bg-zinc-900/90 p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="text-emerald-400" size={18} />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                So sánh trực tiếp ({comparedPlayers.length}/3 cầu thủ) — Mức thẻ +{enhancement}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Trash2 size={13} />
              <span>Xoá bàn cân</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="w-40 py-2 text-xs font-bold uppercase text-zinc-400">Chỉ số</th>
                  {comparedPlayers.map((p) => (
                    <th key={p.id} className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <PlayerCard player={p} enhancement={enhancement} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-bold text-white">{p.name}</div>
                          <div className="text-xs text-zinc-400">
                            {p.club.shortName} · {p.nation.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCompare(p.id)}
                            className="mt-1 text-[11px] font-semibold text-red-400 hover:underline"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 text-xs sm:text-sm">
                {/* OVR */}
                <tr>
                  <td className="py-2 font-semibold text-zinc-400">OVR (+{enhancement})</td>
                  {comparedPlayers.map((p) => {
                    const val = p.ovr + enhBonus;
                    const maxVal = Math.max(...comparedPlayers.map((x) => x.ovr + enhBonus));
                    return (
                      <td key={p.id} className="px-3 py-2 font-black tabular-nums">
                        <span className={val === maxVal && comparedPlayers.length > 1 ? 'text-emerald-400 text-base' : 'text-white'}>
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* Lương */}
                <tr>
                  <td className="py-2 font-semibold text-zinc-400">Mức lương</td>
                  {comparedPlayers.map((p) => {
                    const minSal = Math.min(...comparedPlayers.map((x) => x.salary));
                    return (
                      <td key={p.id} className="px-3 py-2 font-bold tabular-nums">
                        <span className={p.salary === minSal && comparedPlayers.length > 1 ? 'text-sky-400' : 'text-zinc-200'}>
                          {p.salary}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {/* Giá BP */}
                <tr>
                  <td className="py-2 font-semibold text-zinc-400">Giá trị BP</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.id} className="px-3 py-2 font-semibold tabular-nums text-amber-300">
                      {formatBp(getBpValue(p.id, enhancement))}
                    </td>
                  ))}
                </tr>
                {/* Thể hình */}
                <tr>
                  <td className="py-2 font-semibold text-zinc-400">Chiều cao / Cân nặng</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.id} className="px-3 py-2 text-zinc-200">
                      {p.heightCm} cm · {p.weightKg} kg
                    </td>
                  ))}
                </tr>
                {/* Chân thuận & Kỹ thuật */}
                <tr>
                  <td className="py-2 font-semibold text-zinc-400">Chân thuận / Kỹ thuật</td>
                  {comparedPlayers.map((p) => (
                    <td key={p.id} className="px-3 py-2 text-zinc-200">
                      {p.preferredFoot === 'right' ? 'Phải' : 'Trái'} (WF {p.weakFoot}★) · {p.skillMoves}★
                    </td>
                  ))}
                </tr>
                {/* 6 chỉ số tổng quát */}
                {(comparedPlayers[0].stats.kind === 'gk' ? GK_STAT_LABELS : OUTFIELD_STAT_LABELS).map((row) => {
                  const getVal = (pl: Player) => {
                    const raw = (pl.stats as unknown as Record<string, number>)[row.key] ?? pl.ovr;
                    return raw + enhBonus;
                  };
                  const maxStat = Math.max(...comparedPlayers.map(getVal));
                  return (
                    <tr key={row.key}>
                      <td className="py-2 font-semibold text-zinc-400">{row.label}</td>
                      {comparedPlayers.map((p) => {
                        const v = getVal(p);
                        return (
                          <td key={p.id} className="px-3 py-2 font-bold tabular-nums">
                            <span className={v === maxStat && comparedPlayers.length > 1 ? 'text-emerald-400' : 'text-zinc-200'}>
                              {v}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Thanh Bộ lọc tìm kiếm */}
      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:grid-cols-12">
        {/* Tìm tên */}
        <div className="relative md:col-span-4">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên cầu thủ, CLB, quốc gia..."
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Nhóm vị trí */}
        <div className="flex items-center gap-1 md:col-span-3">
          {(['ALL', 'FW', 'MF', 'DF', 'GK'] as const).map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setGroupFilter(grp)}
              className={cn(
                'h-10 flex-1 rounded-xl text-xs font-black transition-colors',
                groupFilter === grp
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white',
              )}
            >
              {grp === 'ALL' ? 'Tất cả' : grp}
            </button>
          ))}
        </div>

        {/* Mùa thẻ */}
        <div className="md:col-span-2">
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value as 'ALL' | SeasonCode)}
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Tất cả mùa thẻ</option>
            {SEASONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label} — {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Thanh trượt lương tối đa */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 md:col-span-2">
          <span className="shrink-0 text-xs font-semibold text-zinc-400">Lương ≤</span>
          <input
            type="range"
            min={6}
            max={35}
            value={maxSalary}
            onChange={(e) => setMaxSalary(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <span className="w-6 text-right text-xs font-black tabular-nums text-sky-400">{maxSalary}</span>
        </div>

        {/* Nút Reset */}
        <div className="md:col-span-1">
          <button
            type="button"
            onClick={resetFilters}
            title="Đặt lại bộ lọc"
            className="flex h-10 w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </section>

      {/* 4. Bảng Danh sách Cầu thủ */}
      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-xs text-zinc-400">
          <span>
            Hiển thị <strong className="text-white">{filteredPlayers.length}</strong> / {PLAYERS.length} cầu thủ
          </span>
          <span>Bấm vào cột tiêu đề để sắp xếp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3">Cầu thủ</th>
                <th className="px-3 py-3">Vị trí</th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('ovr')} className="flex items-center gap-1 hover:text-white">
                    <span>OVR (+{enhancement})</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('salary')} className="flex items-center gap-1 hover:text-white">
                    <span>Lương</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('pace')} className="flex items-center gap-1 hover:text-white">
                    <span>PAC</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('shooting')} className="flex items-center gap-1 hover:text-white">
                    <span>SHO</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('passing')} className="flex items-center gap-1 hover:text-white">
                    <span>PAS</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('dribbling')} className="flex items-center gap-1 hover:text-white">
                    <span>DRI</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('defending')} className="flex items-center gap-1 hover:text-white">
                    <span>DEF</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => handleSort('physical')} className="flex items-center gap-1 hover:text-white">
                    <span>PHY</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-3 py-3">Giá BP</th>
                <th className="px-4 py-3 text-right">So sánh</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {filteredPlayers.map((player) => {
                const season = getSeason(player.seasonCode);
                const finalOvr = player.ovr + enhBonus;
                const isCompared = compareIds.includes(player.id);
                const bp = getBpValue(player.id, enhancement);

                return (
                  <tr
                    key={player.id}
                    className={cn(
                      'transition-colors hover:bg-zinc-800/40',
                      isCompared && 'bg-emerald-950/20',
                    )}
                  >
                    {/* Tên & Mùa */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase"
                          style={{ background: season.theme.accent, color: season.theme.primary }}
                        >
                          {season.label}
                        </span>
                        <div>
                          <div className="font-bold text-white">{player.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <span>{player.club.shortName}</span>
                            <span>·</span>
                            <span>{player.nation.name}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Ruler size={10} /> {player.heightCm}cm
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Footprints size={10} /> {player.weakFoot}★
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Sparkles size={10} /> {player.skillMoves}★
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vị trí */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {player.positions.map((pos, idx) => (
                          <span
                            key={pos.position}
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[11px] font-bold',
                              idx === 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-zinc-800 text-zinc-400',
                            )}
                          >
                            {pos.position}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* OVR */}
                    <td className="px-3 py-3 font-black tabular-nums text-base text-white">
                      {finalOvr}
                    </td>

                    {/* Lương */}
                    <td className="px-3 py-3">
                      <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-black tabular-nums text-sky-300">
                        {player.salary}
                      </span>
                    </td>

                    {/* 6 chỉ số */}
                    {(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).map((statKey) => {
                      const val = getStatValue(player, statKey, enhBonus);
                      return (
                        <td
                          key={statKey}
                          className={cn(
                            'px-3 py-3 font-bold tabular-nums text-xs',
                            val >= 115
                              ? 'text-amber-300'
                              : val >= 105
                                ? 'text-emerald-400'
                                : 'text-zinc-300',
                          )}
                        >
                          {val}
                        </td>
                      );
                    })}

                    {/* Giá BP */}
                    <td className="px-3 py-3 text-xs font-semibold tabular-nums text-zinc-300">
                      {formatBp(bp)}
                    </td>

                    {/* Nút thêm vào bàn cân */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleCompare(player.id)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors',
                          isCompared
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300',
                        )}
                      >
                        {isCompared ? <Check size={13} /> : <Plus size={13} />}
                        <span>{isCompared ? 'Đang so' : 'So sánh'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-zinc-500">
                    <Trophy className="mx-auto mb-2 opacity-30" size={28} />
                    Không tìm thấy cầu thủ nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}