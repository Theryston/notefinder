"use client";

import React from "react";

type TimelineControlsProps = {
  isPlaying: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  transpose: number;
  onTransposeInc: () => void;
  onTransposeDec: () => void;
  vocalsOnly: boolean;
  onToggleVocals: (checked: boolean) => void;
  estimatedKey: {
    tonicIndex: number;
    mode: "maior" | "menor";
    label: string;
  } | null;
};

export default function TimelineControls(props: TimelineControlsProps) {
  const {
    isPlaying,
    onPlayPause,
    speed,
    onSpeedChange,
    transpose,
    onTransposeInc,
    onTransposeDec,
    vocalsOnly,
    onToggleVocals,
    estimatedKey,
  } = props;

  return (
    <div className="w-full md:w-52 shrink-0 space-y-2">
      <button
        onClick={onPlayPause}
        className="w-full px-4 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <div className="flex items-center gap-2">
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 rounded-xl border-none bg-zinc-100 dark:bg-zinc-900"
        >
          <option value={0.5}>0.5x velocidade</option>
          <option value={0.75}>0.75x velocidade</option>
          <option value={1}>1x velocidade</option>
          <option value={1.25}>1.25x velocidade</option>
          <option value={1.5}>1.5x velocidade</option>
          <option value={2}>2x velocidade</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Transpor meio tom abaixo"
          onClick={onTransposeDec}
          className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          -
        </button>
        <div className="flex-1 text-center text-sm text-gray-700 dark:text-gray-200">
          {estimatedKey ? `${estimatedKey.label} ` : "N/A"}
          {transpose !== 0 && (
            <>({transpose > 0 ? `+${transpose}` : transpose})</>
          )}
        </div>
        <button
          aria-label="Transpor meio tom acima"
          onClick={onTransposeInc}
          className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          +
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={vocalsOnly}
          onChange={(e) => onToggleVocals(e.target.checked)}
        />
        Apenas vozes
      </label>
    </div>
  );
}
