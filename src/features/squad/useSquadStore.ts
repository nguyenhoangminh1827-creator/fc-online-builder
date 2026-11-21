'use client';

/**
 * src/features/squad/useSquadStore.ts
 * ---------------------------------------------------------------------------
 * Zustand store (immer + persist → localStorage) cho Squad Builder.
 *
 *  - 11 slot đá chính (`slots`, kế thừa `SquadSlot` của Phase 1 + `trainingLevel`)
 *  - Danh sách dự bị (`bench`, BENCH_SIZE slot: id `bench-0` … `bench-6`)
 *  - Đổi sơ đồ: giữ cầu thủ ở vị trí trùng mã → xếp lại cầu thủ còn lại vào slot trống
 *    phù hợp nhất → phần dư chuyển xuống dự bị (hết chỗ thì bỏ).
 *  - Chỉ số real-time (lương, OVR, BP, Team Color) là dữ liệu dẫn xuất:
 *    dùng `useSquadMetrics()` hoặc `computeSquadMetrics()` thay vì lưu vào state.
 *
 * SSR/Next.js: store dùng `skipHydration`. Gọi `useSquadHydration()` một lần ở client
 * (ví dụ trong layout của squad-builder) để nạp dữ liệu từ localStorage, tránh lệch hydration.
 */

import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { getBpValue } from '@/data/bp-prices';
import { DEFAULT_FORMATION_ID, getFormation, isFormationId } from '@/data/formations';
import { getPlayer } from '@/data/players';
import {
  evaluateTeamColors,
  type TeamColorEntry,
  type TeamColorResult,
} from '@/features/team-color/teamColorEngine';
import {
  DEFAULT_TRAINING_LEVEL,
  calculateEffectiveOvr,
  getPositionFit,
  isEnhancementLevel,
  isTrainingLevel,
  type EffectiveOvrBreakdown,
  type TrainingLevel,
} from '@/lib/ovr-calculator';
import {
  DEFAULT_ENHANCEMENT,
  DEFAULT_SALARY_CAP,
  type EnhancementLevel,
  type FormationId,
  type SquadSlot,
  type SquadSnapshot,
  type SquadSummary,
} from '@/types/fc-online';

/* ───────────────────────────── Constants ───────────────────────────── */

export const BENCH_SIZE = 7;
export const MIN_SALARY_CAP = 1;
export const MAX_SALARY_CAP = 999;
/** Khi đổi sơ đồ, chỉ tự xếp cầu thủ vào slot khác mã nếu bị trừ không quá số điểm này. */
export const FORMATION_REASSIGN_MAX_PENALTY = 6;
export const PERSIST_KEY = 'fc-online-squad';

export const benchSlotId = (index: number): string => `bench-${index}`;
export const isBenchSlotId = (slotId: string): boolean => slotId.startsWith('bench-');

/* ───────────────────────────── Types ───────────────────────────── */

/** Slot đá chính = SquadSlot (Phase 1) + cấp huấn luyện. */
export interface StarterSlot extends SquadSlot {
  trainingLevel: TrainingLevel;
}

export interface BenchSlot {
  slotId: string;
  playerId: string | null;
  enhancement: EnhancementLevel;
  trainingLevel: TrainingLevel;
}

interface Placement {
  playerId: string;
  enhancement: EnhancementLevel;
  trainingLevel: TrainingLevel;
}

type AnySlot = StarterSlot | BenchSlot;

export interface SquadData {
  formationId: FormationId;
  slots: StarterSlot[];
  bench: BenchSlot[];
  salaryCap: number;
}

export interface AddPlayerOptions {
  enhancement?: EnhancementLevel;
  trainingLevel?: TrainingLevel;
}

