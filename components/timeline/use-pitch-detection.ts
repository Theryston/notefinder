'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';

export type PitchData = {
  frequency: number;
  midi: number;
  note: string;
  octave: number;
  clarity: number;
  timestamp: number;
};

const NOTE_NAMES = [
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
];

function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

function midiToNoteAndOctave(midi: number): { note: string; octave: number } {
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  return {
    note: NOTE_NAMES[noteIndex],
    octave,
  };
}

export function usePitchDetection() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !detectorRef.current || !bufferRef.current) {
      return;
    }

    const analyser = analyserRef.current;
    const detector = detectorRef.current;
    const buffer = bufferRef.current;

    // Get time domain data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyser.getFloatTimeDomainData(buffer as any);

    // Detect pitch
    const [frequency, clarity] = detector.findPitch(
      buffer,
      analyser.context.sampleRate,
    );

    // Only process if we have a clear pitch detection
    // Clarity threshold of 0.9 helps filter out noise
    if (clarity > 0.9 && frequency > 0) {
      const midi = frequencyToMidi(frequency);
      const { note, octave } = midiToNoteAndOctave(midi);

      setCurrentPitch({
        frequency,
        midi,
        note,
        octave,
        clarity,
        timestamp: performance.now(),
      });
    } else {
      // Clear pitch if detection is not clear enough
      setCurrentPitch(null);
    }

    // Continue the loop
    animationFrameRef.current = requestAnimationFrame(detectPitch);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create pitch detector
      const bufferLength = analyser.fftSize;
      const buffer = new Float32Array(bufferLength);
      bufferRef.current = buffer;
      detectorRef.current = PitchDetector.forFloat32Array(bufferLength);

      // Start detection loop
      setIsActive(true);
      animationFrameRef.current = requestAnimationFrame(detectPitch);
    } catch (err) {
      console.error('Error starting pitch detection:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível acessar o microfone',
      );
      setIsActive(false);
    }
  }, [detectPitch]);

  const stop = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear references
    analyserRef.current = null;
    detectorRef.current = null;
    bufferRef.current = null;

    setCurrentPitch(null);
    setIsActive(false);
  }, []);

  const toggle = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    error,
    currentPitch,
    start,
    stop,
    toggle,
  };
}
