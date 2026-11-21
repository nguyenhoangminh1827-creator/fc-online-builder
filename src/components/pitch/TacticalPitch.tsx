'use client';

/**
 * src/components/pitch/TacticalPitch.tsx
 * ---------------------------------------------------------------------------
 * Sân bóng 2D + băng ghế dự bị, kết nối trực tiếp `useSquadStore`.
 *  - Vị trí slot = (x%, y%) lấy từ Formation (đã nằm sẵn trong `slots` của store)
 *  - Kéo-thả (@dnd-kit/core): kéo cầu thủ sang slot khác → `swapSlots` (slot trống = di chuyển)
 *  - Bấm slot trống hoặc nút "Đổi cầu thủ" → mở `PlayerPickerModal` (ưu tiên cầu thủ đúng vị trí, có bộ lọc)
 *  - Bấm vào thẻ để hiện thanh điều khiển (tăng/giảm cấp thẻ, đổi, xoá) — trên desktop hiện khi hover
 */

import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';

import { PlayerPickerModal } from '@/components/pitch/PlayerPickerModal';
import { PlayerCard } from '@/components/player-card/PlayerCard';
import { getPlayer } from '@/data/players';
import {
  BENCH_SIZE,
  useSquadMetrics,
  useSquadStore,
  type BenchSlot,
  type StarterSlot,
} from '@/features/squad/useSquadStore';
import { cn } from '@/lib/cn';
import { calculateEffectiveOvr, type EffectiveOvrBreakdown } from '@/lib/ovr-calculator';

/* ───────────────────────────── Helpers ───────────────────────────── */

type AnySlot = StarterSlot | BenchSlot;

/** Cùng kích thước với PlayerCard size="responsive" để vùng thả khớp với thẻ. */
const CARD_BOX = 'h-[88px] w-[62px] sm:h-[122px] sm:w-[88px]';

const collisionDetection: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);

function isStarterSlot(slot: AnySlot): slot is StarterSlot {
  return 'coordinates' in slot;
}

function slotLabel(slot: AnySlot): string {
  return isStarterSlot(slot) ? slot.position : 'DỰ BỊ';
}

/* ───────────────────────────── Pitch surface ───────────────────────────── */

function PitchSurface() {
  const line = 'rgba(255,255,255,0.35)';
  return (
    <svg
      viewBox="0 0 68 105"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pitch-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#064e3b" />
          <stop offset="1" stopColor="#022c22" />
        </linearGradient>
      </defs>
      <rect width="68" height="105" fill="url(#pitch-base)" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={i * 10.5}
          width="68"
          height="10.5"
          fill={i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)'}
        />
      ))}
      <g fill="none" stroke={line} strokeWidth="0.35">
        <rect x="0.5" y="0.5" width="67" height="104" />
        <line x1="0.5" y1="52.5" x2="67.5" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        {/* Vòng cấm + khu vực 5m50 (trên: khung thành đối phương, dưới: khung thành nhà) */}
        <rect x="13.84" y="0.5" width="40.32" height="16" />
        <rect x="24.84" y="0.5" width="18.32" height="5.5" />
        <rect x="13.84" y="88.5" width="40.32" height="16" />
        <rect x="24.84" y="99" width="18.32" height="5.5" />
        <path d="M 26.69 16.5 A 9.15 9.15 0 0 0 41.31 16.5" />
        <path d="M 26.69 88.5 A 9.15 9.15 0 0 1 41.31 88.5" />
      </g>
      <g fill={line}>
        <circle cx="34" cy="52.5" r="0.5" />
        <circle cx="34" cy="11" r="0.45" />
        <circle cx="34" cy="94" r="0.45" />
        <rect x="30.34" y="0" width="7.32" height="0.9" />
        <rect x="30.34" y="104.1" width="7.32" height="0.9" />
      </g>
    </svg>
  );
}

/* ───────────────────────────── Slot cell (draggable + droppable) ───────────────────────────── */

