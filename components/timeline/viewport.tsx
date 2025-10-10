'use client';

import React, { useEffect, useRef, useState } from 'react';

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
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  progressRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number | string;
  notes: Note[];
  pxPerSecond: number;
  pxPerOctave: number;
  maxMidi: number;
}) {
  // Local drag state purely for cursor feedback; seeking is handled by parent
  const [dragging, setDragging] = useState(false);
  const startDragRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const indicator = progressRef.current;
    if (!container || !indicator) return;

    function startDrag() {
      startDragRef.current = true;
      setDragging(true);
      (indicator as HTMLDivElement).style.cursor = 'grabbing';
    }
    function stopDrag() {
      startDragRef.current = false;
      setDragging(false);
      (indicator as HTMLDivElement).style.cursor = 'pointer';
    }
    function onDown() {
      startDrag();
    }
    function onUp() {
      if (startDragRef.current) stopDrag();
    }
    indicator.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    indicator.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('touchend', onUp, { passive: true });
    return () => {
      indicator.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      indicator.removeEventListener('touchstart', onDown);
      document.removeEventListener('touchend', onUp);
    };
  }, [containerRef, progressRef]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto whitespace-nowrap select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ maxWidth: '100%' }}
    >
      <div className="relative" style={{ width, height }}>
        <div
          ref={progressRef}
          className="absolute top-0 bottom-0 w-0.5 bg-primary cursor-grab"
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="absolute -left-2 -right-2 top-0 bottom-0"
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        {notes.map((n: Note, i: number) => {
          const midi = typeof n._midi === 'number' ? n._midi : 0;
          const y = (maxMidi - midi) * pxPerOctave + 20;
          const x = n.start * pxPerSecond;
          const w = Math.max((n.end - n.start) * pxPerSecond, 8);
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
              className={`absolute ${color} rounded text-xs flex items-center justify-center shadow`}
              style={{ left: x, top: y, width: w, height: 18 }}
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
