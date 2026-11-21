/**
 * src/features/team-color/teamColorEngine.ts
 * ---------------------------------------------------------------------------
 * Engine quét 11 cầu thủ đá chính và tự động kích hoạt Team Color:
 *   - CLB          : mốc 3 / 5 / 8 / 11 cầu thủ cùng CLB
 *   - Quốc gia     : mốc 3 / 5 / 8 / 11 cầu thủ cùng quốc tịch
 *   - Mùa thẻ      : cùng mùa thẻ đặc biệt (ICON, ICONS Match, 24TS, VN...) — bỏ qua mùa 'regular'
 *   - Cấp thẻ      : Đội hình Bạc (cả 11 người ≥ +5) / Đội hình Vàng (cả 11 người ≥ +8)
 *                    Vàng thay thế Bạc (không cộng dồn).
 *
 * Engine là hàm thuần: không phụ thuộc store, chỉ nhận danh sách cầu thủ đá chính.
 * ⚠️ Các mức bonus là placeholder — chỉnh ở các hằng số *_TIERS bên dưới.
 */

import { SEASONS_BY_CODE } from '@/data/players';
import { GOLD_MIN_LEVEL, SILVER_MIN_LEVEL } from '@/lib/ovr-calculator';
import {
  POSITION_GROUP,
  type ActiveTeamColor,
  type EnhancementLevel,
  type Player,
  type PlayerStats,
  type SeasonCategory,
  type SquadSlot,
  type TeamColorBuff,
  type TeamColorKind,
  type TeamColorTier,
} from '@/types/fc-online';

/* ───────────────────────────── Config ───────────────────────────── */

export const STARTING_XI_SIZE = 11;

export const TEAM_COLOR_MILESTONES = [3, 5, 8, 11] as const;

const makeTiers = (bonuses: readonly number[]): readonly TeamColorTier[] =>
  TEAM_COLOR_MILESTONES.map((minPlayers, i) => ({ minPlayers, ovrBonus: bonuses[i] }));

export const CLUB_TEAM_COLOR_TIERS = makeTiers([1, 2, 3, 4]);
export const NATION_TEAM_COLOR_TIERS = makeTiers([1, 2, 3, 4]);
export const SEASON_TEAM_COLOR_TIERS = makeTiers([1, 1, 2, 3]);
export const SILVER_SQUAD_TIERS: readonly TeamColorTier[] = [
  { minPlayers: STARTING_XI_SIZE, ovrBonus: 1 },
];
export const GOLD_SQUAD_TIERS: readonly TeamColorTier[] = [
  { minPlayers: STARTING_XI_SIZE, ovrBonus: 2 },
];

/** Mùa thẻ thuộc các category này mới có Team Color mùa thẻ. */
export const SEASON_TEAM_COLOR_CATEGORIES: ReadonlySet<SeasonCategory> = new Set<SeasonCategory>([
  'icon',
  'special',
  'local',
]);

/** Mỗi 1 OVR Team Color = +1 cho từng chỉ số của cầu thủ. */
export const STAT_BONUS_PER_OVR = 1;

const KIND_ORDER: Readonly<Record<TeamColorKind, number>> = {
  club: 0,
  nation: 1,
  league: 2,
  season: 3,
  enhancement: 4,
};

/* ───────────────────────────── Types ───────────────────────────── */

export interface TeamColorEntry {
  readonly slotId: string;
  readonly player: Player;
  readonly enhancement: EnhancementLevel;
}

export interface TeamColorBonusSource {
  readonly buffId: string;
  readonly label: string;
  readonly kind: TeamColorKind;
  readonly ovrBonus: number;
}

export interface PlayerTeamColorBonus {
  readonly slotId: string;
  readonly playerId: string;
  /** Tổng OVR cộng thêm từ mọi Team Color đang kích hoạt */
  readonly ovrBonus: number;
  /** Tổng điểm cộng cho mỗi chỉ số */
  readonly statBonus: number;
  readonly sources: readonly TeamColorBonusSource[];
}