interface SlotCellProps {
  slot: AnySlot;
  breakdown: EffectiveOvrBreakdown | undefined;
  selected: boolean;
  onSelect: (slotId: string) => void;
  onOpenPicker: (slotId: string) => void;
  className?: string;
  style?: CSSProperties;
}

function SlotCell({
  slot,
  breakdown,
  selected,
  onSelect,
  onOpenPicker,
  className,
  style,
}: SlotCellProps) {
  const player = slot.playerId ? getPlayer(slot.playerId) : undefined;
  const label = slotLabel(slot);

  const setEnhancement = useSquadStore((s) => s.setEnhancement);
  const removePlayer = useSquadStore((s) => s.removePlayer);

  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({ id: slot.slotId, disabled: !player });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slot.slotId });

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef],
  );

  const dragProps = player ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setRef}
      style={style}
      className={cn(
        'z-10 p-2 outline-none hover:z-40 focus-within:z-40',
        selected && 'z-40',
        isDragging && 'opacity-30',
        player && 'cursor-grab active:cursor-grabbing',
        className,
      )}
      {...dragProps}
      aria-label={
        player ? `${player.name}, vị trí ${label}. Nhấn Space để kéo.` : undefined
      }
      onClick={(event) => {
        event.stopPropagation();
        if (player) onSelect(slot.slotId);
      }}
    >
      {player ? (
        <PlayerCard
          player={player}
          enhancement={slot.enhancement}
          trainingLevel={slot.trainingLevel}
          breakdown={breakdown}
          size="responsive"
          controlsVisible={selected && !isDragging}
          className={cn(
            'transition-transform',
            isOver && !isDragging && 'scale-105 rounded-[0.8em] ring-2 ring-cyan-300',
          )}
          onEnhancementChange={(level) => setEnhancement(slot.slotId, level)}
          onReplace={() => onOpenPicker(slot.slotId)}
          onRemove={() => removePlayer(slot.slotId)}
        />
      ) : (
        <button
          type="button"
          aria-label={`Chọn cầu thủ cho vị trí ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenPicker(slot.slotId);
          }}
          className={cn(
            CARD_BOX,
            'flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed',
            'text-[10px] font-bold transition sm:text-xs',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400',
            isOver
              ? 'scale-105 border-cyan-300 bg-cyan-400/20 text-cyan-100'
              : 'border-white/30 bg-black/25 text-white/70 hover:border-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-100',
          )}
        >
          <span className="text-sm sm:text-lg">{label}</span>
          <Plus size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ───────────────────────────── TacticalPitch ───────────────────────────── */

export interface TacticalPitchProps {
  className?: string;
}

export function TacticalPitch({ className }: TacticalPitchProps) {
  const slots = useSquadStore((s) => s.slots);
  const bench = useSquadStore((s) => s.bench);
  const swapSlots = useSquadStore((s) => s.swapSlots);
  const addPlayerToSlot = useSquadStore((s) => s.addPlayerToSlot);
  const metrics = useSquadMetrics();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const toggleSelect = useCallback(
    (slotId: string) => setSelectedId((cur) => (cur === slotId ? null : slotId)),
    [],
  );
  const openPicker = useCallback((slotId: string) => {
    setSelectedId(null);
    setPickerSlotId(slotId);
  }, []);
  const closePicker = useCallback(() => setPickerSlotId(null), []);

  const handleDragStart = (event: DragStartEvent): void => {
    setSelectedId(null);
    setActiveId(String(event.active.id));
  };
  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    swapSlots(String(active.id), String(over.id));
  };

  const handlePick = (playerId: string): void => {
    if (!pickerSlotId) return;
    const current =
      slots.find((s) => s.slotId === pickerSlotId) ?? bench.find((b) => b.slotId === pickerSlotId);
    const alreadyInSquad =
      slots.some((s) => s.playerId === playerId) || bench.some((b) => b.playerId === playerId);
    /* Thay người mới vào slot đang có người → giữ cấp thẻ/huấn luyện để dễ so sánh. */
    addPlayerToSlot(
      pickerSlotId,
      playerId,
      current?.playerId && !alreadyInSquad
        ? { enhancement: current.enhancement, trainingLevel: current.trainingLevel }
        : undefined,
    );
    setPickerSlotId(null);
  };

  const benchBreakdowns = useMemo(() => {
    const result: Record<string, EffectiveOvrBreakdown> = {};
    for (const b of bench) {
      const player = b.playerId ? getPlayer(b.playerId) : undefined;
      if (player) {
        result[b.slotId] = calculateEffectiveOvr({
          player,
          enhancement: b.enhancement,
          trainingLevel: b.trainingLevel,
        });
      }
    }
    return result;
  }, [bench]);

  const activeSlot: AnySlot | undefined = activeId
    ? (slots.find((s) => s.slotId === activeId) ?? bench.find((b) => b.slotId === activeId))
    : undefined;
  const activePlayer = activeSlot?.playerId ? getPlayer(activeSlot.playerId) : undefined;
  const activeBreakdown = activeSlot
    ? (metrics.slotBreakdown[activeSlot.slotId] ?? benchBreakdowns[activeSlot.slotId])
    : undefined;

  const benchCount = bench.filter((b) => b.playerId).length;
  const pickerSlot: AnySlot | undefined = pickerSlotId
    ? (slots.find((s) => s.slotId === pickerSlotId) ?? bench.find((b) => b.slotId === pickerSlotId))
    : undefined;

  return (
    <section className={cn('w-full', className)} aria-label="Sân bóng chiến thuật">
      <DndContext
        id="squad-dnd"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Nhấn Space để nhấc cầu thủ, dùng phím mũi tên để di chuyển, Space để thả vào vị trí mới, Esc để huỷ.',
          },
          announcements: {
            onDragStart: ({ active }) => `Đã nhấc cầu thủ ở vị trí ${active.id}.`,
            onDragOver: ({ over }) => (over ? `Đang ở trên vị trí ${over.id}.` : undefined),
            onDragEnd: ({ active, over }) =>
              over ? `Đã hoán đổi vị trí ${active.id} với ${over.id}.` : `Đã thả cầu thủ ${active.id}.`,
            onDragCancel: ({ active }) => `Đã huỷ kéo cầu thủ ${active.id}.`,
          },
        }}
      >
        {/* Sân */}
        <div
          className="relative mx-auto aspect-[68/105] w-full max-w-[560px] rounded-xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
          onClick={() => setSelectedId(null)}
        >
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <PitchSurface />
          </div>
          {slots.map((slot) => (
            <SlotCell
              key={slot.slotId}
              slot={slot}
              breakdown={metrics.slotBreakdown[slot.slotId]}
              selected={selectedId === slot.slotId}
              onSelect={toggleSelect}
              onOpenPicker={openPicker}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.coordinates.x}%`, top: `${slot.coordinates.y}%` }}
            />
          ))}
        </div>

        {/* Băng ghế dự bị */}
        <div className="mx-auto mt-6 w-full max-w-[560px] rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 pb-8">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dự bị</h3>
            <span className="text-xs tabular-nums text-zinc-500">
              {benchCount}/{BENCH_SIZE}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-1 gap-y-4">
            {bench.map((slot) => (
              <SlotCell
                key={slot.slotId}
                slot={slot}
                breakdown={benchBreakdowns[slot.slotId]}
                selected={selectedId === slot.slotId}
                onSelect={toggleSelect}
                onOpenPicker={openPicker}
                className="relative"
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 160 }}>
          {activePlayer && activeSlot ? (
            <PlayerCard
              player={activePlayer}
              enhancement={activeSlot.enhancement}
              trainingLevel={activeSlot.trainingLevel}
              breakdown={activeBreakdown}
              size="responsive"
              className="rotate-3 scale-110 cursor-grabbing drop-shadow-2xl"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {pickerSlotId && pickerSlot && (
        <PlayerPickerModal
          slotId={pickerSlotId}
          position={isStarterSlot(pickerSlot) ? pickerSlot.position : null}
          occupantPlayerId={pickerSlot.playerId}
          onClose={closePicker}
          onPick={handlePick}
        />
      )}
    </section>
  );
}