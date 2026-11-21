/**
 * src/types/fc-online.ts
 * ---------------------------------------------------------------------------
 * Toàn bộ kiểu dữ liệu cốt lõi cho FC Online Squad Builder & Salary Cap Calculator.
 * Quy ước:
 *  - Mọi interface đều `readonly` ở các trường dữ liệu tĩnh (Player, Season, Formation...)
 *    để an toàn khi dùng chung với Zustand + immer (chỉ SquadSlot là dữ liệu mutable).
 *  - Toạ độ pitch: x ∈ [0,100] trái → phải, y ∈ [0,100] trên → dưới.
 *    y = 0 là khung thành đối phương (hướng tấn công), y = 100 là khung thành nhà.
 */

/* ───────────────────────────── Coordinates ───────────────────────────── */

export interface Coordinates {
  /** 0 (cạnh trái) → 100 (cạnh phải), đơn vị % của pitch */
  readonly x: number;
  /** 0 (khung thành đối phương) → 100 (khung thành nhà), đơn vị % của pitch */
  readonly y: number;
}

/* ───────────────────────────── Position ───────────────────────────── */

export const POSITIONS = [
  'GK',
  'SW',
  'RWB', 'RB', 'RCB', 'CB', 'LCB', 'LB', 'LWB',
  'RDM', 'CDM', 'LDM',
  'RM', 'RCM', 'CM', 'LCM', 'LM',
  'RAM', 'CAM', 'LAM',
  'RF', 'CF', 'LF',
  'RW', 'RS', 'ST', 'LS', 'LW',
] as const;

export type Position = (typeof POSITIONS)[number];

export type PositionGroup = 'GK' | 'DF' | 'MF' | 'FW';

export const POSITION_GROUP: Readonly<Record<Position, PositionGroup>> = {
  GK: 'GK',
  SW: 'DF', RWB: 'DF', RB: 'DF', RCB: 'DF', CB: 'DF', LCB: 'DF', LB: 'DF', LWB: 'DF',
  RDM: 'MF', CDM: 'MF', LDM: 'MF', RM: 'MF', RCM: 'MF', CM: 'MF', LCM: 'MF', LM: 'MF',
  RAM: 'MF', CAM: 'MF', LAM: 'MF',
  RF: 'FW', CF: 'FW', LF: 'FW', RW: 'FW', RS: 'FW', ST: 'FW', LS: 'FW', LW: 'FW',
};

/** OVR của cầu thủ khi chơi ở một vị trí cụ thể (vị trí phụ có thể khác vị trí chính). */
export interface PositionRating {
  readonly position: Position;
  readonly ovr: number;
}

/* ───────────────────────────── Season ───────────────────────────── */

export type SeasonCode = 'ICON' | 'ICONM' | '24TS' | '23UCL' | 'DC' | 'CC' | 'VN';

export type SeasonCategory = 'icon' | 'special' | 'regular' | 'local';

export interface SeasonTheme {
  /** Màu nền chính của thẻ (hex) */
  readonly primary: string;
  /** Màu viền / điểm nhấn (hex) */
  readonly accent: string;
  /** Màu chữ trên thẻ (hex) */
  readonly text: string;
}

export interface Season {
  readonly code: SeasonCode;
  /** Tên hiển thị đầy đủ, ví dụ "ICONS Match" */
  readonly name: string;
  /** Nhãn ngắn hiển thị trên badge */
  readonly label: string;
  readonly category: SeasonCategory;
  readonly releaseYear: number;
  /** Thứ tự ưu tiên khi sort/filter (số nhỏ = hiển thị trước) */
  readonly sortOrder: number;
  readonly theme: SeasonTheme;
}

/* ───────────────────────────── Club / Nation ───────────────────────────── */

export interface ClubRef {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly leagueId: string;
}

export interface NationRef {
  readonly id: string;
  readonly name: string;
  /** Mã ISO 3166-1 alpha-3, ví dụ "FRA" */
  readonly code: string;
}

/* ───────────────────────────── Stats ───────────────────────────── */

export interface OutfieldStats {
  readonly kind: 'outfield';
  readonly pace: number;
  readonly shooting: number;
  readonly passing: number;
  readonly dribbling: number;
  readonly defending: number;
  readonly physical: number;
}

export interface GoalkeeperStats {
  readonly kind: 'gk';
  readonly diving: number;
  readonly handling: number;
  readonly kicking: number;
  readonly reflexes: number;
  readonly speed: number;
  readonly positioning: number;
}

export type PlayerStats = OutfieldStats | GoalkeeperStats;

/* ───────────────────────────── Player ───────────────────────────── */

export type PreferredFoot = 'left' | 'right';

