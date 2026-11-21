'use client';

/**
 * src/components/player-card/PlayerCard.tsx
 * ---------------------------------------------------------------------------
 * Thẻ cầu thủ FC Online (thuần hiển thị, không đọc store):
 * - Đã fix lỗi khe hở hover bằng vùng đệm pt-1.5 nối liền thanh điều khiển.
 * - Hỗ trợ bấm trực tiếp vào thẻ để đổi cầu thủ (onReplace) ngoài việc kéo-thả.
 */

import { memo, useRef, type PointerEvent, type ReactNode, type SyntheticEvent } from 'react';
import { ArrowLeftRight, Minus, Plus, X } from 'lucide-react';

import { getSeason } from '@/data/players';
import { cn } from '@/lib/cn';
import {
  DEFAULT_TRAINING_LEVEL,
  calculateEffectiveOvr,
  formatEnhancement,
  getCardTier,
  isEnhancementLevel,
  type EffectiveOvrBreakdown,
  type TrainingLevel,
} from '@/lib/ovr-calculator';
import { type EnhancementLevel, type Player } from '@/types/fc-online';

/* ───────────────────────────── Sizes & tier styles ───────────────────────────── */

export type PlayerCardSize = 'sm' | 'md' | 'lg' | 'responsive';

/** Kích thước hộp + font-size gốc (các phần tử con dùng em). */
const SIZE_CLASS: Readonly<Record<PlayerCardSize, string>> = {
  sm: 'h-[90px] w-[64px] text-[8px]',
  md: 'h-[122px] w-[88px] text-[11px]',
  lg: 'h-[166px] w-[120px] text-[15px]',
  responsive: 'h-[88px] w-[62px] text-[8.5px] sm:h-[122px] sm:w-[88px] sm:text-[11px]',
};

const TIER_SHADOW = {
  bronze: '',
  silver: 'shadow-[0_0_8px_rgba(226,232,240,0.35)]',
  gold: 'shadow-[0_0_14px_rgba(250,204,21,0.6)]',
  platinum: 'shadow-[0_0_18px_rgba(167,139,250,0.75)]',
} as const;

const RAINBOW_CONIC =
  'bg-[conic-gradient(from_0deg,#22d3ee,#a78bfa,#f472b6,#facc15,#4ade80,#22d3ee)]';

const stop = (event: SyntheticEvent): void => event.stopPropagation();

/* ───────────────────────────── Sub components ───────────────────────────── */

function AvatarSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true" focusable="false">
      <circle cx="50" cy="36" r="18" fill={color} fillOpacity="0.5" />
      <path d="M10 100 C10 72 30 62 50 62 C70 62 90 72 90 100 Z" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

interface IconButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}