export interface TeamColorResult {
  /** Team Color đã đạt ít nhất 1 mốc */
  readonly active: readonly ActiveTeamColor[];
  /** Team Color có cầu thủ khớp nhưng chưa đạt mốc đầu tiên (để UI hiển thị tiến độ) */
  readonly progress: readonly ActiveTeamColor[];
  /** Bonus theo slotId (có đủ mọi slot truyền vào, bonus = 0 nếu không có) */
  readonly perPlayer: Readonly<Record<string, PlayerTeamColorBonus>>;
  readonly totalOvrBonus: number;
}

/* ───────────────────────────── Internals ───────────────────────────── */

interface Group {
  readonly buff: TeamColorBuff;
  readonly members: Set<string>;
}

function resolveTiers(
  tiers: readonly TeamColorTier[],
  count: number,
): { activeTier: TeamColorTier | null; nextTier: TeamColorTier | null } {
  let activeTier: TeamColorTier | null = null;
  let nextTier: TeamColorTier | null = null;
  for (const tier of tiers) {
    if (tier.minPlayers <= count) activeTier = tier;
    else if (nextTier === null) nextTier = tier;
  }
  return { activeTier, nextTier };
}

function compareActive(a: ActiveTeamColor, b: ActiveTeamColor): number {
  const kindDiff = KIND_ORDER[a.buff.kind] - KIND_ORDER[b.buff.kind];
  if (kindDiff !== 0) return kindDiff;
  const bonusDiff = (b.activeTier?.ovrBonus ?? 0) - (a.activeTier?.ovrBonus ?? 0);
  if (bonusDiff !== 0) return bonusDiff;
  return a.buff.label.localeCompare(b.buff.label);
}

/* ───────────────────────────── Engine ───────────────────────────── */

