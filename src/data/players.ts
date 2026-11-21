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
  /* ── ICON ── */
  {
    id: 'icon-zidane', name: 'Zinedine Zidane', shortName: 'Zidane', seasonCode: 'ICON',
    ovr: 108, position: 'CAM', positions: pos('CAM', 108, ['CM', 107], ['CF', 104]),
    salary: 30, club: CLUBS.realMadrid, nation: NATIONS.france,
    stats: outfield(80, 90, 105, 106, 78, 92), preferredFoot: 'right', weakFoot: 4, skillMoves: 5,
    heightCm: 185, weightKg: 80,
  },
  {
    id: 'icon-ronaldo-r9', name: 'Ronaldo Nazário', shortName: 'R. Nazário', seasonCode: 'ICON',
    ovr: 109, position: 'ST', positions: pos('ST', 109, ['CF', 107], ['LS', 108], ['RS', 108]),
    salary: 32, club: CLUBS.realMadrid, nation: NATIONS.brazil,
    stats: outfield(98, 108, 86, 104, 50, 92), preferredFoot: 'right', weakFoot: 4, skillMoves: 5,
    heightCm: 183, weightKg: 82, imageUrl: '/players/r9-icon.png',
  },
  {
    id: 'icon-maldini', name: 'Paolo Maldini', shortName: 'Maldini', seasonCode: 'ICON',
    ovr: 106, position: 'LB', positions: pos('LB', 106, ['CB', 105], ['LCB', 105], ['LWB', 104]),
    salary: 29, club: CLUBS.acMilan, nation: NATIONS.italy,
    stats: outfield(88, 62, 82, 84, 108, 100), preferredFoot: 'left', weakFoot: 3, skillMoves: 2,
    heightCm: 186, weightKg: 85,
  },

  /* ── ICONS Match ── */
  {
    id: 'iconm-cafu', name: 'Cafu', shortName: 'Cafu', seasonCode: 'ICONM',
    ovr: 106, position: 'RB', positions: pos('RB', 106, ['RWB', 105], ['RM', 100]),
    salary: 27, club: CLUBS.acMilan, nation: NATIONS.brazil,
    stats: outfield(96, 74, 90, 92, 100, 102), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 176, weightKg: 75,
  },
  {
    id: 'iconm-ronaldinho', name: 'Ronaldinho Gaúcho', shortName: 'Ronaldinho', seasonCode: 'ICONM',
    ovr: 107, position: 'CAM', positions: pos('CAM', 107, ['LW', 106], ['LAM', 107], ['CF', 104]),
    salary: 28, club: CLUBS.barcelona, nation: NATIONS.brazil,
    stats: outfield(90, 94, 100, 110, 60, 82), preferredFoot: 'right', weakFoot: 5, skillMoves: 5,
    heightCm: 182, weightKg: 80,
  },

  /* ── 24TS ── */
  {
    id: '24ts-mbappe', name: 'Kylian Mbappé', shortName: 'Mbappé', seasonCode: '24TS',
    ovr: 111, position: 'ST', positions: pos('ST', 111, ['LW', 110], ['RW', 110], ['CF', 109]),
    salary: 32, club: CLUBS.realMadrid, nation: NATIONS.france,
    stats: outfield(112, 104, 92, 106, 50, 90), preferredFoot: 'right', weakFoot: 4, skillMoves: 5,
    heightCm: 178, weightKg: 73,
  },
  {
    id: '24ts-bellingham', name: 'Jude Bellingham', shortName: 'Bellingham', seasonCode: '24TS',
    ovr: 109, position: 'CAM', positions: pos('CAM', 109, ['CM', 108], ['CDM', 104]),
    salary: 30, club: CLUBS.realMadrid, nation: NATIONS.england,
    stats: outfield(92, 98, 100, 102, 90, 100), preferredFoot: 'right', weakFoot: 4, skillMoves: 4,
    heightCm: 186, weightKg: 75,
  },
  {
    id: '24ts-haaland', name: 'Erling Haaland', shortName: 'Haaland', seasonCode: '24TS',
    ovr: 110, position: 'ST', positions: pos('ST', 110, ['CF', 107], ['LS', 109], ['RS', 109]),
    salary: 31, club: CLUBS.manCity, nation: NATIONS.norway,
    stats: outfield(104, 110, 80, 90, 55, 108), preferredFoot: 'left', weakFoot: 3, skillMoves: 3,
    heightCm: 194, weightKg: 88,
  },
  {
    id: '24ts-de-bruyne', name: 'Kevin De Bruyne', shortName: 'De Bruyne', seasonCode: '24TS',
    ovr: 108, position: 'CM', positions: pos('CM', 108, ['CAM', 108], ['LCM', 108], ['RCM', 108]),
    salary: 29, club: CLUBS.manCity, nation: NATIONS.belgium,
    stats: outfield(80, 100, 112, 98, 72, 90), preferredFoot: 'right', weakFoot: 5, skillMoves: 4,
    heightCm: 181, weightKg: 70,
  },
  {
    id: '24ts-salah', name: 'Mohamed Salah', shortName: 'Salah', seasonCode: '24TS',
    ovr: 108, position: 'RW', positions: pos('RW', 108, ['RM', 107], ['ST', 106], ['RS', 106]),
    salary: 30, club: CLUBS.liverpool, nation: NATIONS.egypt,
    stats: outfield(102, 104, 90, 104, 52, 82), preferredFoot: 'left', weakFoot: 3, skillMoves: 4,
    heightCm: 175, weightKg: 71,
  },

  /* ── DC ── */
  {
    id: 'dc-rodri', name: 'Rodri', shortName: 'Rodri', seasonCode: 'DC',
    ovr: 106, position: 'CDM', positions: pos('CDM', 106, ['CM', 104], ['LDM', 106], ['RDM', 106]),
    salary: 26, club: CLUBS.manCity, nation: NATIONS.spain,
    stats: outfield(68, 84, 98, 92, 104, 102), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 191, weightKg: 82,
  },
  {
    id: 'dc-van-dijk', name: 'Virgil van Dijk', shortName: 'Van Dijk', seasonCode: 'DC',
    ovr: 105, position: 'CB', positions: pos('CB', 105, ['LCB', 105], ['RCB', 105]),
    salary: 23, club: CLUBS.liverpool, nation: NATIONS.netherlands,
    stats: outfield(86, 62, 78, 76, 106, 106), preferredFoot: 'right', weakFoot: 3, skillMoves: 2,
    heightCm: 193, weightKg: 92,
  },
  {
    id: 'dc-courtois', name: 'Thibaut Courtois', shortName: 'Courtois', seasonCode: 'DC',
    ovr: 104, position: 'GK', positions: pos('GK', 104),
    salary: 20, club: CLUBS.realMadrid, nation: NATIONS.belgium,
    stats: keeper(102, 100, 86, 106, 52, 104), preferredFoot: 'left', weakFoot: 2, skillMoves: 1,
    heightCm: 200, weightKg: 96,
  },

  /* ── CC ── */
  {
    id: 'cc-yamal', name: 'Lamine Yamal', shortName: 'Yamal', seasonCode: 'CC',
    ovr: 105, position: 'RW', positions: pos('RW', 105, ['RM', 104], ['RAM', 104]),
    salary: 24, club: CLUBS.barcelona, nation: NATIONS.spain,
    stats: outfield(98, 90, 94, 106, 44, 70), preferredFoot: 'left', weakFoot: 4, skillMoves: 5,
    heightCm: 180, weightKg: 70,
  },
  {
    id: 'cc-lewandowski', name: 'Robert Lewandowski', shortName: 'Lewandowski', seasonCode: 'CC',
    ovr: 104, position: 'ST', positions: pos('ST', 104, ['CF', 102], ['LS', 103], ['RS', 103]),
    salary: 22, club: CLUBS.barcelona, nation: NATIONS.poland,
    stats: outfield(80, 106, 82, 92, 46, 94), preferredFoot: 'right', weakFoot: 4, skillMoves: 3,
    heightCm: 185, weightKg: 81,
  },
  {
    id: 'cc-alisson', name: 'Alisson Becker', shortName: 'Alisson', seasonCode: 'CC',
    ovr: 103, position: 'GK', positions: pos('GK', 103),
    salary: 18, club: CLUBS.liverpool, nation: NATIONS.brazil,
    stats: keeper(100, 100, 92, 102, 50, 104), preferredFoot: 'right', weakFoot: 3, skillMoves: 1,
    heightCm: 193, weightKg: 91,
  },
  {
    id: 'cc-trent', name: 'Trent Alexander-Arnold', shortName: 'Alexander-Arnold', seasonCode: 'CC',
    ovr: 100, position: 'RB', positions: pos('RB', 100, ['RWB', 100], ['RM', 96]),
    salary: 14, club: CLUBS.liverpool, nation: NATIONS.england,
    stats: outfield(84, 80, 106, 88, 84, 78), preferredFoot: 'right', weakFoot: 4, skillMoves: 3,
    heightCm: 180, weightKg: 69,
  },

  /* ── VN ── */
  {
    id: 'vn-quang-hai', name: 'Nguyễn Quang Hải', shortName: 'Quang Hải', seasonCode: 'VN',
    ovr: 92, position: 'CAM', positions: pos('CAM', 92, ['CM', 90], ['LAM', 91], ['RAM', 91]),
    salary: 8, club: CLUBS.congAnHaNoi, nation: NATIONS.vietnam,
    stats: outfield(84, 82, 90, 92, 56, 68), preferredFoot: 'left', weakFoot: 3, skillMoves: 4,
    heightCm: 168, weightKg: 62,
  },
  {
    id: 'vn-van-hau', name: 'Đoàn Văn Hậu', shortName: 'Văn Hậu', seasonCode: 'VN',
    ovr: 88, position: 'LB', positions: pos('LB', 88, ['LWB', 88], ['LM', 84]),
    salary: 6, club: CLUBS.congAnHaNoi, nation: NATIONS.vietnam,
    stats: outfield(82, 66, 80, 80, 86, 80), preferredFoot: 'left', weakFoot: 3, skillMoves: 3,
    heightCm: 186, weightKg: 77,
  },
  {
    id: 'vn-tien-linh', name: 'Nguyễn Tiến Linh', shortName: 'Tiến Linh', seasonCode: 'VN',
    ovr: 90, position: 'ST', positions: pos('ST', 90, ['CF', 88], ['LS', 89], ['RS', 89]),
    salary: 7, club: CLUBS.becamex, nation: NATIONS.vietnam,
    stats: outfield(80, 90, 70, 82, 44, 86), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 180, weightKg: 75,
  },

  /* ───────────── ICON (mở rộng) ───────────── */
  {
    id: 'icon-henry', name: 'Thierry Henry', shortName: 'Henry', seasonCode: 'ICON',
    ovr: 107, position: 'ST', positions: pos('ST', 107, ['LW', 106], ['CF', 106], ['LS', 107], ['RS', 107]),
    salary: 31, club: CLUBS.arsenal, nation: NATIONS.france,
    stats: outfield(96, 102, 88, 100, 48, 86), preferredFoot: 'right', weakFoot: 4, skillMoves: 4,
    heightCm: 188, weightKg: 83,
  },
  {
    id: 'icon-lampard', name: 'Frank Lampard', shortName: 'Lampard', seasonCode: 'ICON',
    ovr: 105, position: 'CM', positions: pos('CM', 105, ['CAM', 105], ['LCM', 105], ['RCM', 105], ['CDM', 100]),
    salary: 28, club: CLUBS.chelsea, nation: NATIONS.england,
    stats: outfield(80, 100, 98, 92, 82, 98), preferredFoot: 'right', weakFoot: 4, skillMoves: 3,
    heightCm: 184, weightKg: 88,
  },
  {
    id: 'icon-terry', name: 'John Terry', shortName: 'Terry', seasonCode: 'ICON',
    ovr: 105, position: 'CB', positions: pos('CB', 105, ['LCB', 105], ['RCB', 105]),
    salary: 25, club: CLUBS.chelsea, nation: NATIONS.england,
    stats: outfield(72, 58, 70, 68, 106, 104), preferredFoot: 'right', weakFoot: 3, skillMoves: 2,
    heightCm: 187, weightKg: 90,
  },
  {
    id: 'icon-cech', name: 'Petr Čech', shortName: 'Čech', seasonCode: 'ICON',
    ovr: 104, position: 'GK', positions: pos('GK', 104),
    salary: 21, club: CLUBS.chelsea, nation: NATIONS.czechia,
    stats: keeper(102, 100, 84, 104, 50, 103), preferredFoot: 'right', weakFoot: 2, skillMoves: 1,
    heightCm: 196, weightKg: 90,
  },
  {
    id: 'icon-roberto-carlos', name: 'Roberto Carlos', shortName: 'R. Carlos', seasonCode: 'ICON',
    ovr: 106, position: 'LB', positions: pos('LB', 106, ['LWB', 106], ['LM', 102]),
    salary: 27, club: CLUBS.realMadrid, nation: NATIONS.brazil,
    stats: outfield(96, 92, 88, 92, 92, 100), preferredFoot: 'left', weakFoot: 3, skillMoves: 3,
    heightCm: 168, weightKg: 68,
  },
  {
    id: 'icon-drogba', name: 'Didier Drogba', shortName: 'Drogba', seasonCode: 'ICON',
    ovr: 106, position: 'ST', positions: pos('ST', 106, ['CF', 103], ['LS', 105], ['RS', 105]),
    salary: 28, club: CLUBS.chelsea, nation: NATIONS.cotedivoire,
    stats: outfield(88, 102, 78, 86, 56, 108), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 189, weightKg: 91,
  },

  /* ───────────── ICONS Match (mở rộng) ───────────── */
  {
    id: 'iconm-kaka', name: 'Kaká', shortName: 'Kaká', seasonCode: 'ICONM',
    ovr: 106, position: 'CAM', positions: pos('CAM', 106, ['CM', 104], ['LAM', 106], ['RAM', 106], ['CF', 103]),
    salary: 29, club: CLUBS.acMilan, nation: NATIONS.brazil,
    stats: outfield(94, 92, 98, 104, 60, 86), preferredFoot: 'right', weakFoot: 3, skillMoves: 4,
    heightCm: 186, weightKg: 82,
  },
  {
    id: 'iconm-gerrard', name: 'Steven Gerrard', shortName: 'Gerrard', seasonCode: 'ICONM',
    ovr: 106, position: 'CM', positions: pos('CM', 106, ['CDM', 103], ['CAM', 104], ['LCM', 106], ['RCM', 106]),
    salary: 28, club: CLUBS.liverpool, nation: NATIONS.england,
    stats: outfield(82, 98, 100, 90, 90, 100), preferredFoot: 'right', weakFoot: 4, skillMoves: 3,
    heightCm: 183, weightKg: 83,
  },
  {
    id: 'iconm-cannavaro', name: 'Fabio Cannavaro', shortName: 'Cannavaro', seasonCode: 'ICONM',
    ovr: 105, position: 'CB', positions: pos('CB', 105, ['LCB', 105], ['RCB', 105]),
    salary: 26, club: CLUBS.realMadrid, nation: NATIONS.italy,
    stats: outfield(78, 45, 68, 72, 108, 96), preferredFoot: 'right', weakFoot: 2, skillMoves: 2,
    heightCm: 176, weightKg: 75,
  },

  /* ───────────── 24TS (mở rộng) ───────────── */
  {
    id: '24ts-vinicius', name: 'Vinícius Júnior', shortName: 'Vinícius Jr', seasonCode: '24TS',
    ovr: 109, position: 'LW', positions: pos('LW', 109, ['LM', 108], ['LF', 108], ['ST', 105]),
    salary: 31, club: CLUBS.realMadrid, nation: NATIONS.brazil,
    stats: outfield(110, 98, 90, 108, 42, 82), preferredFoot: 'right', weakFoot: 4, skillMoves: 5,
    heightCm: 176, weightKg: 73,
  },
  {
    id: '24ts-valverde', name: 'Federico Valverde', shortName: 'Valverde', seasonCode: '24TS',
    ovr: 106, position: 'CM', positions: pos('CM', 106, ['RM', 104], ['CDM', 104], ['LCM', 106], ['RCM', 106]),
    salary: 26, club: CLUBS.realMadrid, nation: NATIONS.uruguay,
    stats: outfield(94, 92, 94, 92, 86, 100), preferredFoot: 'right', weakFoot: 4, skillMoves: 3,
    heightCm: 182, weightKg: 78,
  },
  {
    id: '24ts-saka', name: 'Bukayo Saka', shortName: 'Saka', seasonCode: '24TS',
    ovr: 106, position: 'RW', positions: pos('RW', 106, ['RM', 105], ['RAM', 105], ['RF', 105]),
    salary: 25, club: CLUBS.arsenal, nation: NATIONS.england,
    stats: outfield(92, 92, 94, 102, 66, 76), preferredFoot: 'left', weakFoot: 3, skillMoves: 4,
    heightCm: 178, weightKg: 72,
  },

  /* ───────────── DC (mở rộng) ───────────── */
  {
    id: 'dc-casemiro', name: 'Casemiro', shortName: 'Casemiro', seasonCode: 'DC',
    ovr: 104, position: 'CDM', positions: pos('CDM', 104, ['CM', 100], ['CB', 98], ['LDM', 104], ['RDM', 104]),
    salary: 22, club: CLUBS.realMadrid, nation: NATIONS.brazil,
    stats: outfield(70, 82, 82, 76, 104, 104), preferredFoot: 'right', weakFoot: 3, skillMoves: 2,
    heightCm: 185, weightKg: 84,
  },
  {
    id: 'dc-carvajal', name: 'Dani Carvajal', shortName: 'Carvajal', seasonCode: 'DC',
    ovr: 103, position: 'RB', positions: pos('RB', 103, ['RWB', 103], ['RM', 96]),
    salary: 18, club: CLUBS.realMadrid, nation: NATIONS.spain,
    stats: outfield(86, 70, 86, 84, 100, 92), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 173, weightKg: 73,
  },
  {
    id: 'dc-rudiger', name: 'Antonio Rüdiger', shortName: 'Rüdiger', seasonCode: 'DC',
    ovr: 103, position: 'CB', positions: pos('CB', 103, ['LCB', 103], ['RCB', 103]),
    salary: 17, club: CLUBS.realMadrid, nation: NATIONS.germany,
    stats: outfield(88, 52, 68, 70, 102, 106), preferredFoot: 'right', weakFoot: 3, skillMoves: 2,
    heightCm: 190, weightKg: 85,
  },

  /* ───────────── CC (mở rộng) ───────────── */
  {
    id: 'cc-neymar', name: 'Neymar Jr', shortName: 'Neymar', seasonCode: 'CC',
    ovr: 106, position: 'LW', positions: pos('LW', 106, ['LM', 105], ['LF', 105], ['CAM', 104], ['ST', 103]),
    salary: 27, club: CLUBS.barcelona, nation: NATIONS.brazil,
    stats: outfield(96, 94, 94, 110, 44, 76), preferredFoot: 'right', weakFoot: 5, skillMoves: 5,
    heightCm: 175, weightKg: 68,
  },
  {
    id: 'cc-ter-stegen', name: 'Marc-André ter Stegen', shortName: 'Ter Stegen', seasonCode: 'CC',
    ovr: 103, position: 'GK', positions: pos('GK', 103),
    salary: 19, club: CLUBS.barcelona, nation: NATIONS.germany,
    stats: keeper(100, 98, 102, 102, 52, 102), preferredFoot: 'right', weakFoot: 3, skillMoves: 1,
    heightCm: 192, weightKg: 85,
  },
  {
    id: 'cc-pedri', name: 'Pedri', shortName: 'Pedri', seasonCode: 'CC',
    ovr: 104, position: 'CM', positions: pos('CM', 104, ['CAM', 103], ['LCM', 104], ['RCM', 104]),
    salary: 23, club: CLUBS.barcelona, nation: NATIONS.spain,
    stats: outfield(80, 80, 102, 104, 70, 70), preferredFoot: 'right', weakFoot: 4, skillMoves: 4,
    heightCm: 174, weightKg: 60,
  },

  /* ───────────── 23UCL ───────────── */
  {
    id: '23ucl-reece-james', name: 'Reece James', shortName: 'R. James', seasonCode: '23UCL',
    ovr: 102, position: 'RB', positions: pos('RB', 102, ['RWB', 102], ['RM', 98]),
    salary: 16, club: CLUBS.chelsea, nation: NATIONS.england,
    stats: outfield(90, 76, 88, 86, 98, 96), preferredFoot: 'right', weakFoot: 4, skillMoves: 3,
    heightCm: 182, weightKg: 80,
  },
  {
    id: '23ucl-kante', name: "N'Golo Kanté", shortName: 'Kanté', seasonCode: '23UCL',
    ovr: 104, position: 'CDM', positions: pos('CDM', 104, ['CM', 102], ['LDM', 104], ['RDM', 104]),
    salary: 20, club: CLUBS.chelsea, nation: NATIONS.france,
    stats: outfield(94, 66, 82, 88, 106, 98), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 168, weightKg: 70,
  },
  {
    id: '23ucl-mount', name: 'Mason Mount', shortName: 'Mount', seasonCode: '23UCL',
    ovr: 100, position: 'CAM', positions: pos('CAM', 100, ['CM', 99], ['LAM', 100], ['RAM', 100]),
    salary: 15, club: CLUBS.chelsea, nation: NATIONS.england,
    stats: outfield(82, 88, 94, 94, 70, 78), preferredFoot: 'right', weakFoot: 4, skillMoves: 4,
    heightCm: 180, weightKg: 70,
  },
  {
    id: '23ucl-thiago-silva', name: 'Thiago Silva', shortName: 'T. Silva', seasonCode: '23UCL',
    ovr: 101, position: 'CB', positions: pos('CB', 101, ['LCB', 101], ['RCB', 101]),
    salary: 14, club: CLUBS.chelsea, nation: NATIONS.brazil,
    stats: outfield(70, 50, 80, 74, 104, 94), preferredFoot: 'right', weakFoot: 3, skillMoves: 2,
    heightCm: 183, weightKg: 79,
  },

  /* ───────────── VN (mở rộng) ───────────── */
  {
    id: 'vn-van-lam', name: 'Đặng Văn Lâm', shortName: 'Văn Lâm', seasonCode: 'VN',
    ovr: 86, position: 'GK', positions: pos('GK', 86),
    salary: 7, club: CLUBS.theCongViettel, nation: NATIONS.vietnam,
    stats: keeper(86, 84, 80, 88, 48, 86), preferredFoot: 'right', weakFoot: 2, skillMoves: 1,
    heightCm: 188, weightKg: 79,
  },
  {
    id: 'vn-duy-manh', name: 'Đỗ Duy Mạnh', shortName: 'Duy Mạnh', seasonCode: 'VN',
    ovr: 87, position: 'CB', positions: pos('CB', 87, ['LCB', 87], ['RCB', 87]),
    salary: 7, club: CLUBS.haNoiFc, nation: NATIONS.vietnam,
    stats: outfield(70, 50, 64, 66, 88, 88), preferredFoot: 'right', weakFoot: 2, skillMoves: 2,
    heightCm: 180, weightKg: 75,
  },
  {
    id: 'vn-ngoc-hai', name: 'Quế Ngọc Hải', shortName: 'Ngọc Hải', seasonCode: 'VN',
    ovr: 86, position: 'CB', positions: pos('CB', 86, ['LCB', 86], ['RCB', 86]),
    salary: 6, club: CLUBS.theCongViettel, nation: NATIONS.vietnam,
    stats: outfield(68, 48, 62, 64, 87, 90), preferredFoot: 'right', weakFoot: 2, skillMoves: 2,
    heightCm: 187, weightKg: 80,
  },
  {
    id: 'vn-hoang-duc', name: 'Nguyễn Hoàng Đức', shortName: 'Hoàng Đức', seasonCode: 'VN',
    ovr: 89, position: 'CM', positions: pos('CM', 89, ['CAM', 88], ['CDM', 86], ['LCM', 89], ['RCM', 89]),
    salary: 8, club: CLUBS.theCongViettel, nation: NATIONS.vietnam,
    stats: outfield(74, 78, 88, 86, 70, 80), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 175, weightKg: 68,
  },
  {
    id: 'vn-hung-dung', name: 'Đỗ Hùng Dũng', shortName: 'Hùng Dũng', seasonCode: 'VN',
    ovr: 88, position: 'CDM', positions: pos('CDM', 88, ['CM', 86], ['LDM', 88], ['RDM', 88]),
    salary: 7, club: CLUBS.haNoiFc, nation: NATIONS.vietnam,
    stats: outfield(66, 74, 84, 80, 86, 86), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 176, weightKg: 70,
  },
  {
    id: 'vn-cong-phuong', name: 'Nguyễn Công Phượng', shortName: 'Công Phượng', seasonCode: 'VN',
    ovr: 90, position: 'LW', positions: pos('LW', 90, ['LM', 89], ['LF', 89], ['ST', 87]),
    salary: 8, club: CLUBS.hagl, nation: NATIONS.vietnam,
    stats: outfield(86, 84, 82, 90, 48, 70), preferredFoot: 'right', weakFoot: 3, skillMoves: 4,
    heightCm: 168, weightKg: 62,
  },
  {
    id: 'vn-van-toan', name: 'Nguyễn Văn Toàn', shortName: 'Văn Toàn', seasonCode: 'VN',
    ovr: 88, position: 'RW', positions: pos('RW', 88, ['RM', 87], ['RAM', 87]),
    salary: 7, club: CLUBS.hagl, nation: NATIONS.vietnam,
    stats: outfield(86, 80, 80, 88, 46, 66), preferredFoot: 'right', weakFoot: 3, skillMoves: 4,
    heightCm: 170, weightKg: 62,
  },
  {
    id: 'vn-van-thanh', name: 'Vũ Văn Thanh', shortName: 'Văn Thanh', seasonCode: 'VN',
    ovr: 86, position: 'RB', positions: pos('RB', 86, ['RWB', 86], ['RM', 82]),
    salary: 6, club: CLUBS.hagl, nation: NATIONS.vietnam,
    stats: outfield(88, 64, 76, 76, 82, 80), preferredFoot: 'right', weakFoot: 3, skillMoves: 3,
    heightCm: 172, weightKg: 66,
  },
  {
    id: '24ts-cristiano-ronaldo',
    name: 'Cristiano Ronaldo',
    shortName: 'C. RONALDO',
    seasonCode: '24TS',
    ovr: 111,
    position: 'ST',
    positions: pos('ST', 111, ['CF', 110], ['LW', 109]),
    salary: 31,
    club: CLUBS.realMadrid,
    nation: { id: 'portugal', name: 'Portugal', code: 'POR' },
    stats: outfield(107, 114, 96, 106, 48, 95),
    preferredFoot: 'right',
    weakFoot: 5,
    skillMoves: 5,
    heightCm: 187,
    weightKg: 83,
  },
  {
    id: '24ts-messi',
    name: 'Lionel Messi',
    shortName: 'L. MESSI',
    seasonCode: '24TS',
    ovr: 111,
    position: 'RW',
    positions: pos('RW', 111, ['CF', 111], ['CAM', 110]),
    salary: 31,
    club: { id: 'barcelona', name: 'FC Barcelona', shortName: 'Barcelona', leagueId: 'laliga' },
    nation: { id: 'argentina', name: 'Argentina', code: 'ARG' },
    stats: outfield(106, 112, 113, 116, 45, 80),
    preferredFoot: 'left',
    weakFoot: 4,
    skillMoves: 4,
    heightCm: 170,
    weightKg: 72,
  },
  {
    id: 'vn-do-mixi',
    name: 'Độ Mixi',
    shortName: 'ĐỘ MIXI',
    seasonCode: 'VN',
    ovr: 112,
    position: 'CAM',
    positions: pos('CAM', 112, ['ST', 111], ['CM', 110], ['RW', 110]),
    salary: 26,
    club: { id: 'mixigaming', name: 'MixiGaming FC', shortName: 'MixiGaming', leagueId: 'vleague' },
    nation: NATIONS.vietnam,
    stats: outfield(110, 113, 114, 115, 78, 92),
    preferredFoot: 'right',
    weakFoot: 5,
    skillMoves: 5,
    heightCm: 173,
    weightKg: 68,
  },
  {
    id: 'vn-truong-con-nam-dinh',
    name: 'Trường Con Nam Định',
    shortName: 'TRƯỜNG CON',
    seasonCode: 'VN',
    ovr: 112,
    position: 'LW',
    positions: pos('LW', 112, ['ST', 111], ['LM', 110], ['RW', 110]),
    salary: 25,
    club: { id: 'nam-dinh', name: 'Thép Xanh Nam Định', shortName: 'Nam Định', leagueId: 'vleague' },
    nation: NATIONS.vietnam,
    stats: outfield(114, 110, 108, 113, 65, 88),
    preferredFoot: 'right',
    weakFoot: 5,
    skillMoves: 5,
    heightCm: 175,
    weightKg: 70,
  },
  {
    id: 'vn-hoang-minh',
    name: 'Hoàng Minh',
    shortName: 'HOÀNG MINH',
    seasonCode: 'VN',
    ovr: 114,
    position: 'CM',
    positions: pos('CM', 114, ['CAM', 114], ['CDM', 112], ['ST', 112]),
    salary: 27,
    club: { id: 'mixigaming', name: 'MixiGaming FC', shortName: 'MixiGaming', leagueId: 'vleague' },
    nation: NATIONS.vietnam,
    stats: outfield(112, 114, 116, 115, 105, 110),
    preferredFoot: 'right',
    weakFoot: 5,
    skillMoves: 5,
    heightCm: 178,
    weightKg: 72,
  },
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
