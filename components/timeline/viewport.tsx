/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import type { PitchData } from './use-pitch-detection';
import { PitchLine } from './pitch-line';

type Note = {
  note: string;
  octave: number;
  start: number;
  end: number;
  _midi?: number;
};

export function TimelineViewport({
  containerRef,
  progressRef,
  width,
  height,
  notes,
  pxPerSecond,
  pxPerOctave,
  maxMidi,
  onSeek,
  pitchData,
  currentTime,
  micActive,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  progressRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number | string;
  notes: Note[];
  pxPerSecond: number;
  pxPerOctave: number;
  maxMidi: number;
  onSeek: (t: number) => void;
  pitchData?: PitchData | null;
  currentTime?: number;
  micActive?: boolean;
}) {
  const startDragRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchMovedRef = useRef(false);
  const touchStartedOnIndicatorRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const indicator = progressRef.current;
    if (!container || !indicator) return;

    function getRelativeXFromMouse(e: MouseEvent) {
      const rect = container.getBoundingClientRect();
      return e.clientX - rect.left + container.scrollLeft;
    }
    function getRelativeXFromTouch(e: TouchEvent) {
      const rect = container.getBoundingClientRect();
      const t = e.touches[0];
      return t.clientX - rect.left + container.scrollLeft;
    }

    function startDrag() {
      startDragRef.current = true;
      (indicator as HTMLDivElement).style.cursor = 'grabbing';
    }
    function stopDrag() {
      startDragRef.current = false;
      (indicator as HTMLDivElement).style.cursor = 'pointer';
    }
    function onDown() {
      startDrag();
    }
    function onUp() {
      if (startDragRef.current) stopDrag();
    }
    function onMove(e: MouseEvent) {
      if (!startDragRef.current) return;
      const x = getRelativeXFromMouse(e);
      onSeek(Math.max(0, x / pxPerSecond));
      e.preventDefault();
    }
    function onTouchMove(e: TouchEvent) {
      if (!startDragRef.current) return;
      const x = getRelativeXFromTouch(e);
      onSeek(Math.max(0, x / pxPerSecond));
      e.preventDefault();
    }
    function onContainerClick(e: MouseEvent) {
      if (e.target === indicator) return;
      const x = getRelativeXFromMouse(e);
      onSeek(Math.max(0, x / pxPerSecond));
    }
    function onContainerTouchStart(e: TouchEvent) {
      if (!container) return;
      const t = e.touches[0];
      touchStartXRef.current = t.clientX;
      touchStartYRef.current = t.clientY;
      touchMovedRef.current = false;
      touchStartedOnIndicatorRef.current = (indicator as HTMLElement).contains(
        e.target as Node,
      );
    }
    function onContainerTouchMove(e: TouchEvent) {
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchStartXRef.current);
      const dy = Math.abs(t.clientY - touchStartYRef.current);
      if (dx > 8 || dy > 8) touchMovedRef.current = true;
    }
    function onContainerTouchEnd(e: TouchEvent) {
      if (startDragRef.current) return;
      if (touchMovedRef.current) return;
      if (touchStartedOnIndicatorRef.current) return;
      const changed = e.changedTouches[0];
      const rect = container.getBoundingClientRect();
      const relX = changed.clientX - rect.left + container.scrollLeft;
      onSeek(Math.max(0, relX / pxPerSecond));
    }

    indicator.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mousemove', onMove);
    indicator.addEventListener('touchstart', onDown, { passive: true } as any);
    document.addEventListener('touchend', onUp, { passive: true } as any);
    document.addEventListener('touchmove', onTouchMove, {
      passive: false,
    } as any);
    container.addEventListener('click', onContainerClick);
    container.addEventListener('touchstart', onContainerTouchStart, {
      passive: true,
    } as any);
    container.addEventListener('touchmove', onContainerTouchMove, {
      passive: true,
    } as any);
    container.addEventListener('touchend', onContainerTouchEnd, {
      passive: true,
    } as any);
    function onWheel(e: WheelEvent) {
      if (isMobile) return;
      if (!container) return;
      if (e.ctrlKey || (e as any).metaKey) return;
      const absY = Math.abs(e.deltaY);
      const absX = Math.abs(e.deltaX);
      if (absY > absX && absY > 0) {
        e.preventDefault();
        e.stopPropagation();
        container.scrollLeft += e.deltaY;
      }
    }
    container.addEventListener('wheel', onWheel, { passive: false } as any);
    return () => {
      indicator.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mousemove', onMove);
      indicator.removeEventListener('touchstart', onDown as any);
      document.removeEventListener('touchend', onUp as any);
      document.removeEventListener('touchmove', onTouchMove as any);
      container.removeEventListener('click', onContainerClick);
      container.removeEventListener('touchstart', onContainerTouchStart as any);
      container.removeEventListener('touchmove', onContainerTouchMove as any);
      container.removeEventListener('touchend', onContainerTouchEnd as any);
      container.removeEventListener('wheel', onWheel as any);
    };
  }, [containerRef, progressRef, onSeek, pxPerSecond]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto whitespace-nowrap select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ maxWidth: '100%' }}
    >
      <div className="relative" style={{ width, height }}>
        <div
          ref={progressRef}
          className="absolute top-0 bottom-0 w-0.5 bg-primary cursor-grab z-20"
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="absolute -left-2 -right-2 top-0 bottom-0"
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        <PitchLine
          pitchData={pitchData || null}
          currentTime={currentTime || 0}
          pxPerSecond={pxPerSecond}
          pxPerOctave={pxPerOctave}
          maxMidi={maxMidi}
          isActive={!!micActive}
          width={width}
          height={height}
        />

        {notes.map((n: Note, i: number) => {
          const midi = typeof n._midi === 'number' ? n._midi : 0;
          const bandTop = (maxMidi - midi) * pxPerOctave + 20;
          const x = n.start * pxPerSecond;
          const w = Math.max((n.end - n.start) * pxPerSecond, 8);
          const noteHeight = Math.max(10, Math.min(18, pxPerOctave * 0.8));
          const y = Math.max(
            20,
            Math.floor(bandTop + (pxPerOctave - noteHeight) / 2),
          );
          const colors = [
            'bg-blue-400',
            'bg-green-400',
            'bg-yellow-400',
            'bg-pink-400',
            'bg-purple-400',
            'bg-red-400',
            'bg-teal-400',
          ];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              data-note-block="1"
              className={`absolute ${color} rounded text-xs flex items-center justify-center shadow z-10`}
              style={{ left: x, top: y, width: w, height: noteHeight }}
            >
              {n.note}
              {n.octave}
            </div>
          );
        })}
      </div>
    </div>
  );
}