export function evaluateTeamColors(entries: readonly TeamColorEntry[]): TeamColorResult {
  const groups = new Map<string, Group>();

  const register = (buff: TeamColorBuff, slotId: string): void => {
    const existing = groups.get(buff.id);
    if (existing) existing.members.add(slotId);
    else groups.set(buff.id, { buff, members: new Set([slotId]) });
  };

  for (const { slotId, player, enhancement } of entries) {
    register(
      {
        id: `club:${player.club.id}`,
        kind: 'club',
        targetId: player.club.id,
        label: `CLB ${player.club.name}`,
        tiers: CLUB_TEAM_COLOR_TIERS,
        appliesTo: 'matching-players',
      },
      slotId,
    );

    register(
      {
        id: `nation:${player.nation.id}`,
        kind: 'nation',
        targetId: player.nation.id,
        label: `Quốc gia ${player.nation.name}`,
        tiers: NATION_TEAM_COLOR_TIERS,
        appliesTo: 'matching-players',
      },
      slotId,
    );

    const season = SEASONS_BY_CODE[player.seasonCode];
    if (season && SEASON_TEAM_COLOR_CATEGORIES.has(season.category)) {
      register(
        {
          id: `season:${season.code}`,
          kind: 'season',
          targetId: season.code,
          label: `Mùa thẻ ${season.name}`,
          tiers: SEASON_TEAM_COLOR_TIERS,
          appliesTo: 'matching-players',
        },
        slotId,
      );
    }

    if (enhancement >= SILVER_MIN_LEVEL) {
      register(
        {
          id: 'enhancement:silver',
          kind: 'enhancement',
          targetId: 'silver',
          label: `Đội hình Bạc (+${SILVER_MIN_LEVEL})`,
          tiers: SILVER_SQUAD_TIERS,
          appliesTo: 'all-players',
        },
        slotId,
      );
    }
    if (enhancement >= GOLD_MIN_LEVEL) {
      register(
        {
          id: 'enhancement:gold',
          kind: 'enhancement',
          targetId: 'gold',
          label: `Đội hình Vàng (+${GOLD_MIN_LEVEL})`,
          tiers: GOLD_SQUAD_TIERS,
          appliesTo: 'all-players',
        },
        slotId,
      );
    }
  }

  /* Đánh giá mốc của từng nhóm */
  const evaluated: Array<{ result: ActiveTeamColor; members: Set<string> }> = [];
  for (const { buff, members } of groups.values()) {
    const { activeTier, nextTier } = resolveTiers(buff.tiers, members.size);
    evaluated.push({
      result: { buff, matchingCount: members.size, activeTier, nextTier },
      members,
    });
  }

  /* Đội hình Vàng thay thế Đội hình Bạc (không cộng dồn) */
  const goldActive = evaluated.some(
    (e) => e.result.buff.id === 'enhancement:gold' && e.result.activeTier !== null,
  );
  const candidates = goldActive
    ? evaluated.filter((e) => e.result.buff.id !== 'enhancement:silver')
    : evaluated;

  /* Áp dụng bonus cho từng cầu thủ */
  const sourcesBySlot = new Map<string, TeamColorBonusSource[]>();
  for (const { result, members } of candidates) {
    const { buff, activeTier } = result;
    if (!activeTier) continue;
    for (const entry of entries) {
      const isRecipient = buff.appliesTo === 'all-players' || members.has(entry.slotId);
      if (!isRecipient) continue;
      if (
        buff.positionGroups &&
        !buff.positionGroups.includes(POSITION_GROUP[entry.player.position])
      ) {
        continue;
      }
      const list = sourcesBySlot.get(entry.slotId) ?? [];
      list.push({
        buffId: buff.id,
        label: buff.label,
        kind: buff.kind,
        ovrBonus: activeTier.ovrBonus,
      });
      sourcesBySlot.set(entry.slotId, list);
    }
  }

  const perPlayer: Record<string, PlayerTeamColorBonus> = {};
  let totalOvrBonus = 0;
  for (const entry of entries) {
    const sources = sourcesBySlot.get(entry.slotId) ?? [];
    const ovrBonus = sources.reduce((sum, s) => sum + s.ovrBonus, 0);
    perPlayer[entry.slotId] = {
      slotId: entry.slotId,
      playerId: entry.player.id,
      ovrBonus,
      statBonus: ovrBonus * STAT_BONUS_PER_OVR,
      sources,
    };
    totalOvrBonus += ovrBonus;
  }

  const active = candidates
    .map((e) => e.result)
    .filter((r) => r.activeTier !== null)
    .sort(compareActive);
  const progress = candidates
    .map((e) => e.result)
    .filter((r) => r.activeTier === null)
    .sort((a, b) => b.matchingCount - a.matchingCount || compareActive(a, b));

  return { active, progress, perPlayer, totalOvrBonus };
}

/**
 * Tiện ích: quét các slot đá chính của store. Slot trống / playerId không tồn tại sẽ bị bỏ qua.
 * Truyền `getPlayer` từ '@/data/players' (hoặc API) vào `resolvePlayer`.
 */
export function evaluateSquadTeamColors(
  slots: readonly SquadSlot[],
  resolvePlayer: (playerId: string) => Player | undefined,
): TeamColorResult {
  const entries: TeamColorEntry[] = [];
  for (const slot of slots) {
    if (!slot.playerId) continue;
    const player = resolvePlayer(slot.playerId);
    if (!player) continue;
    entries.push({ slotId: slot.slotId, player, enhancement: slot.enhancement });
  }
  return evaluateTeamColors(entries);
}

/** Cộng `bonus` vào toàn bộ chỉ số của cầu thủ (outfield hoặc thủ môn). */
export function applyStatBonus(stats: PlayerStats, bonus: number): PlayerStats {
  if (bonus === 0) return stats;
  if (stats.kind === 'gk') {
    return {
      kind: 'gk',
      diving: stats.diving + bonus,
      handling: stats.handling + bonus,
      kicking: stats.kicking + bonus,
      reflexes: stats.reflexes + bonus,
      speed: stats.speed + bonus,
      positioning: stats.positioning + bonus,
    };
  }
  return {
    kind: 'outfield',
    pace: stats.pace + bonus,
    shooting: stats.shooting + bonus,
    passing: stats.passing + bonus,
    dribbling: stats.dribbling + bonus,
    defending: stats.defending + bonus,
    physical: stats.physical + bonus,
  };
}