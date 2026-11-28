import type {
  ClubRef,
  GoalkeeperStats,
  NationRef,
  OutfieldStats,
  Player,
  PositionRating,
  Position,
  Season,
  SeasonCategory,
  SeasonCode,
} from '@/types/fc-online';
import crawledPlayers from './crawled-players.json';

/* ───────────────────────────── Seasons (Server Việt Nam) ───────────────────────────── */

const SEASON_META: ReadonlyArray<{
  code: SeasonCode;
  name: string;
  label: string;
  category: SeasonCategory;
  year: number;
  theme: [string, string, string]; // [primary, accent, text]
}> = [
  { code: 'ICON', name: 'ICON', label: 'ICON', category: 'icon', year: 2017, theme: ['#1c1917', '#fbbf24', '#fef3c7'] },
  { code: 'ICONM', name: 'ICONS Match', label: 'ICON M', category: 'icon', year: 2021, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: 'DR', name: 'Decade Legends', label: 'DR', category: 'icon', year: 2025, theme: ['#2e1065', '#f59e0b', '#fef3c7'] },
  { code: '26DP', name: '26 Dynasty Players', label: '26DP', category: 'special', year: 2026, theme: ['#1e1b4b', '#a855f7', '#f3e8ff'] },
  { code: 'UC', name: 'Ultimate Champions', label: 'UC', category: 'special', year: 2025, theme: ['#090d16', '#eab308', '#fef08a'] },
  { code: 'SPT', name: 'Spotlight', label: 'SPT', category: 'special', year: 2025, theme: ['#31102f', '#f43f5e', '#ffe4e6'] },
  { code: 'PTG', name: 'Path to Glory', label: 'PTG', category: 'special', year: 2024, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: 'WG', name: 'World Greats', label: 'WG', category: 'special', year: 2025, theme: ['#1e293b', '#fbbf24', '#fef3c7'] },
  { code: 'FAC', name: 'FC Ambassador', label: 'FAC', category: 'special', year: 2025, theme: ['#172554', '#60a5fa', '#dbeafe'] },
  { code: '25DP', name: '25 Dynasty Players', label: '25DP', category: 'special', year: 2025, theme: ['#1e1b4b', '#c084fc', '#f3e8ff'] },
  { code: '26FSL', name: '26 FC Super League', label: '26FSL', category: 'special', year: 2026, theme: ['#450a0a', '#f87171', '#fee2e2'] },
  { code: 'FSL', name: 'FC Super League', label: 'FSL', category: 'special', year: 2025, theme: ['#450a0a', '#fb923c', '#ffedd5'] },
  { code: 'WS', name: 'World Stars', label: 'WS', category: 'special', year: 2025, theme: ['#0f172a', '#38bdf8', '#e0f2fe'] },
  { code: 'DCB', name: 'Decade Best', label: 'DCB', category: 'special', year: 2025, theme: ['#27272a', '#facc15', '#fef9c3'] },
  { code: 'CH', name: 'Champions', label: 'CH', category: 'special', year: 2025, theme: ['#3b0764', '#e879f9', '#fae8ff'] },
  { code: 'LE', name: 'Legends', label: 'LE', category: 'special', year: 2025, theme: ['#18181b', '#fbbf24', '#fef3c7'] },
  { code: 'NO7', name: 'Number 7', label: 'NO7', category: 'special', year: 2025, theme: ['#450a0a', '#facc15', '#fef9c3'] },
  { code: 'WB', name: 'World Best', label: 'WB', category: 'special', year: 2025, theme: ['#0c4a6e', '#7dd3fc', '#e0f2fe'] },
  { code: 'GRU', name: 'Greatest Runner-Ups', label: 'GRU', category: 'special', year: 2025, theme: ['#1e293b', '#94a3b8', '#f1f5f9'] },
  { code: 'BLD', name: "Ballon d'Or", label: 'BLD', category: 'special', year: 2024, theme: ['#1c1917', '#eab308', '#fef08a'] },
  { code: 'BDO', name: "Ballon d'Or Nominees", label: 'BDO', category: 'special', year: 2024, theme: ['#292524', '#d97706', '#fef3c7'] },
  { code: '24EP', name: '24 European Best', label: '24EP', category: 'special', year: 2024, theme: ['#064e3b', '#10b981', '#d1fae5'] },
  { code: 'E24', name: 'EURO 2024', label: 'E24', category: 'special', year: 2024, theme: ['#172554', '#3b82f6', '#dbeafe'] },
  { code: 'CU', name: 'Champions of Europe', label: 'CU', category: 'special', year: 2024, theme: ['#0c1a4b', '#38bdf8', '#e0f2fe'] },
  { code: 'MDL', name: 'Medalist', label: 'MDL', category: 'special', year: 2024, theme: ['#3f2e00', '#fbbf24', '#fef3c7'] },
  { code: 'EU24', name: 'EURO 2024 Star', label: 'EU24', category: 'special', year: 2024, theme: ['#1e3a8a', '#60a5fa', '#dbeafe'] },
  { code: 'LD', name: 'Legendary Numbers', label: 'LD', category: 'special', year: 2024, theme: ['#18181b', '#a1a1aa', '#f4f4f5'] },
  { code: 'UT', name: 'Unsung Heroes', label: 'UT', category: 'special', year: 2024, theme: ['#1f2937', '#34d399', '#d1fae5'] },
  { code: 'JNM', name: 'Journey Man', label: 'JNM', category: 'special', year: 2024, theme: ['#312e81', '#818cf8', '#e0e7ff'] },
  { code: 'DC', name: 'Decade', label: 'DC', category: 'special', year: 2023, theme: ['#3b0764', '#c084fc', '#f3e8ff'] },
  { code: 'FC', name: 'FC Ambassador', label: 'FC', category: 'special', year: 2023, theme: ['#065f46', '#34d399', '#d1fae5'] },
  { code: '23HW', name: '23 Hard Worker', label: '23HW', category: 'special', year: 2023, theme: ['#431407', '#fb923c', '#ffedd5'] },
  { code: 'CC', name: 'Century Club', label: 'CC', category: 'special', year: 2023, theme: ['#1e293b', '#22d3ee', '#cffafe'] },
  { code: 'HG', name: 'Home Grown', label: 'HG', category: 'special', year: 2023, theme: ['#14532d', '#4ade80', '#dcfce7'] },
  { code: 'RTN', name: 'Returnees', label: 'RTN', category: 'special', year: 2023, theme: ['#1e1b4b', '#818cf8', '#e0e7ff'] },
  { code: 'BWC', name: 'Best of World Cup', label: 'BWC', category: 'special', year: 2022, theme: ['#4c0519', '#fb7185', '#ffe4e6'] },
  { code: 'WC22', name: 'World Cup 2022', label: 'WC22', category: 'special', year: 2022, theme: ['#500724', '#f43f5e', '#ffe4e6'] },
  { code: '26TY', name: '26 Team of the Year', label: '26TY', category: 'special', year: 2026, theme: ['#0c1a4b', '#fbbf24', '#fef3c7'] },
  { code: '26TYN', name: '26 TOTY Nominees', label: '26TYN', category: 'special', year: 2026, theme: ['#172554', '#60a5fa', '#dbeafe'] },
  { code: '25TY', name: '25 Team of the Year', label: '25TY', category: 'special', year: 2025, theme: ['#0c1a4b', '#fbbf24', '#fef3c7'] },
  { code: '25TYN', name: '25 TOTY Nominees', label: '25TYN', category: 'special', year: 2025, theme: ['#172554', '#60a5fa', '#dbeafe'] },
  { code: '24TY', name: '24 Team of the Year', label: '24TY', category: 'special', year: 2024, theme: ['#0c1a4b', '#fbbf24', '#fef3c7'] },
  { code: '24TYN', name: '24 TOTY Nominees', label: '24TYN', category: 'special', year: 2024, theme: ['#172554', '#60a5fa', '#dbeafe'] },
  { code: '23TY', name: '23 Team of the Year', label: '23TY', category: 'special', year: 2023, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: '22TY', name: '22 Team of the Year', label: '22TY', category: 'special', year: 2022, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: '21TY', name: '21 Team of the Year', label: '21TY', category: 'special', year: 2021, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: '20TY', name: '20 Team of the Year', label: '20TY', category: 'special', year: 2020, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: '19TY', name: '19 Team of the Year', label: '19TY', category: 'special', year: 2019, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: '18TY', name: '18 Team of the Year', label: '18TY', category: 'special', year: 2018, theme: ['#172554', '#38bdf8', '#e0f2fe'] },
  { code: '26TS', name: '26 Team of the Season', label: '26TS', category: 'special', year: 2026, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '25TS', name: '25 Team of the Season', label: '25TS', category: 'special', year: 2025, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '24TS', name: '24 Team of the Season', label: '24TS', category: 'special', year: 2024, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '23TS', name: '23 Team of the Season', label: '23TS', category: 'special', year: 2023, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '22TS', name: '22 Team of the Season', label: '22TS', category: 'special', year: 2022, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '21TS', name: '21 Team of the Season', label: '21TS', category: 'special', year: 2021, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '20TS', name: '20 Team of the Season', label: '20TS', category: 'special', year: 2020, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '19TS', name: '19 Team of the Season', label: '19TS', category: 'special', year: 2019, theme: ['#052e16', '#4ade80', '#dcfce7'] },
  { code: '23UCL', name: '23 UEFA Champions League', label: '23UCL', category: 'special', year: 2023, theme: ['#0c1a4b', '#60a5fa', '#dbeafe'] },
  { code: 'LN', name: 'Legend of the Loan', label: 'LN', category: 'special', year: 2022, theme: ['#1e293b', '#38bdf8', '#e0f2fe'] },
  { code: 'SPL', name: 'Spotlight', label: 'SPL', category: 'special', year: 2022, theme: ['#31102f', '#e879f9', '#fae8ff'] },
  { code: 'LOL', name: 'League of Legends', label: 'LOL', category: 'special', year: 2022, theme: ['#1e1b4b', '#818cf8', '#e0e7ff'] },
  { code: 'FA', name: 'Free Agent', label: 'FA', category: 'special', year: 2022, theme: ['#1f2937', '#9ca3af', '#f3f4f6'] },
  { code: 'BTB', name: 'Back to Back', label: 'BTB', category: 'special', year: 2021, theme: ['#1e293b', '#fbbf24', '#fef3c7'] },
  { code: 'CAP', name: 'Captain', label: 'CAP', category: 'special', year: 2021, theme: ['#450a0a', '#f87171', '#fee2e2'] },
  { code: 'EBS', name: 'European Best Stars', label: 'EBS', category: 'special', year: 2021, theme: ['#172554', '#60a5fa', '#dbeafe'] },
  { code: 'UP', name: 'Unsung Players', label: 'UP', category: 'special', year: 2021, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: 'MC', name: 'Multi-League Champions', label: 'MC', category: 'special', year: 2020, theme: ['#2e1065', '#c084fc', '#f3e8ff'] },
  { code: 'VTR', name: 'Veteran', label: 'VTR', category: 'special', year: 2020, theme: ['#27272a', '#d4d4d8', '#f4f4f5'] },
  { code: 'MOG', name: 'Moments of Glory', label: 'MOG', category: 'special', year: 2020, theme: ['#3f2e00', '#facc15', '#fef9c3'] },
  { code: 'LH', name: 'Loyal Heroes', label: 'LH', category: 'special', year: 2020, theme: ['#1e3a8a', '#93c5fd', '#dbeafe'] },
  { code: 'COC', name: 'Competitor of Continents', label: 'COC', category: 'special', year: 2019, theme: ['#14532d', '#4ade80', '#dcfce7'] },
  { code: 'HOT', name: 'Heroes of the Team', label: 'HOT', category: 'special', year: 2019, theme: ['#431407', '#fb923c', '#ffedd5'] },
  { code: 'TC', name: 'Tournament Champions', label: 'TC', category: 'special', year: 2019, theme: ['#1e293b', '#38bdf8', '#e0f2fe'] },
  { code: 'GR', name: 'Golden Rookies', label: 'GR', category: 'special', year: 2019, theme: ['#3f2e00', '#fbbf24', '#fef3c7'] },
  { code: 'TT', name: 'Top Transfer', label: 'TT', category: 'special', year: 2018, theme: ['#31102f', '#f472b6', '#fce7f3'] },
  { code: 'TB', name: 'Tournament Best', label: 'TB', category: 'special', year: 2018, theme: ['#172554', '#60a5fa', '#dbeafe'] },
  { code: 'NHD', name: 'National Hero Debut', label: 'NHD', category: 'special', year: 2018, theme: ['#27272a', '#facc15', '#fef9c3'] },
  { code: '26VB', name: '26 Vietnam Best', label: '26VB', category: 'local', year: 2026, theme: ['#7f1d1d', '#facc15', '#fef9c3'] },
  { code: '25VB', name: '25 Vietnam Best', label: '25VB', category: 'local', year: 2025, theme: ['#7f1d1d', '#facc15', '#fef9c3'] },
  { code: '24VB', name: '24 Vietnam Best', label: '24VB', category: 'local', year: 2024, theme: ['#7f1d1d', '#facc15', '#fef9c3'] },
  { code: '23VB', name: '23 Vietnam Best', label: '23VB', category: 'local', year: 2023, theme: ['#7f1d1d', '#facc15', '#fef9c3'] },
  { code: '22VB', name: '22 Vietnam Best', label: '22VB', category: 'local', year: 2022, theme: ['#7f1d1d', '#facc15', '#fef9c3'] },
  { code: 'VFG', name: 'Vietnam Football Generation', label: 'VFG', category: 'local', year: 2024, theme: ['#7f1d1d', '#fb923c', '#ffedd5'] },
  { code: 'VNL', name: 'Vietnam Legends', label: 'VNL', category: 'local', year: 2023, theme: ['#7f1d1d', '#fbbf24', '#fef3c7'] },
  { code: 'VN', name: 'Vietnam', label: 'VN', category: 'local', year: 2022, theme: ['#7f1d1d', '#facc15', '#fef9c3'] },
  { code: 'PRM', name: 'Prime', label: 'PRM', category: 'local', year: 2024, theme: ['#450a0a', '#f87171', '#fee2e2'] },
  { code: '26', name: '26 Live', label: '26', category: 'regular', year: 2026, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '25', name: '25 Live', label: '25', category: 'regular', year: 2025, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '24', name: '24 Live', label: '24', category: 'regular', year: 2024, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '23', name: '23 Live', label: '23', category: 'regular', year: 2023, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '22', name: '22 Live', label: '22', category: 'regular', year: 2022, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '21', name: '21 Live', label: '21', category: 'regular', year: 2021, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '20', name: '20 Live', label: '20', category: 'regular', year: 2020, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '19', name: '19 Live', label: '19', category: 'regular', year: 2019, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '18', name: '18 Live', label: '18', category: 'regular', year: 2018, theme: ['#064e3b', '#34d399', '#d1fae5'] },
  { code: '17', name: '17 Live', label: '17', category: 'regular', year: 2017, theme: ['#064e3b', '#34d399', '#d1fae5'] },
];