export interface SquadActions {
  /** Đổi sơ đồ, tự giữ lại cầu thủ ở các vị trí tương ứng. */
  setFormation: (formationId: FormationId) => void;
  /**
   * Đặt cầu thủ vào slot (đá chính hoặc dự bị). Nếu cầu thủ đã có trong đội hình,
   * hai slot sẽ hoán đổi; nếu slot đích đang có người khác (cầu thủ mới từ ngoài vào) thì bị thay thế.
   */
  addPlayerToSlot: (slotId: string, playerId: string, options?: AddPlayerOptions) => void;
  removePlayer: (slotId: string) => void;
  /** Hoán đổi toàn bộ nội dung (cầu thủ + cấp thẻ + huấn luyện) của 2 slot bất kỳ. */
  swapSlots: (slotIdA: string, slotIdB: string) => void;
  setEnhancement: (slotId: string, level: EnhancementLevel) => void;
  setTrainingLevel: (slotId: string, level: TrainingLevel) => void;
  setSalaryCap: (cap: number) => void;
  /** Xoá toàn bộ cầu thủ, giữ nguyên sơ đồ và giới hạn lương. */
  resetSquad: () => void;
  /** Khôi phục mặc định hoàn toàn (4-2-2-2, lương 270, đội hình trống). */
  resetAll: () => void;
  /**
   * Nạp đội hình từ snapshot (URL state). Bỏ qua cầu thủ không hợp lệ/trùng lặp.
   * Trả về số cầu thủ đã nạp (đá chính + dự bị), hoặc `null` nếu snapshot không hợp lệ (sai version/sơ đồ).
   */
  loadSnapshot: (snapshot: SquadSnapshot) => number | null;
}

export type SquadStore = SquadData & SquadActions;

/* ───────────────────────────── Pure helpers ───────────────────────────── */

export function clampSalaryCap(cap: number): number {
  return Math.min(MAX_SALARY_CAP, Math.max(MIN_SALARY_CAP, Math.round(cap)));
}

function createEmptyStarters(formationId: FormationId): StarterSlot[] {
  return getFormation(formationId).slots.map((slot) => ({
    slotId: slot.slotId,
    position: slot.position,
    coordinates: { x: slot.coordinates.x, y: slot.coordinates.y },
    playerId: null,
    enhancement: DEFAULT_ENHANCEMENT,
    trainingLevel: DEFAULT_TRAINING_LEVEL,
  }));
}

function createEmptyBench(): BenchSlot[] {
  return Array.from({ length: BENCH_SIZE }, (_, i) => ({
    slotId: benchSlotId(i),
    playerId: null,
    enhancement: DEFAULT_ENHANCEMENT,
    trainingLevel: DEFAULT_TRAINING_LEVEL,
  }));
}

export function createInitialSquadData(): SquadData {
  return {
    formationId: DEFAULT_FORMATION_ID,
    slots: createEmptyStarters(DEFAULT_FORMATION_ID),
    bench: createEmptyBench(),
    salaryCap: DEFAULT_SALARY_CAP,
  };
}

function findSlot(data: SquadData, slotId: string): AnySlot | undefined {
  return data.slots.find((s) => s.slotId === slotId) ?? data.bench.find((b) => b.slotId === slotId);
}

function findPlayerSlotId(data: SquadData, playerId: string): string | undefined {
  const starter = data.slots.find((s) => s.playerId === playerId);
  if (starter) return starter.slotId;
  return data.bench.find((b) => b.playerId === playerId)?.slotId;
}

function readPlacement(slot: AnySlot): Placement | null {
  if (slot.playerId === null) return null;
  return {
    playerId: slot.playerId,
    enhancement: slot.enhancement,
    trainingLevel: slot.trainingLevel,
  };
}

function writePlacement(slot: AnySlot, placement: Placement | null): void {
  slot.playerId = placement ? placement.playerId : null;
  slot.enhancement = placement ? placement.enhancement : DEFAULT_ENHANCEMENT;
  slot.trainingLevel = placement ? placement.trainingLevel : DEFAULT_TRAINING_LEVEL;
}

