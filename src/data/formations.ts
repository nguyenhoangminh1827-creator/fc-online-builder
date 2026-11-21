/**
 * src/data/formations.ts
 * ---------------------------------------------------------------------------
 * Toạ độ chuẩn (x, y theo %) cho các sơ đồ phổ biến.
 * Pitch dọc: y = 0 là khung thành đối phương (trên), y = 100 là khung thành nhà (dưới).
 * Mỗi sơ đồ có đúng 11 slot, slot đầu tiên là GK. `slotId` = mã vị trí (unique trong sơ đồ).
 */

import type { Formation, FormationId, FormationSlot, Position } from '@/types/fc-online';

const slot = (position: Position, x: number, y: number): FormationSlot => ({
  slotId: position,
  position,
  coordinates: { x, y },
});

const GK = slot('GK', 50, 90);

export const FORMATIONS: readonly Formation[] = [
  {
    id: '4-2-2-2',
    name: '4-2-2-2',
    slots: [
      GK,
      slot('LB', 14, 72), slot('LCB', 37, 76), slot('RCB', 63, 76), slot('RB', 86, 72),
      slot('LDM', 36, 58), slot('RDM', 64, 58),
      slot('LAM', 24, 38), slot('RAM', 76, 38),
      slot('LS', 38, 15), slot('RS', 62, 15),
    ],
  },
  {
    id: '4-1-2-3',
    name: '4-1-2-3',
    slots: [
      GK,
      slot('LB', 14, 72), slot('LCB', 37, 76), slot('RCB', 63, 76), slot('RB', 86, 72),
      slot('CDM', 50, 60),
      slot('LCM', 31, 47), slot('RCM', 69, 47),
      slot('LW', 16, 22), slot('ST', 50, 13), slot('RW', 84, 22),
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    slots: [
      GK,
      slot('LB', 14, 72), slot('LCB', 37, 76), slot('RCB', 63, 76), slot('RB', 86, 72),
      slot('LDM', 37, 59), slot('RDM', 63, 59),
      slot('LAM', 20, 38), slot('CAM', 50, 36), slot('RAM', 80, 38),
      slot('ST', 50, 13),
    ],
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    slots: [
      GK,
      slot('LB', 14, 72), slot('LCB', 37, 76), slot('RCB', 63, 76), slot('RB', 86, 72),
      slot('LCM', 29, 50), slot('CM', 50, 54), slot('RCM', 71, 50),
      slot('LW', 16, 22), slot('ST', 50, 13), slot('RW', 84, 22),
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    slots: [
      GK,
      slot('LCB', 27, 76), slot('CB', 50, 79), slot('RCB', 73, 76),
      slot('LM', 10, 50), slot('LCM', 33, 56), slot('CAM', 50, 40), slot('RCM', 67, 56), slot('RM', 90, 50),
      slot('LS', 38, 15), slot('RS', 62, 15),
    ],
  },
  {
    id: '5-2-3',
    name: '5-2-3',
    slots: [
      GK,
      slot('LWB', 10, 64), slot('LCB', 29, 76), slot('CB', 50, 79), slot('RCB', 71, 76), slot('RWB', 90, 64),
      slot('LCM', 36, 50), slot('RCM', 64, 50),
      slot('LW', 16, 22), slot('ST', 50, 13), slot('RW', 84, 22),
    ],
  },
];

export const DEFAULT_FORMATION_ID: FormationId = '4-2-2-2';

export const FORMATIONS_BY_ID: Readonly<Record<FormationId, Formation>> = Object.fromEntries(
  FORMATIONS.map((f) => [f.id, f]),
) as Record<FormationId, Formation>;

export function getFormation(id: FormationId): Formation {
  return FORMATIONS_BY_ID[id];
}

export function isFormationId(value: string): value is FormationId {
  return value in FORMATIONS_BY_ID;
}