export const SEASONS: readonly Season[] = SEASON_META.map((s, idx) => ({
  code: s.code,
  name: s.name,
  label: s.label,
  category: s.category,
  releaseYear: s.year,
  sortOrder: idx + 1,
  theme: { primary: s.theme[0], accent: s.theme[1], text: s.theme[2] },
}));

const DEFAULT_SEASON: Season = {
  code: '24',
  name: 'Season',
  label: 'FCO',
  category: 'special',
  releaseYear: 2024,
  sortOrder: 999,
  theme: { primary: '#1e293b', accent: '#38bdf8', text: '#e0f2fe' },
};

export const SEASONS_BY_CODE: Readonly<Record<string, Season>> = Object.fromEntries(
  SEASONS.map((s) => [s.code, s]),
);

/* ───────────────────────────── Players ───────────────────────────── */

export const PLAYERS: readonly Player[] = [
  ...(crawledPlayers as unknown as Player[]),
];

/* ───────────────────────────── Lookups ───────────────────────────── */

export const PLAYERS_BY_ID: Readonly<Record<string, Player>> = Object.fromEntries(
  PLAYERS.map((p) => [p.id, p]),
);

export function getPlayer(id: string): Player | undefined {
  return PLAYERS_BY_ID[id];
}

export function getSeason(code: SeasonCode): Season {
  return SEASONS_BY_CODE[code] ?? { ...DEFAULT_SEASON, code, label: code, name: code };
}