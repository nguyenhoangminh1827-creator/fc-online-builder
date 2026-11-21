/**
 * src/lib/ovr-calculator.ts
 * ---------------------------------------------------------------------------
 * Các hàm thuần (pure) tính OVR thực tế của một cầu thủ trong đội hình:
 *   OVR thực tế = OVR gốc + bonus cấp thẻ (+1..+13) + bonus huấn luyện (0..5)
 *               + chênh lệch vị trí + bonus Team Color
 *
 * ⚠️ Các bảng bonus (huấn luyện, hệ số phạt lệch vị trí) là giá trị placeholder
 *    có thể cấu hình — đối chiếu với số liệu chính thức của game trước khi release.
 */

import {
  ENHANCEMENT_LEVELS,
  ENHANCEMENT_OVR_BONUS,
  type Coordinates,
  type EnhancementLevel,
  type Player,
  type Position,
} from '@/types/fc-online';

/* ───────────────────────────── Training level ───────────────────────────── */

/** 0 = chưa huấn luyện, 1..5 = cấp độ huấn luyện */
export const TRAINING_LEVELS = [0, 1, 2, 3, 4, 5] as const;

export type TrainingLevel = (typeof TRAINING_LEVELS)[number];

export const DEFAULT_TRAINING_LEVEL: TrainingLevel = 0;

/** OVR cộng thêm theo cấp huấn luyện (placeholder). */
export const TRAINING_OVR_BONUS: Readonly<Record<TrainingLevel, number>> = {
  0: 0,
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
};

export function isEnhancementLevel(value: unknown): value is EnhancementLevel {
  return typeof value === 'number' && (ENHANCEMENT_LEVELS as readonly number[]).includes(value);
}

export function isTrainingLevel(value: unknown): value is TrainingLevel {
  return typeof value === 'number' && (TRAINING_LEVELS as readonly number[]).includes(value);
}

export function getEnhancementBonus(level: EnhancementLevel): number {
  return ENHANCEMENT_OVR_BONUS[level];
}

export function getTrainingBonus(level: TrainingLevel): number {
  return TRAINING_OVR_BONUS[level];
}

/** OVR của thẻ sau cường hoá + huấn luyện (chưa tính vị trí / Team Color). */
export function calculateCardOvr(
  baseOvr: number,
  enhancement: EnhancementLevel,
  trainingLevel: TrainingLevel = DEFAULT_TRAINING_LEVEL,
): number {
  return baseOvr + getEnhancementBonus(enhancement) + getTrainingBonus(trainingLevel);
}

/* ───────────────────────────── Position fit ───────────────────────────── */

/** Toạ độ "neo" của mỗi vị trí trên pitch (cùng hệ trục với Formation: x trái→phải, y trên→dưới). */
export const POSITION_ANCHORS: Readonly<Record<Position, Coordinates>> = {
  GK: { x: 50, y: 90 },
  SW: { x: 50, y: 82 },
  CB: { x: 50, y: 78 },
  LCB: { x: 35, y: 77 },
  RCB: { x: 65, y: 77 },
  LB: { x: 14, y: 72 },
  RB: { x: 86, y: 72 },
  LWB: { x: 10, y: 64 },
  RWB: { x: 90, y: 64 },
  CDM: { x: 50, y: 60 },
  LDM: { x: 36, y: 59 },
  RDM: { x: 64, y: 59 },
  CM: { x: 50, y: 52 },
  LCM: { x: 33, y: 52 },
  RCM: { x: 67, y: 52 },
  LM: { x: 10, y: 48 },
  RM: { x: 90, y: 48 },
  CAM: { x: 50, y: 38 },
  LAM: { x: 24, y: 38 },
  RAM: { x: 76, y: 38 },
  CF: { x: 50, y: 26 },
  LF: { x: 35, y: 24 },
  RF: { x: 65, y: 24 },
  LW: { x: 14, y: 22 },
  RW: { x: 86, y: 22 },
  ST: { x: 50, y: 14 },
  LS: { x: 38, y: 14 },
  RS: { x: 62, y: 14 },
};

