"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrediction } from "@/hooks/usePredictions";
import { BACKEND_URL } from "@/lib/config";

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

  useEffect(() => {
    if (!prediction) return;
    if (prediction.content_path?.startsWith("uploads/")) {
      const ca = new Audio(`${BACKEND_URL}/${prediction.content_path}`);
      ca.preload = "auto";
      const va = prediction.vocals_path
        ? new Audio(`${BACKEND_URL}/${prediction.vocals_path}`)
        : null;
      if (va) va.preload = "auto";

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
      a.playbackRate = speed;
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
        va.playbackRate = speed;
        va.play();
      }
    } else {
      setCurrentTimeSafely(ca, currentTime);
      setAudio(ca);
      if (was) {
        ca.playbackRate = speed;
        ca.play();
      }
    }
  }

  useEffect(() => {
    if (contentAudio) contentAudio.playbackRate = speed;
    if (vocalsAudio) vocalsAudio.playbackRate = speed;
  }, [speed, contentAudio, vocalsAudio]);

  // Dragging and clicking (mouse + touch)
  useEffect(() => {
    const container = tabContainerRef.current;
    const indicator = progressRef.current;
    if (!container || !indicator) return;

    function onMouseDown(e: MouseEvent) {
      setIsDragging(true);
      wasPlayingRef.current = isPlaying;
      if (audio && isPlaying) audio.pause();
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      (indicator as HTMLDivElement).style.cursor = "grabbing";
      e.preventDefault();
      e.stopPropagation();
    }
    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return;
      const cont = tabContainerRef.current;
      if (!cont) return;
      const rect = cont.getBoundingClientRect();
      const relativeX = e.clientX - rect.left + cont.scrollLeft;
      seekTo(relativeX / PX_PER_SECOND);
    }
    function onMouseUp() {
      if (isDragging) {
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
    function onTouchStart(e: TouchEvent) {
      setIsDragging(true);
      wasPlayingRef.current = isPlaying;
      if (audio && isPlaying) audio.pause();
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    }
    function onTouchMove(e: TouchEvent) {
      if (!isDragging) return;
      const cont = tabContainerRef.current;
      if (!cont) return;
      const x = getTouchX(e.touches[0]);
      seekTo(x / PX_PER_SECOND);
      e.preventDefault();
    }
    function onTouchEnd() {
      if (isDragging) {
        setIsDragging(false);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
        if (audio && wasPlayingRef.current) audio.play();
      }
    }

    function onContainerClick(e: MouseEvent) {
      const cont = tabContainerRef.current;
      if (!cont) return;
      if (e.target === cont || (e.target as HTMLElement).id === "tabContent") {
        const rect = cont.getBoundingClientRect();
        const relativeX = e.clientX - rect.left + cont.scrollLeft;
        seekTo(relativeX / PX_PER_SECOND);
      }
    }

    indicator.addEventListener("mousedown", onMouseDown);
    indicator.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("mousedown", onContainerClick);
    return () => {
      indicator.removeEventListener("mousedown", onMouseDown);
      indicator.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("mousedown", onContainerClick);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [audio, isPlaying, isDragging]);

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
    <div className="space-y-6">
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
          <div className="w-full md:w-52 shrink-0 space-y-2">
            <button
              onClick={handlePlayPause}
              className="w-full px-4 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <div className="flex items-center gap-2">
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
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
                onClick={() => setTranspose((t) => t - 1)}
                className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                −
              </button>
              <div className="flex-1 text-center text-sm text-gray-700 dark:text-gray-200">
                Transpor {transpose > 0 ? `+${transpose}` : transpose}
              </div>
              <button
                aria-label="Transpor meio tom acima"
                onClick={() => setTranspose((t) => t + 1)}
                className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                +
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={vocalsOnly}
                onChange={(e) => {
                  setVocalsOnly(e.target.checked);
                  switchSource(e.target.checked);
                }}
              />
              Apenas vozes
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-none dark:bg-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/60 dark:border-none dark:bg-black/20">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Linha do tempo
          </div>
          <div className="text-xs text-gray-500">
            Arraste o marcador ou clique para navegar
          </div>
        </div>
        <div
          ref={tabContainerRef}
          id="tabContent"
          className="relative overflow-x-auto whitespace-nowrap select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ maxWidth: "100%" }}
        >
          <div className="relative" style={{ width, height }}>
            <div
              ref={progressRef}
              className="absolute top-0 bottom-0 w-0.5 bg-brand-600 cursor-pointer"
            />
            {displayNotes.map((n: any, i: number) => {
              const midi =
                typeof n._midi === "number"
                  ? n._midi
                  : toMidiFromNote(n.note, n.octave);
              const y = (maxMidi - midi) * PX_PER_OCTAVE + 20;
              const x = n.start * PX_PER_SECOND;
              const w = Math.max((n.end - n.start) * PX_PER_SECOND, 8);
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
      </div>

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
