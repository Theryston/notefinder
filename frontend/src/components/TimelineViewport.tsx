"use client";

import React from "react";

type Note = {
  note: string;
  octave: number;
  start: number;
  end: number;
  _midi?: number;
};

type TimelineViewportProps = {
  tabContainerRef: React.RefObject<HTMLDivElement>;
  progressRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number | string;
  notes: Note[];
  toMidiFromNote: (note: string, octave: number) => number;
  pxPerSecond: number;
  pxPerOctave: number;
  maxMidi: number;
};

export default function TimelineViewport({
  tabContainerRef,
  progressRef,
  width,
  height,
  notes,
  toMidiFromNote,
  pxPerSecond,
  pxPerOctave,
  maxMidi,
}: TimelineViewportProps) {
  return (
    <div
      ref={tabContainerRef}
      id="tabContent"
      className="relative overflow-x-auto whitespace-nowrap select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ maxWidth: "100%" }}
    >
      <div className="relative" style={{ width, height }}>
        <div
          ref={progressRef}
          className="absolute top-0 bottom-0 w-0.5 bg-brand-600 cursor-grab"
          style={{ pointerEvents: "auto" }}
        >
          <div
            className="absolute -left-2 -right-2 top-0 bottom-0"
            style={{ pointerEvents: "auto" }}
          />
        </div>

        {notes.map((n: any, i: number) => {
          const midi =
            typeof n._midi === "number"
              ? n._midi
              : toMidiFromNote(n.note, n.octave);
          const y = (maxMidi - midi) * pxPerOctave + 20;
          const x = n.start * pxPerSecond;
          const w = Math.max((n.end - n.start) * pxPerSecond, 8);
          const colors = [
            "bg-blue-400",
            "bg-green-400",
            "bg-yellow-400",
            "bg-pink-400",
            "bg-purple-400",
            "bg-red-400",
            "bg-teal-400",
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