/** Cứ mỗi N đơn vị khoảng cách trên pitch = -1 OVR khi đá trái vị trí. */
export const OUT_OF_POSITION_DISTANCE_PER_POINT = 5;
/** Mức phạt tối đa cho cầu thủ outfield đá trái vị trí outfield khác. */
export const MAX_OUT_OF_POSITION_PENALTY = 25;
/** Phạt khi thủ môn đá ngoài sân hoặc cầu thủ ngoài sân đứng gôn. */
export const GOALKEEPER_MISMATCH_PENALTY = 40;

export type PositionFitKind = 'natural' | 'alternate' | 'out-of-position';

export interface PositionFit {
  readonly slotPosition: Position;
  /** natural: vị trí chính | alternate: vị trí phụ có trong thẻ | out-of-position: trái vị trí */
  readonly kind: PositionFitKind;
  /** OVR cơ bản của cầu thủ khi đứng ở vị trí này (chưa cộng cường hoá/huấn luyện) */
  readonly ovrAtPosition: number;
  /** ovrAtPosition - player.ovr (≤ 0 trong hầu hết trường hợp) */
  readonly delta: number;
}

/** Mức phạt ước lượng khi chuyển từ vị trí `from` sang `to` (số dương, 0 nếu trùng). */
export function estimatePositionPenalty(from: Position, to: Position): number {
  if (from === to) return 0;
  if ((from === 'GK') !== (to === 'GK')) return GOALKEEPER_MISMATCH_PENALTY;
  const a = POSITION_ANCHORS[from];
  const b = POSITION_ANCHORS[to];
  const distance = Math.hypot(a.x - b.x, a.y - b.y);
  const raw = Math.round(distance / OUT_OF_POSITION_DISTANCE_PER_POINT);
  return Math.min(MAX_OUT_OF_POSITION_PENALTY, Math.max(1, raw));
}

/**
 * Xác định mức độ phù hợp của cầu thủ khi đặt vào `slotPosition`.
 * - Nếu vị trí nằm trong `player.positions` → dùng đúng OVR của thẻ tại vị trí đó.
 * - Nếu không → lấy vị trí gần nhất trong thẻ (đã tính OVR vị trí đó) rồi trừ phạt theo khoảng cách.
 */
export function getPositionFit(player: Player, slotPosition: Position): PositionFit {
  const listed = player.positions.find((p) => p.position === slotPosition);
  if (listed) {
    return {
      slotPosition,
      kind: slotPosition === player.position ? 'natural' : 'alternate',
      ovrAtPosition: listed.ovr,
      delta: listed.ovr - player.ovr,
    };
  }

  let bestDelta = -Infinity;
  for (const rating of player.positions) {
    const delta = rating.ovr - player.ovr - estimatePositionPenalty(rating.position, slotPosition);
    if (delta > bestDelta) bestDelta = delta;
  }
  if (!Number.isFinite(bestDelta)) {
    bestDelta = -estimatePositionPenalty(player.position, slotPosition);
  }

  return {
    slotPosition,
    kind: 'out-of-position',
    ovrAtPosition: player.ovr + bestDelta,
    delta: bestDelta,
  };
}

/** Điểm chênh lệch OVR khi xếp cầu thủ vào `slotPosition` (0 = đúng sở trường, âm = bị trừ). */
export function calculatePositionDelta(player: Player, slotPosition: Position): number {
  return getPositionFit(player, slotPosition).delta;
}

/* ───────────────────────────── Card tier ───────────────────────────── */

export type CardTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/** Cấp thẻ tối thiểu của từng tier. Bronze/Base: +1 → +4. */
export const SILVER_MIN_LEVEL: EnhancementLevel = 5;
export const GOLD_MIN_LEVEL: EnhancementLevel = 8;
export const PLATINUM_MIN_LEVEL: EnhancementLevel = 11;