/** Thang 1–5 sao */
export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly seasonCode: SeasonCode;
  /** OVR cơ bản tại vị trí chính, chưa cộng cấp cường hoá / Team Color */
  readonly ovr: number;
  readonly position: Position;
  /** Danh sách vị trí chơi được (bao gồm vị trí chính ở phần tử đầu tiên) */
  readonly positions: readonly PositionRating[];
  /** Mức lương (cân lương), khoảng 6 → 32 */
  readonly salary: number;
  readonly club: ClubRef;
  readonly nation: NationRef;
  readonly stats: PlayerStats;
  readonly preferredFoot: PreferredFoot;
  readonly weakFoot: StarRating;
  readonly skillMoves: StarRating;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly imageUrl?: string;
}

/* ───────────────────────────── Enhancement ───────────────────────────── */

export const ENHANCEMENT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

export type EnhancementLevel = (typeof ENHANCEMENT_LEVELS)[number];

export const DEFAULT_ENHANCEMENT: EnhancementLevel = 1;

/**
 * OVR cộng thêm theo cấp cường hoá.
 * ⚠️ Giá trị mang tính placeholder — hãy đối chiếu bảng chính thức của game trước khi release.
 */
export const ENHANCEMENT_OVR_BONUS: Readonly<Record<EnhancementLevel, number>> = {
  1: 0, 2: 1, 3: 2, 4: 3, 5: 5, 6: 6, 7: 7, 8: 9, 9: 11, 10: 13, 11: 15, 12: 17, 13: 19,
};

/* ───────────────────────────── Formation ───────────────────────────── */

export type FormationId = '4-2-2-2' | '4-1-2-3' | '4-2-3-1' | '4-3-3' | '3-5-2' | '5-2-3';

export interface FormationSlot {
  /** Unique trong 1 formation (dùng làm key cho dnd-kit droppable + URL state) */
  readonly slotId: string;
  readonly position: Position;
  readonly coordinates: Coordinates;
}

export interface Formation {
  readonly id: FormationId;
  readonly name: string;
  /** Luôn đúng 11 slot, phần tử đầu tiên là GK */
  readonly slots: readonly FormationSlot[];
}

/* ───────────────────────────── Squad ───────────────────────────── */

/** Slot trên pitch ở runtime: kế thừa vị trí/toạ độ từ Formation + cầu thủ được gán. */
export interface SquadSlot {
  slotId: string;
  position: Position;
  coordinates: Coordinates;
  /** null = slot trống */
  playerId: string | null;
  enhancement: EnhancementLevel;
}

export const DEFAULT_SALARY_CAP = 270;

export interface Squad {
  formationId: FormationId;
  slots: SquadSlot[];
  salaryCap: number;
}

export interface SquadSummary {
  readonly filledSlots: number;
  readonly totalSalary: number;
  readonly salaryCap: number;
  /** salaryCap - totalSalary (âm nếu vượt cân) */
  readonly remainingSalary: number;
  readonly isOverCap: boolean;
  /** Trung bình OVR gốc + cường hoá, chưa tính Team Color */
  readonly baseTeamOvr: number;
  /** Trung bình OVR sau khi cộng Team Color */
  readonly teamOvr: number;
}

/** Snapshot rút gọn để nén bằng LZ-string và đưa lên URL query param. */
export interface SquadSnapshot {
  /** schema version */
  readonly v: 1;
  /** formationId */
  readonly f: FormationId;
  /** [slotId, playerId, enhancement] */
  readonly s: ReadonlyArray<readonly [string, string, EnhancementLevel]>;
  /** salaryCap (giới hạn lương) — tuỳ chọn để tương thích ngược */
  readonly c?: number;
}

/* ───────────────────────────── Team Color ───────────────────────────── */

/** 'enhancement' = Team Color theo cấp thẻ (Đội hình Bạc / Vàng) */
export type TeamColorKind = 'club' | 'nation' | 'league' | 'season' | 'enhancement';

export interface TeamColorTier {
  /** Số cầu thủ tối thiểu khớp điều kiện để kích hoạt bậc này */
  readonly minPlayers: number;
  /** OVR cộng thêm cho cầu thủ được hưởng buff */
  readonly ovrBonus: number;
}

export interface TeamColorBuff {
  readonly id: string;
  readonly kind: TeamColorKind;
  /** id của club / nation / league hoặc SeasonCode tuỳ theo `kind` */
  readonly targetId: string;
  readonly label: string;
  /** Sắp xếp tăng dần theo minPlayers */
  readonly tiers: readonly TeamColorTier[];
  /** matching-players: chỉ cầu thủ khớp được buff; all-players: toàn đội */
  readonly appliesTo: 'matching-players' | 'all-players';
  /** Giới hạn nhóm vị trí được hưởng buff (bỏ trống = tất cả) */
  readonly positionGroups?: readonly PositionGroup[];
}

/** Kết quả engine tính toán Team Color cho squad hiện tại. */
export interface ActiveTeamColor {
  readonly buff: TeamColorBuff;
  readonly matchingCount: number;
  /** null nếu chưa đạt bậc nào */
  readonly activeTier: TeamColorTier | null;
  readonly nextTier: TeamColorTier | null;
}