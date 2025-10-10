export const NOTE_ORDER = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export function toMidiFromNote(note: string, octave: number) {
  return NOTE_ORDER.indexOf(note as any) + 12 * (octave + 1);
}

export function fromMidiToNote(midi: number) {
  const wrapped = ((midi % 12) + 12) % 12;
  const note = NOTE_ORDER[wrapped];
  const octave = Math.floor(midi / 12) - 1;
  return { note, octave } as { note: string; octave: number };
}

export function formatDuration(
  seconds?: number | null,
  fallback?: string | null,
) {
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  }
  if (fallback) return fallback;
  return '—';
}

export function estimateKey(
  displayNotes: Array<{
    _midi?: number;
    note: string;
    octave: number;
    start?: number;
    end?: number;
  }>,
) {
  if (!displayNotes || displayNotes.length === 0)
    return null as null | {
      tonicIndex: number;
      mode: 'maior' | 'menor';
      label: string;
    };

  const hist = new Array(12).fill(0);
  for (const n of displayNotes) {
    const midi =
      typeof n._midi === 'number' ? n._midi : toMidiFromNote(n.note, n.octave);
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
  let bestMode: 'maior' | 'menor' = 'maior';
  for (let k = 0; k < 12; k++) {
    const scoreMaj = cosineSimilarity(h, rotated(majorProfile, k));
    if (scoreMaj > bestScore) {
      bestScore = scoreMaj;
      bestIndex = k;
      bestMode = 'maior';
    }
    const scoreMin = cosineSimilarity(h, rotated(minorProfile, k));
    if (scoreMin > bestScore) {
      bestScore = scoreMin;
      bestIndex = k;
      bestMode = 'menor';
    }
  }
  const tonic = NOTE_ORDER[bestIndex];
  return {
    tonicIndex: bestIndex,
    mode: bestMode,
    label: `${tonic} ${bestMode}`,
  } as const;
}