export interface CardTierInfo {
  readonly tier: CardTier;
  readonly label: string;
  readonly labelVi: string;
  readonly minLevel: EnhancementLevel;
  readonly maxLevel: EnhancementLevel;
  /** Các màu (hex) dùng cho CSS gradient, từ trái sang phải */
  readonly gradient: readonly string[];
  readonly border: string;
  readonly text: string;
  /** Platinum +11..+13 hiển thị hiệu ứng cầu vồng */
  readonly isRainbow: boolean;
}

export const CARD_TIERS: readonly CardTierInfo[] = [
  {
    tier: 'bronze', label: 'Bronze', labelVi: 'Đồng / Cơ bản',
    minLevel: 1, maxLevel: 4,
    gradient: ['#78350f', '#b45309'], border: '#d97706', text: '#fef3c7', isRainbow: false,
  },
  {
    tier: 'silver', label: 'Silver', labelVi: 'Bạc',
    minLevel: SILVER_MIN_LEVEL, maxLevel: 7,
    gradient: ['#64748b', '#e2e8f0'], border: '#f1f5f9', text: '#0f172a', isRainbow: false,
  },
  {
    tier: 'gold', label: 'Gold', labelVi: 'Vàng',
    minLevel: GOLD_MIN_LEVEL, maxLevel: 10,
    gradient: ['#a16207', '#facc15'], border: '#fde047', text: '#422006', isRainbow: false,
  },
  {
    tier: 'platinum', label: 'Platinum / Rainbow', labelVi: 'Bạch kim / Cầu vồng',
    minLevel: PLATINUM_MIN_LEVEL, maxLevel: 13,
    gradient: ['#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#4ade80'],
    border: '#ffffff', text: '#0b1020', isRainbow: true,
  },
];

/** Tier màu thẻ theo cấp cường hoá. */
export function getCardTier(level: EnhancementLevel): CardTierInfo {
  for (let i = CARD_TIERS.length - 1; i >= 0; i--) {
    if (level >= CARD_TIERS[i].minLevel) return CARD_TIERS[i];
  }
  return CARD_TIERS[0];
}

export function formatEnhancement(level: EnhancementLevel): string {
  return `+${level}`;
}

/* ───────────────────────────── Effective OVR ───────────────────────────── */

export interface EffectiveOvrInput {
  readonly player: Player;
  readonly enhancement: EnhancementLevel;
  readonly trainingLevel?: TrainingLevel;
  /** Vị trí slot trên sân; bỏ trống nếu không xét lệch vị trí (ví dụ cầu thủ dự bị) */
  readonly slotPosition?: Position;
  /** Tổng OVR từ Team Color (mặc định 0) */
  readonly teamColorBonus?: number;
}

export interface EffectiveOvrBreakdown {
  readonly baseOvr: number;
  readonly enhancementBonus: number;
  readonly trainingBonus: number;
  readonly positionDelta: number;
  readonly positionFit: PositionFit | null;
  readonly teamColorBonus: number;
  /** base + cường hoá + huấn luyện + lệch vị trí (tối thiểu 1) — chưa gồm Team Color */
  readonly ovrBeforeTeamColor: number;
  readonly finalOvr: number;
}

export function calculateEffectiveOvr(input: EffectiveOvrInput): EffectiveOvrBreakdown {
  const { player, enhancement, slotPosition } = input;
  const trainingLevel = input.trainingLevel ?? DEFAULT_TRAINING_LEVEL;
  const teamColorBonus = input.teamColorBonus ?? 0;

  const enhancementBonus = getEnhancementBonus(enhancement);
  const trainingBonus = getTrainingBonus(trainingLevel);
  const positionFit = slotPosition ? getPositionFit(player, slotPosition) : null;
  const positionDelta = positionFit ? positionFit.delta : 0;

  const ovrBeforeTeamColor = Math.max(
    1,
    player.ovr + enhancementBonus + trainingBonus + positionDelta,
  );

  return {
    baseOvr: player.ovr,
    enhancementBonus,
    trainingBonus,
    positionDelta,
    positionFit,
    teamColorBonus,
    ovrBeforeTeamColor,
    finalOvr: ovrBeforeTeamColor + teamColorBonus,
  };
}