function IconButton({ label, onClick, disabled, danger, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-zinc-200 transition-colors',
        'hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400',
        'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent',
        danger && 'hover:bg-red-500/90 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── PlayerCard ───────────────────────────── */

export interface PlayerCardProps {
  player: Player;
  enhancement: EnhancementLevel;
  trainingLevel?: TrainingLevel;
  /** OVR đã tính (gồm lệch vị trí + Team Color). Bỏ trống → tự tính từ cấp thẻ + huấn luyện. */
  breakdown?: EffectiveOvrBreakdown;
  size?: PlayerCardSize;
  /** Ép hiển thị thanh điều khiển (ví dụ khi đang được chọn). Mặc định hiện khi hover/focus. */
  controlsVisible?: boolean;
  onEnhancementChange?: (level: EnhancementLevel) => void;
  onReplace?: () => void;
  onRemove?: () => void;
  className?: string;
}

function PlayerCardBase({
  player,
  enhancement,
  trainingLevel = DEFAULT_TRAINING_LEVEL,
  breakdown,
  size = 'md',
  controlsVisible = false,
  onEnhancementChange,
  onReplace,
  onRemove,
  className,
}: PlayerCardProps) {
  const season = getSeason(player.seasonCode);
  const tier = getCardTier(enhancement);
  const b = breakdown ?? calculateEffectiveOvr({ player, enhancement, trainingLevel });

  // Phân biệt click nhanh vs kéo thả (drag) để bấm thẳng vào thẻ là mở bảng đổi cầu thủ
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerDownPos.current || !onReplace) return;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    pointerDownPos.current = null;
    // Nếu chuột di chuyển dưới 5px (tức là click chứ không phải kéo thả) -> mở bảng đổi cầu thủ
    if (dx < 5 && dy < 5) {
      onReplace();
    }
  };

  const positionLabel = b.positionFit?.slotPosition ?? player.position;
  const outOfPosition = b.positionFit?.kind === 'out-of-position';
  const tierGradient = `linear-gradient(135deg, ${tier.gradient.join(', ')})`;
  const hasControls = Boolean(onEnhancementChange || onReplace || onRemove);

  const tooltip = [
    `${player.name} (${season.name})`,
    `${player.club.name} · ${player.nation.name}`,
    `OVR gốc ${b.baseOvr}`,
    `Cấp thẻ ${formatEnhancement(enhancement)}: ${b.enhancementBonus >= 0 ? '+' : ''}${b.enhancementBonus}`,
    b.trainingBonus ? `Huấn luyện ${trainingLevel}: +${b.trainingBonus}` : null,
    b.positionDelta ? `Vị trí ${positionLabel}: ${b.positionDelta > 0 ? '+' : ''}${b.positionDelta}` : null,
    b.teamColorBonus ? `Team Color: +${b.teamColorBonus}` : null,
    `OVR thực tế ${b.finalOvr} · Lương ${player.salary}`,
    onReplace ? '(Bấm vào thẻ để đổi cầu thủ, kéo để hoán đổi vị trí)' : null,
  ]
    .filter(Boolean)
    .join('\n');

  const changeLevel = (delta: number): void => {
    const next = enhancement + delta;
    if (isEnhancementLevel(next)) onEnhancementChange?.(next);
  };

  const visibleCls = controlsVisible
    ? 'pointer-events-auto opacity-100'
    : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100';

  return (
    <div
      title={tooltip}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        'group relative select-none hover:z-40',
        onReplace && 'cursor-pointer',
        SIZE_CLASS[size],
        className,
      )}
    >
      {/* Khung viền theo tier */}
      <div
        aria-hidden="true"
        className={cn('absolute inset-0 overflow-hidden rounded-[0.8em]', TIER_SHADOW[tier.tier])}
        style={tier.isRainbow ? { background: '#0b1020' } : { background: tierGradient }}
      >
        {tier.isRainbow && (
          <span
            className={cn('absolute inset-[-60%] animate-[spin_4s_linear_infinite]', RAINBOW_CONIC)}
          />
        )}
      </div>

      {/* Nội dung thẻ */}
      <div
        className="absolute inset-[2px] overflow-hidden rounded-[0.65em]"
        style={{ background: `linear-gradient(165deg, ${season.theme.primary} 0%, #09090b 100%)` }}
      >
        {/* Avatar mặc định / ảnh */}
        <div className="absolute inset-x-[8%] bottom-[20%] top-[24%]">
          <AvatarSilhouette color={season.theme.accent} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.imageUrl || `/players/${player.id}.png`}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
        </div>

        {/* Cột trái: OVR · vị trí · cấp thẻ · chênh lệch */}
        <div className="absolute left-[0.45em] top-[0.4em] flex flex-col items-center leading-none">
          <span
            className="text-[2.3em] font-black tabular-nums tracking-tight"
            style={{ color: season.theme.text }}
          >
            {b.finalOvr}
          </span>
          <span
            className={cn(
              'mt-[0.2em] text-[0.95em] font-bold',
              outOfPosition ? 'text-red-400' : 'text-white/90',
            )}
          >
            {positionLabel}
          </span>
          <span
            className="mt-[0.4em] rounded-[0.35em] px-[0.5em] py-[0.15em] text-[0.95em] font-black tabular-nums"
            style={{ background: tierGradient, color: tier.text }}
          >
            {formatEnhancement(enhancement)}
          </span>
          {(b.positionDelta !== 0 || b.teamColorBonus > 0) && (
            <span className="mt-[0.35em] flex gap-[0.35em] text-[0.85em] font-bold tabular-nums">
              {b.positionDelta !== 0 && (
                <span className={b.positionDelta < 0 ? 'text-red-400' : 'text-emerald-300'}>
                  {b.positionDelta > 0 ? `+${b.positionDelta}` : b.positionDelta}
                </span>
              )}
              {b.teamColorBonus > 0 && (
                <span className="text-cyan-300">+{b.teamColorBonus}</span>
              )}
            </span>
          )}
        </div>

        {/* Cột phải: mùa thẻ · lương */}
        <div className="absolute right-[0.4em] top-[0.4em] flex flex-col items-end gap-[0.35em]">
          <span
            className="rounded-[0.35em] px-[0.5em] py-[0.18em] text-[0.8em] font-black uppercase leading-none"
            style={{ background: season.theme.accent, color: season.theme.primary }}
          >
            {season.label}
          </span>
          <span
            className="rounded-[0.35em] bg-sky-500 px-[0.5em] py-[0.18em] text-[0.9em] font-black leading-none tabular-nums text-white"
            aria-label={`Lương ${player.salary}`}
          >
            {player.salary}
          </span>
        </div>

        {/* Tên */}
        <div className="absolute inset-x-0 bottom-0 bg-black/65 px-[0.3em] py-[0.3em] text-center">
          <span className="block truncate text-[0.95em] font-bold uppercase leading-tight text-white">
            {player.shortName}
          </span>
        </div>
      </div>

      {/* Thanh điều khiển nhanh (dùng pt-1.5 thay vì mt-1 để nối liền vùng hover, không bao giờ rớt chuột) */}
      {hasControls && (
        <div
          className={cn(
            'absolute left-1/2 top-full z-50 -translate-x-1/2 pt-1.5',
            'transition-opacity duration-150',
            visibleCls,
          )}
          onPointerDown={stop}
          onPointerUp={stop}
          onMouseDown={stop}
          onTouchStart={stop}
          onKeyDown={stop}
          onClick={stop}
          onDoubleClick={stop}
        >
          <div className="flex w-max items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/95 px-1.5 py-1 text-[11px] shadow-xl backdrop-blur">
            {onEnhancementChange && (
              <>
                <IconButton
                  label="Giảm cấp thẻ"
                  disabled={!isEnhancementLevel(enhancement - 1)}
                  onClick={() => changeLevel(-1)}
                >
                  <Minus size={13} />
                </IconButton>
                <span
                  className="min-w-[2.2em] rounded-full px-1.5 text-center text-[10px] font-black tabular-nums leading-5"
                  style={{ background: tierGradient, color: tier.text }}
                  aria-live="polite"
                >
                  {formatEnhancement(enhancement)}
                </span>
                <IconButton
                  label="Tăng cấp thẻ"
                  disabled={!isEnhancementLevel(enhancement + 1)}
                  onClick={() => changeLevel(1)}
                >
                  <Plus size={13} />
                </IconButton>
              </>
            )}
            {onReplace && (
              <IconButton label="Đổi cầu thủ" onClick={onReplace}>
                <ArrowLeftRight size={13} />
              </IconButton>
            )}
            {onRemove && (
              <IconButton label="Xoá khỏi vị trí" danger onClick={onRemove}>
                <X size={13} />
              </IconButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const PlayerCard = memo(PlayerCardBase);