function swapPlacements(data: SquadData, slotIdA: string, slotIdB: string): void {
  if (slotIdA === slotIdB) return;
  const a = findSlot(data, slotIdA);
  const b = findSlot(data, slotIdB);
  if (!a || !b) return;
  const placementA = readPlacement(a);
  const placementB = readPlacement(b);
  writePlacement(a, placementB);
  writePlacement(b, placementA);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Dựng lại SquadData hợp lệ từ dữ liệu không tin cậy (localStorage cũ / hỏng). */
function sanitizeSquadData(raw: unknown): SquadData | null {
  if (!isRecord(raw)) return null;

  const formationId: FormationId =
    typeof raw.formationId === 'string' && isFormationId(raw.formationId)
      ? raw.formationId
      : DEFAULT_FORMATION_ID;
  const slots = createEmptyStarters(formationId);
  const bench = createEmptyBench();
  const used = new Set<string>();

  const fill = (target: AnySlot, source: Record<string, unknown>): void => {
    const { playerId, enhancement, trainingLevel } = source;
    if (typeof playerId !== 'string' || used.has(playerId) || !getPlayer(playerId)) return;
    used.add(playerId);
    writePlacement(target, {
      playerId,
      enhancement: isEnhancementLevel(enhancement) ? enhancement : DEFAULT_ENHANCEMENT,
      trainingLevel: isTrainingLevel(trainingLevel) ? trainingLevel : DEFAULT_TRAINING_LEVEL,
    });
  };

  if (Array.isArray(raw.slots)) {
    for (const item of raw.slots) {
      if (!isRecord(item)) continue;
      const target = slots.find((s) => s.slotId === item.slotId);
      if (target) fill(target, item);
    }
  }
  if (Array.isArray(raw.bench)) {
    for (const item of raw.bench) {
      if (!isRecord(item)) continue;
      const target = bench.find((b) => b.slotId === item.slotId);
      if (target) fill(target, item);
    }
  }

  const salaryCap =
    typeof raw.salaryCap === 'number' && Number.isFinite(raw.salaryCap)
      ? clampSalaryCap(raw.salaryCap)
      : DEFAULT_SALARY_CAP;

  return { formationId, slots, bench, salaryCap };
}

/** Snapshot rút gọn (starters + bench + trần lương) để nén LZ-string và đưa lên URL. Không gồm huấn luyện. */
export function toSnapshot(data: SquadData): SquadSnapshot {
  const entries: Array<readonly [string, string, EnhancementLevel]> = [];
  for (const slot of [...data.slots, ...data.bench]) {
    if (slot.playerId) entries.push([slot.slotId, slot.playerId, slot.enhancement]);
  }
  return { v: 1, f: data.formationId, s: entries, c: data.salaryCap };
}

/* ───────────────────────────── Metrics ───────────────────────────── */

export interface SquadMetrics extends SquadSummary {
  /** Alias dễ đọc cho UI: `currentSalary / maxSalary` */
  readonly currentSalary: number;
  readonly maxSalary: number;
  /** currentSalary / maxSalary × 100 (1 chữ số thập phân) */
  readonly salaryUsagePercent: number;
  readonly starterBp: number;
  readonly benchBp: number;
  readonly totalBp: number;
  readonly teamColors: TeamColorResult;
  /** Chi tiết OVR của từng cầu thủ đá chính, key = slotId */
  readonly slotBreakdown: Readonly<Record<string, EffectiveOvrBreakdown>>;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

export function computeSquadMetrics(data: SquadData): SquadMetrics {
  const entries: TeamColorEntry[] = [];
  for (const slot of data.slots) {
    if (!slot.playerId) continue;
    const player = getPlayer(slot.playerId);
    if (player) entries.push({ slotId: slot.slotId, player, enhancement: slot.enhancement });
  }
  const teamColors = evaluateTeamColors(entries);

  let totalSalary = 0;
  let starterBp = 0;
  let sumBefore = 0;
  let sumFinal = 0;
  const slotBreakdown: Record<string, EffectiveOvrBreakdown> = {};

  for (const slot of data.slots) {
    if (!slot.playerId) continue;
    const player = getPlayer(slot.playerId);
    if (!player) continue;
    const breakdown = calculateEffectiveOvr({
      player,
      enhancement: slot.enhancement,
      trainingLevel: slot.trainingLevel,
      slotPosition: slot.position,
      teamColorBonus: teamColors.perPlayer[slot.slotId]?.ovrBonus ?? 0,
    });
    slotBreakdown[slot.slotId] = breakdown;
    totalSalary += player.salary;
    starterBp += getBpValue(player.id, slot.enhancement);
    sumBefore += breakdown.ovrBeforeTeamColor;
    sumFinal += breakdown.finalOvr;
  }

  let benchBp = 0;
  for (const slot of data.bench) {
    if (slot.playerId && getPlayer(slot.playerId)) {
      benchBp += getBpValue(slot.playerId, slot.enhancement);
    }
  }

  const filledSlots = entries.length;
  const salaryCap = data.salaryCap;

  return {
    filledSlots,
    totalSalary,
    salaryCap,
    remainingSalary: salaryCap - totalSalary,
    isOverCap: totalSalary > salaryCap,
    baseTeamOvr: filledSlots > 0 ? round1(sumBefore / filledSlots) : 0,
    teamOvr: filledSlots > 0 ? round1(sumFinal / filledSlots) : 0,
    currentSalary: totalSalary,
    maxSalary: salaryCap,
    salaryUsagePercent: salaryCap > 0 ? round1((totalSalary / salaryCap) * 100) : 0,
    starterBp,
    benchBp,
    totalBp: starterBp + benchBp,
    teamColors,
    slotBreakdown,
  };
}

/* ───────────────────────────── Store ───────────────────────────── */

export const useSquadStore = create<SquadStore>()(
  persist(
    immer((set, get) => ({
      ...createInitialSquadData(),

      setFormation: (formationId) =>
        set((state) => {
          if (state.formationId === formationId) return;

          const newSlots = createEmptyStarters(formationId);
          const leftovers: Placement[] = [];

          /* Bước 1: giữ cầu thủ ở slot có cùng mã vị trí */
          for (const old of state.slots) {
            const placement = readPlacement(old);
            if (!placement) continue;
            const target = newSlots.find((s) => s.slotId === old.slotId);
            if (target) writePlacement(target, placement);
            else leftovers.push(placement);
          }

          /* Bước 2: xếp cầu thủ còn lại vào slot trống phù hợp nhất (greedy theo mức trừ OVR) */
          const pairs: Array<{ li: number; si: number; delta: number }> = [];
          leftovers.forEach((placement, li) => {
            const player = getPlayer(placement.playerId);
            if (!player) return;
            newSlots.forEach((slot, si) => {
              if (slot.playerId !== null) return;
              const delta = getPositionFit(player, slot.position).delta;
              if (delta >= -FORMATION_REASSIGN_MAX_PENALTY) pairs.push({ li, si, delta });
            });
          });
          pairs.sort((a, b) => b.delta - a.delta || a.li - b.li || a.si - b.si);

          const placedLeftovers = new Set<number>();
          for (const { li, si } of pairs) {
            if (placedLeftovers.has(li) || newSlots[si].playerId !== null) continue;
            writePlacement(newSlots[si], leftovers[li]);
            placedLeftovers.add(li);
          }

          /* Bước 3: phần còn dư xuống dự bị (hết chỗ thì bỏ) */
          leftovers.forEach((placement, li) => {
            if (placedLeftovers.has(li)) return;
            const emptyBench = state.bench.find((b) => b.playerId === null);
            if (emptyBench) writePlacement(emptyBench, placement);
          });

          state.formationId = formationId;
          state.slots = newSlots;
        }),

      addPlayerToSlot: (slotId, playerId, options) =>
        set((state) => {
          if (!getPlayer(playerId)) return;
          const target = findSlot(state, slotId);
          if (!target) return;

          const sourceId = findPlayerSlotId(state, playerId);
          if (sourceId === undefined) {
            writePlacement(target, {
              playerId,
              enhancement: DEFAULT_ENHANCEMENT,
              trainingLevel: DEFAULT_TRAINING_LEVEL,
            });
          } else if (sourceId !== slotId) {
            swapPlacements(state, sourceId, slotId);
          }

          if (options?.enhancement !== undefined && isEnhancementLevel(options.enhancement)) {
            target.enhancement = options.enhancement;
          }
          if (options?.trainingLevel !== undefined && isTrainingLevel(options.trainingLevel)) {
            target.trainingLevel = options.trainingLevel;
          }
        }),

      removePlayer: (slotId) =>
        set((state) => {
          const slot = findSlot(state, slotId);
          if (slot) writePlacement(slot, null);
        }),

      swapSlots: (slotIdA, slotIdB) =>
        set((state) => {
          swapPlacements(state, slotIdA, slotIdB);
        }),

      setEnhancement: (slotId, level) =>
        set((state) => {
          if (!isEnhancementLevel(level)) return;
          const slot = findSlot(state, slotId);
          if (slot && slot.playerId !== null) slot.enhancement = level;
        }),

      setTrainingLevel: (slotId, level) =>
        set((state) => {
          if (!isTrainingLevel(level)) return;
          const slot = findSlot(state, slotId);
          if (slot && slot.playerId !== null) slot.trainingLevel = level;
        }),

      setSalaryCap: (cap) =>
        set((state) => {
          if (!Number.isFinite(cap)) return;
          state.salaryCap = clampSalaryCap(cap);
        }),

      resetSquad: () =>
        set((state) => {
          state.slots = createEmptyStarters(state.formationId);
          state.bench = createEmptyBench();
        }),

      resetAll: () =>
        set((state) => {
          const initial = createInitialSquadData();
          state.formationId = initial.formationId;
          state.slots = initial.slots;
          state.bench = initial.bench;
          state.salaryCap = initial.salaryCap;
        }),

      loadSnapshot: (snapshot) => {
        if (snapshot.v !== 1 || !isFormationId(snapshot.f)) return null;
        set((state) => {
          const slots = createEmptyStarters(snapshot.f);
          const bench = createEmptyBench();
          const used = new Set<string>();

          for (const [slotId, playerId, enhancement] of snapshot.s) {
            if (used.has(playerId) || !getPlayer(playerId)) continue;
            const target =
              slots.find((s) => s.slotId === slotId) ?? bench.find((b) => b.slotId === slotId);
            if (!target) continue;
            used.add(playerId);
            writePlacement(target, {
              playerId,
              enhancement: isEnhancementLevel(enhancement) ? enhancement : DEFAULT_ENHANCEMENT,
              trainingLevel: DEFAULT_TRAINING_LEVEL,
            });
          }

          state.formationId = snapshot.f;
          state.slots = slots;
          state.bench = bench;
          if (typeof snapshot.c === 'number' && Number.isFinite(snapshot.c)) {
            state.salaryCap = clampSalaryCap(snapshot.c);
          }
        });
        const next = get();
        return (
          next.slots.filter((s) => s.playerId !== null).length +
          next.bench.filter((b) => b.playerId !== null).length
        );
      },
    })),
    {
      name: PERSIST_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state): SquadData => ({
        formationId: state.formationId,
        slots: state.slots,
        bench: state.bench,
        salaryCap: state.salaryCap,
      }),
      merge: (persisted, current) => {
        const clean = sanitizeSquadData(persisted);
        return clean ? { ...current, ...clean } : current;
      },
    },
  ),
);

/* ───────────────────────────── Hooks ───────────────────────────── */

/** Chỉ số real-time của đội hình (lương, OVR, BP, Team Color) — tự cập nhật khi store đổi. */
export function useSquadMetrics(): SquadMetrics {
  const formationId = useSquadStore((s) => s.formationId);
  const slots = useSquadStore((s) => s.slots);
  const bench = useSquadStore((s) => s.bench);
  const salaryCap = useSquadStore((s) => s.salaryCap);
  return useMemo(
    () => computeSquadMetrics({ formationId, slots, bench, salaryCap }),
    [formationId, slots, bench, salaryCap],
  );
}

/** Nạp state từ localStorage ở client. Trả về `true` khi đã hydrate xong. */
export function useSquadHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsubscribe = useSquadStore.persist.onFinishHydration(() => setHydrated(true));
    void Promise.resolve(useSquadStore.persist.rehydrate()).then(() => setHydrated(true));
    return unsubscribe;
  }, []);
  return hydrated;
}