"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TimelineControls from "@/components/TimelineControls";
import TimelineViewport from "@/components/TimelineViewport";
import { usePrediction } from "@/hooks/usePredictions";
import { BACKEND_URL } from "@/lib/config";
import clsx from "clsx";

export default function TimelineClient({ id }: { id: string }) {
  const { data: prediction } = usePrediction(id);
  const PX_PER_SECOND = 100;
  const PX_PER_OCTAVE = 30;

  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [vocalsOnly, setVocalsOnly] = useState(false);
  const [contentAudio, setContentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [vocalsAudio, setVocalsAudio] = useState<HTMLAudioElement | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const wasPlayingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Semitone transposition offset (can be negative)
  const [transpose, setTranspose] = useState(0);

  const NOTE_ORDER = useMemo(
    () => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
    []
  );

  const toMidiFromNote = (note: string, octave: number) =>
    NOTE_ORDER.indexOf(note) + 12 * (octave + 1);
  const fromMidiToNote = (midi: number) => {
    const wrapped = ((midi % 12) + 12) % 12;
    const note = NOTE_ORDER[wrapped];
    const octave = Math.floor(midi / 12) - 1;
    return { note, octave };
  };

  const displayNotes = useMemo(() => {
    if (!prediction?.notes?.length) return [] as any[];
    return prediction.notes.map((n: any) => {
      const baseMidi = toMidiFromNote(n.note, n.octave);
      const transposedMidi = baseMidi + transpose;
      const { note, octave } = fromMidiToNote(transposedMidi);
      return { ...n, note, octave, _midi: transposedMidi };
    });
  }, [prediction, transpose, NOTE_ORDER]);

  // Estimate musical key (tonal center) from displayed notes using
  // Krumhansl-Schmuckler style profiles with duration-weighted histogram
  const estimatedKey = useMemo(() => {
    if (!displayNotes.length)
      return null as null | {
        tonicIndex: number;
        mode: "maior" | "menor";
        label: string;
      };
    const hist = new Array(12).fill(0);
    for (const n of displayNotes) {
      const midi =
        typeof n._midi === "number"
          ? n._midi
          : toMidiFromNote(n.note, n.octave);
      const pc = ((midi % 12) + 12) % 12;
      const dur = Math.max(0, (n.end ?? 0) - (n.start ?? 0)) || 1;
      hist[pc] += dur;
    }
    const sum = hist.reduce((a, b) => a + b, 0) || 1;
    const h = hist.map((x) => x / sum);

    const majorProfile = [
      6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
    ];
    const minorProfile = [
      6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
    ];

    function cosineSimilarity(a: number[], b: number[]) {
      let dot = 0,
        na = 0,
        nb = 0;
      for (let i = 0; i < 12; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    }
    function rotated(profile: number[], k: number) {
      const out = new Array(12);
      for (let i = 0; i < 12; i++) out[i] = profile[(i - k + 12) % 12];
      return out;
    }

    let bestScore = -Infinity;
    let bestIndex = 0;
    let bestMode: "maior" | "menor" = "maior";
    for (let k = 0; k < 12; k++) {
      const scoreMaj = cosineSimilarity(h, rotated(majorProfile, k));
      if (scoreMaj > bestScore) {
        bestScore = scoreMaj;
        bestIndex = k;
        bestMode = "maior";
      }
      const scoreMin = cosineSimilarity(h, rotated(minorProfile, k));
      if (scoreMin > bestScore) {
        bestScore = scoreMin;
        bestIndex = k;
        bestMode = "menor";
      }
    }
    const tonic = NOTE_ORDER[bestIndex];
    return {
      tonicIndex: bestIndex,
      mode: bestMode,
      label: `${tonic} ${bestMode}`,
    };
  }, [displayNotes, NOTE_ORDER]);

  const [minMidi, maxMidi, maxEnd] = useMemo(() => {
    if (!displayNotes.length) return [0, 0, 0];
    let min = Infinity,
      max = -Infinity,
      end = 0;
    for (const n of displayNotes) {
      const m =
        typeof n._midi === "number"
          ? n._midi
          : toMidiFromNote(n.note, n.octave);
      if (m < min) min = m;
      if (m > max) max = m;
      if (n.end > end) end = n.end;
    }
    return [min, max, end];
  }, [displayNotes]);

  function setCurrentTimeSafely(el: HTMLAudioElement, t: number) {
    const assign = () => {
      const dur = el.duration;
      const target =
        Number.isFinite(dur) && !Number.isNaN(dur) ? Math.min(t, dur || t) : t;
      el.currentTime = target;
    };
    if (el.readyState >= 1) assign();
    else el.addEventListener("loadedmetadata", assign, { once: true });
  }

  function getEffectiveRate(spd: number, tr: number) {
    // Change pitch by semitones using playbackRate multiplier
    // ratio = 2^(semitones/12)
    const pitchRatio = Math.pow(2, tr / 12);
    return spd * pitchRatio;
  }

  useEffect(() => {
    if (!prediction) return;
    if (prediction.content_path?.startsWith("uploads/")) {
      const ca = new Audio(`${BACKEND_URL}/${prediction.content_path}`);
      ca.preload = "auto";
      const va = prediction.vocals_path
        ? new Audio(`${BACKEND_URL}/${prediction.vocals_path}`)
        : null;
      if (va) va.preload = "auto";

      // Ensure pitch changes with playbackRate (do not preserve pitch)
      // Vendor-prefixed fallbacks included.
      (ca as any).preservesPitch = false;
      (ca as any).mozPreservesPitch = false;
      (ca as any).webkitPreservesPitch = false;
      if (va) {
        (va as any).preservesPitch = false;
        (va as any).mozPreservesPitch = false;
        (va as any).webkitPreservesPitch = false;
      }

      const onTimeContent = () => updateProgress(ca.currentTime);
      const onTimeVocals = () => updateProgress(va!.currentTime);

      ca.addEventListener("timeupdate", onTimeContent);
      ca.addEventListener("ended", () => setIsPlaying(false));
      if (va) {
        va.addEventListener("timeupdate", onTimeVocals);
        va.addEventListener("ended", () => setIsPlaying(false));
      }
      setContentAudio(ca);
      setVocalsAudio(va);
      setAudio(ca);
      return () => {
        ca.pause();
        ca.removeEventListener("timeupdate", onTimeContent);
        if (va) {
          va.pause();
          va.removeEventListener("timeupdate", onTimeVocals);
        }
      };
    }
  }, [prediction]);

  function updateProgress(currentTime: number) {
    if (!progressRef.current || !tabContainerRef.current) return;
    const left = currentTime * PX_PER_SECOND;
    progressRef.current.style.left = `${left}px`;

    const container = tabContainerRef.current;
    const viewLeft = container.scrollLeft;
    const thresholdLeft = viewLeft + container.clientWidth * 0.2;
    const thresholdRight = viewLeft + container.clientWidth * 0.8;
    if (left < thresholdLeft) {
      container.scrollLeft = Math.max(0, left - container.clientWidth * 0.4);
    } else if (left > thresholdRight) {
      container.scrollLeft = left - container.clientWidth * 0.6;
    }
  }

  function handlePlayPause() {
    const a = audio;
    if (!a) return;
    if (isPlaying) a.pause();
    else {
      a.playbackRate = getEffectiveRate(speed, transpose);
      a.play();
    }
    setIsPlaying(!isPlaying);
  }

  function switchSource(vocals: boolean) {
    const ca = contentAudio;
    const va = vocalsAudio;
    if (!ca) return;
    const was = isPlaying;
    if (audio && isPlaying) audio.pause();
    const currentTime = audio?.currentTime || 0;
    if (vocals && va) {
      setCurrentTimeSafely(va, currentTime);
      setAudio(va);
      if (was) {
        va.playbackRate = getEffectiveRate(speed, transpose);
        va.play();
      }
    } else {
      setCurrentTimeSafely(ca, currentTime);
      setAudio(ca);
      if (was) {
        ca.playbackRate = getEffectiveRate(speed, transpose);
        ca.play();
      }
    }
  }

  useEffect(() => {
    const eff = getEffectiveRate(speed, transpose);
    if (contentAudio) contentAudio.playbackRate = eff;
    if (vocalsAudio) vocalsAudio.playbackRate = eff;
  }, [speed, transpose, contentAudio, vocalsAudio]);

  // Dragging and clicking (mouse + touch)
  useEffect(() => {
    const container = tabContainerRef.current;
    const indicator = progressRef.current;
    if (!container || !indicator) return;

    function startMouseDrag() {
      isDraggingRef.current = true;
      setIsDragging(true);
      wasPlayingRef.current = isPlaying;
      if (audio && isPlaying) audio.pause();
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      (indicator as HTMLDivElement).style.cursor = "grabbing";
    }

    function onMouseDown(e: MouseEvent) {
      startMouseDrag();
      e.preventDefault();
      e.stopPropagation();
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) return;
      const cont = tabContainerRef.current;
      if (!cont) return;
      const rect = cont.getBoundingClientRect();
      const relativeX = e.clientX - rect.left + cont.scrollLeft;
      seekTo(relativeX / PX_PER_SECOND);
    }

    function onMouseUp() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        (indicator as HTMLDivElement).style.cursor = "pointer";
        if (audio && wasPlayingRef.current) audio.play();
      }
    }

    function getTouchX(t: Touch) {
      const cont = tabContainerRef.current!;
      const rect = cont.getBoundingClientRect();
      return t.clientX - rect.left + cont.scrollLeft;
    }

    function startTouchDrag() {
      isDraggingRef.current = true;
      setIsDragging(true);
      wasPlayingRef.current = isPlaying;
      if (audio && isPlaying) audio.pause();
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    }

    function onTouchStart(e: TouchEvent) {
      startTouchDrag();
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDraggingRef.current) return;
      const cont = tabContainerRef.current;
      if (!cont) return;
      const x = getTouchX(e.touches[0]);
      seekTo(x / PX_PER_SECOND);
      e.preventDefault();
    }

    function onTouchEnd() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
        if (audio && wasPlayingRef.current) audio.play();
      }
    }

    const DRAG_HIT_PX = 10;
    function getProgressLeftPx() {
      const ind = progressRef.current as HTMLDivElement | null;
      if (!ind) return 0;
      const val = parseFloat(ind.style.left || "0");
      return Number.isFinite(val) ? val : 0;
    }
    function onContainerClick(e: MouseEvent) {
      const cont = tabContainerRef.current;
      if (!cont) return;
      const target = e.target as HTMLElement;
      if (target === progressRef.current) return;
      if (target.closest('[data-note-block="1"]')) return;
      const rect = cont.getBoundingClientRect();
      const relativeX = e.clientX - rect.left + cont.scrollLeft;
      const progressLeft = getProgressLeftPx();
      if (Math.abs(relativeX - progressLeft) <= DRAG_HIT_PX) {
        // Move to the point and start drag immediately
        seekTo(relativeX / PX_PER_SECOND);
        isDraggingRef.current = true;
        setIsDragging(true);
        wasPlayingRef.current = isPlaying;
        if (audio && isPlaying) audio.pause();
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        (indicator as HTMLDivElement).style.cursor = "grabbing";
        e.preventDefault();
        e.stopPropagation();
      } else {
        seekTo(relativeX / PX_PER_SECOND);
      }
    }

    function onContainerTouchTap(e: TouchEvent) {
      const cont = tabContainerRef.current;
      if (!cont) return;
      const target = e.target as HTMLElement;
      if (target === progressRef.current) return;
      if (target.closest('[data-note-block="1"]')) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      const x = getTouchX(t);
      const progressLeft = getProgressLeftPx();
      if (Math.abs(x - progressLeft) <= DRAG_HIT_PX) {
        // Move to the point and start drag immediately
        seekTo(x / PX_PER_SECOND);
        isDraggingRef.current = true;
        setIsDragging(true);
        wasPlayingRef.current = isPlaying;
        if (audio && isPlaying) audio.pause();
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
        e.preventDefault();
      } else {
        seekTo(x / PX_PER_SECOND);
        e.preventDefault();
      }
    }

    indicator.addEventListener("mousedown", onMouseDown);
    indicator.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("mousedown", onContainerClick);
    container.addEventListener("touchstart", onContainerTouchTap, {
      passive: false,
    });
    return () => {
      indicator.removeEventListener("mousedown", onMouseDown);
      indicator.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("mousedown", onContainerClick);
      container.removeEventListener("touchstart", onContainerTouchTap);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [audio, isPlaying]);

  function seekTo(newTime: number) {
    const a = audio;
    if (!a) return;
    setCurrentTimeSafely(a, newTime);
    if (contentAudio && vocalsAudio) {
      if (vocalsOnly && vocalsAudio)
        setCurrentTimeSafely(contentAudio, newTime);
      else setCurrentTimeSafely(vocalsAudio, newTime);
    }
    updateProgress(newTime);
  }

  if (!prediction) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-brand-600" />
      </div>
    );
  }

  const width = maxEnd * PX_PER_SECOND + 100;
  const height = (maxMidi - minMidi + 1) * PX_PER_OCTAVE + 40;

  return (
    <div className={clsx("space-y-6", isFullscreen && "h-0 overflow-hidden")}>
      <div className="rounded-2xl border border-gray-200 p-5 bg-white dark:border-none dark:bg-gray-700">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div>
            <div className="flex items-center gap-3 text-sm mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  prediction.content_type === "youtube"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {prediction.content_type === "youtube" ? "YouTube" : "Arquivo"}
              </span>
              <span className="text-gray-500">
                {new Date(prediction.timestamp).toLocaleString("pt-BR")}
              </span>
              <span className="text-gray-500">
                {prediction.notes_count} nota
                {prediction.notes_count !== 1 ? "s" : ""}
              </span>
            </div>
            <h1 className="text-xl font-bold">
              {prediction.metadata?.display_title || prediction.content_path}
            </h1>
          </div>
          <TimelineControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            speed={speed}
            onSpeedChange={(v) => setSpeed(v)}
            transpose={transpose}
            onTransposeInc={() => setTranspose((t) => t + 1)}
            onTransposeDec={() => setTranspose((t) => t - 1)}
            vocalsOnly={vocalsOnly}
            onToggleVocals={(checked) => {
              setVocalsOnly(checked);
              switchSource(checked);
            }}
            estimatedKey={estimatedKey}
          />
        </div>
      </div>

      <div className="rounded-2xl relative border border-gray-200 bg-white dark:border-none dark:bg-gray-700 overflow-hidden">
        <FullscreenControls
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />

        <TimelineViewport
          tabContainerRef={tabContainerRef}
          progressRef={progressRef}
          width={width}
          height={height}
          notes={displayNotes as any}
          toMidiFromNote={toMidiFromNote}
          pxPerSecond={PX_PER_SECOND}
          pxPerOctave={PX_PER_OCTAVE}
          maxMidi={maxMidi}
        />
      </div>

      {isFullscreen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 !m-0 z-[1000] border-gray-200 bg-white dark:border-none dark:bg-gray-700">
          <FullscreenControls
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
          />

          <div className="absolute inset-0">
            <TimelineViewport
              tabContainerRef={tabContainerRef}
              progressRef={progressRef}
              width={width}
              height={"100vh"}
              notes={displayNotes as any}
              toMidiFromNote={toMidiFromNote}
              pxPerSecond={PX_PER_SECOND}
              pxPerOctave={PX_PER_OCTAVE}
              maxMidi={maxMidi}
            />
          </div>
          <div className="fixed top-4 left-4 z-[1001]">
            <div className="rounded-xl border border-gray-200 bg-white dark:border-none dark:bg-gray-800 shadow p-3 w-fit h-fit space-y-2">
              <TimelineControls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                speed={speed}
                onSpeedChange={(v) => setSpeed(v)}
                transpose={transpose}
                onTransposeInc={() => setTranspose((t) => t + 1)}
                onTransposeDec={() => setTranspose((t) => t - 1)}
                vocalsOnly={vocalsOnly}
                onToggleVocals={(checked) => {
                  setVocalsOnly(checked);
                  switchSource(checked);
                }}
                estimatedKey={estimatedKey}
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-5 bg-white dark:border-none dark:bg-gray-700 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm">
              <th className="py-2 pr-3">Nota</th>
              <th className="py-2 pr-3">Oitava</th>
              <th className="py-2 pr-3">Início (s)</th>
              <th className="py-2 pr-3">Fim (s)</th>
              <th className="py-2 pr-3">Freq. (Hz)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {displayNotes.map((n: any, i: number) => (
              <tr
                key={i}
                className="border-t border-gray-200 dark:border-gray-800"
              >
                <td className="py-2 pr-3">{n.note}</td>
                <td className="py-2 pr-3">{n.octave}</td>
                <td className="py-2 pr-3">{n.start.toFixed(2)}</td>
                <td className="py-2 pr-3">{n.end.toFixed(2)}</td>
                <td className="py-2 pr-3">{n.frequency_mean.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FullscreenControls({
  isFullscreen,
  setIsFullscreen,
}: {
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="absolute top-4 right-4 z-[1001]">
      <button
        aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        onClick={() => setIsFullscreen((prev) => !prev)}
        className="p-2 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
        title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      >
        {isFullscreen ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3H3v6M21 9V3h-6M15 21h6v-6M3 15v6h6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 9V4h5M15 4h5v5M9 20H4v-5M20 15v5h-5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
