/**
 * src/data/players.ts
 * ---------------------------------------------------------------------------
 * Dữ liệu MẪU (mock) để phát triển & test: 50 cầu thủ, 7 mùa thẻ, lương 6 → 32.
 * ⚠️ OVR / chỉ số / lương là số giả lập, KHÔNG phải số liệu chính thức của game.
 *
 * Phủ đủ vị trí chính: GK x5 · CB x7 · LB x3 · RB x5 · CDM x4 · CM x6 · CAM x6 · LW x3 · RW x4 · ST x7.
 *
 * Team Color lớn để test:
 *  - Real Madrid x12 · Brazil x10 · Chelsea x8 · England x8 · Barcelona x6
 *  - Liverpool x5 · France x4 · Vietnam x11 (đủ cả đội hình đá chính)
 */

import type {
  ClubRef,
  GoalkeeperStats,
  NationRef,
  OutfieldStats,
  Player,
  PositionRating,
  Position,
  Season,
  SeasonCode,
} from '@/types/fc-online';

/* ───────────────────────────── Seasons ───────────────────────────── */

export const SEASONS: readonly Season[] = [
  {
    code: 'ICON', name: 'ICON', label: 'ICON', category: 'icon', releaseYear: 2017, sortOrder: 1,
    theme: { primary: '#1c1917', accent: '#fbbf24', text: '#fef3c7' },
  },
  {
    code: 'ICONM', name: 'ICONS Match', label: 'ICON M', category: 'icon', releaseYear: 2021, sortOrder: 2,
    theme: { primary: '#172554', accent: '#38bdf8', text: '#e0f2fe' },
  },
  {
    code: '24TS', name: '24 Team of the Season', label: '24TS', category: 'special', releaseYear: 2024, sortOrder: 3,
    theme: { primary: '#052e16', accent: '#4ade80', text: '#dcfce7' },
  },
  {
    code: '23UCL', name: '23 UEFA Champions League', label: '23UCL', category: 'special', releaseYear: 2023, sortOrder: 4,
    theme: { primary: '#0c1a4b', accent: '#60a5fa', text: '#dbeafe' },
  },
  {
    code: 'DC', name: 'DC', label: 'DC', category: 'special', releaseYear: 2023, sortOrder: 5,
    theme: { primary: '#3b0764', accent: '#c084fc', text: '#f3e8ff' },
  },
  {
    code: 'CC', name: 'CC', label: 'CC', category: 'regular', releaseYear: 2023, sortOrder: 6,
    theme: { primary: '#1e293b', accent: '#22d3ee', text: '#cffafe' },
  },
  {
    code: 'VN', name: 'Vietnam', label: 'VN', category: 'local', releaseYear: 2022, sortOrder: 7,
    theme: { primary: '#7f1d1d', accent: '#facc15', text: '#fef9c3' },
  },
];

export const SEASONS_BY_CODE: Readonly<Record<SeasonCode, Season>> = Object.fromEntries(
  SEASONS.map((s) => [s.code, s]),
) as Record<SeasonCode, Season>;

/* ───────────────────────────── Clubs & Nations ───────────────────────────── */

export const CLUBS = {
  realMadrid: { id: 'real-madrid', name: 'Real Madrid', shortName: 'RMA', leagueId: 'la-liga' },
  manCity: { id: 'man-city', name: 'Manchester City', shortName: 'MCI', leagueId: 'premier-league' },
  barcelona: { id: 'barcelona', name: 'FC Barcelona', shortName: 'BAR', leagueId: 'la-liga' },
  liverpool: { id: 'liverpool', name: 'Liverpool', shortName: 'LIV', leagueId: 'premier-league' },
  acMilan: { id: 'ac-milan', name: 'AC Milan', shortName: 'MIL', leagueId: 'serie-a' },
  congAnHaNoi: { id: 'cand-hanoi', name: 'Công An Hà Nội', shortName: 'CAHN', leagueId: 'v-league' },
  becamex: { id: 'becamex-bd', name: 'Becamex Bình Dương', shortName: 'BBD', leagueId: 'v-league' },
  chelsea: { id: 'chelsea', name: 'Chelsea', shortName: 'CHE', leagueId: 'premier-league' },
  arsenal: { id: 'arsenal', name: 'Arsenal', shortName: 'ARS', leagueId: 'premier-league' },
  haNoiFc: { id: 'hanoi-fc', name: 'Hà Nội FC', shortName: 'HNFC', leagueId: 'v-league' },
  theCongViettel: { id: 'the-cong-viettel', name: 'Thể Công Viettel', shortName: 'TCV', leagueId: 'v-league' },
  hagl: { id: 'hagl', name: 'Hoàng Anh Gia Lai', shortName: 'HAGL', leagueId: 'v-league' },
} as const satisfies Record<string, ClubRef>;

export const NATIONS = {
  france: { id: 'france', name: 'France', code: 'FRA' },
  brazil: { id: 'brazil', name: 'Brazil', code: 'BRA' },
  italy: { id: 'italy', name: 'Italy', code: 'ITA' },
  england: { id: 'england', name: 'England', code: 'ENG' },
  norway: { id: 'norway', name: 'Norway', code: 'NOR' },
  belgium: { id: 'belgium', name: 'Belgium', code: 'BEL' },
  spain: { id: 'spain', name: 'Spain', code: 'ESP' },
  poland: { id: 'poland', name: 'Poland', code: 'POL' },
  netherlands: { id: 'netherlands', name: 'Netherlands', code: 'NED' },
  egypt: { id: 'egypt', name: 'Egypt', code: 'EGY' },
  vietnam: { id: 'vietnam', name: 'Vietnam', code: 'VNM' },
  czechia: { id: 'czechia', name: 'Czech Republic', code: 'CZE' },
  cotedivoire: { id: 'cote-divoire', name: "Côte d'Ivoire", code: 'CIV' },
  germany: { id: 'germany', name: 'Germany', code: 'GER' },
  uruguay: { id: 'uruguay', name: 'Uruguay', code: 'URU' },
} as const satisfies Record<string, NationRef>;

/* ───────────────────────────── Helpers ───────────────────────────── */

const outfield = (
  pace: number,
  shooting: number,
  passing: number,
  dribbling: number,
  defending: number,
  physical: number,
): OutfieldStats => ({ kind: 'outfield', pace, shooting, passing, dribbling, defending, physical });

const keeper = (
  diving: number,
  handling: number,
  kicking: number,
  reflexes: number,
  speed: number,
  positioning: number,
): GoalkeeperStats => ({ kind: 'gk', diving, handling, kicking, reflexes, speed, positioning });

/** Tạo danh sách vị trí; phần tử đầu là vị trí chính. */
const pos = (main: Position, ovr: number, ...alts: Array<[Position, number]>): PositionRating[] => [
  { position: main, ovr },
  ...alts.map(([position, o]) => ({ position, ovr: o })),
];

/* ───────────────────────────── Players (20) ───────────────────────────── */

export const PLAYERS: readonly Player[] = [
  // Danh sách cầu thủ sẽ được nạp tự động vào đây
];

/* ───────────────────────────── Lookups ───────────────────────────── */

export const PLAYERS_BY_ID: Readonly<Record<string, Player>> = Object.fromEntries(
  PLAYERS.map((p) => [p.id, p]),
);

export function getPlayer(id: string): Player | undefined {
  return PLAYERS_BY_ID[id];
}

export function getSeason(code: SeasonCode): Season {
  return SEASONS_BY_CODE[code];
}
