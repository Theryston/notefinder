import crepe
import numpy as np
import librosa

def freq_to_note(freq_hz):
    """
    Convert frequency in Hz to musical note name and octave.
    Returns (note_name, octave) or (None, None) if frequency is invalid.
    """
    if freq_hz == 0 or np.isnan(freq_hz):
        return None, None

    A4 = 440.0
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    midi_number = 69 + 12 * np.log2(freq_hz / A4)
    midi_number = int(round(midi_number))

    note_index = midi_number % 12
    octave = (midi_number // 12) - 1  # MIDI octave standard

    return notes[note_index], octave

def group_notes(time, freq, confidence, confidence_threshold=0.7):
    """
    Group continuous frames into notes based on confidence threshold.
    Returns a list of notes with: note name, octave, start time, end time, average frequency.
    """
    notes = []
    current_note = None

    for i in range(len(freq)):
        if confidence[i] < confidence_threshold or freq[i] == 0 or np.isnan(freq[i]):
            if current_note is not None:
                notes.append(current_note)
                current_note = None
            continue

        note_name, octave = freq_to_note(freq[i])
        if note_name is None:
            if current_note is not None:
                notes.append(current_note)
                current_note = None
            continue

        if current_note is None:
            current_note = {
                'note': note_name,
                'octave': octave,
                'start': time[i],
                'end': time[i],
                'frequencies': [freq[i]]
            }
        else:
            if current_note['note'] == note_name and current_note['octave'] == octave:
                current_note['end'] = time[i]
                current_note['frequencies'].append(freq[i])
            else:
                notes.append(current_note)
                current_note = {
                    'note': note_name,
                    'octave': octave,
                    'start': time[i],
                    'end': time[i],
                    'frequencies': [freq[i]]
                }

    if current_note is not None:
        notes.append(current_note)

    for note in notes:
        note['frequency_mean'] = float(np.mean(note['frequencies']))
        del note['frequencies']

    return notes

def merge_close_notes(notes, max_gap=0.1):
    """
    Merge consecutive identical notes if the time gap between them is very small.
    """
    if not notes:
        return []

    merged = [notes[0]]

    for i in range(1, len(notes)):
        last = merged[-1]
        current = notes[i]

        is_same_note = (
            current['note'] == last['note'] and
            current['octave'] == last['octave']
        )

        gap = current['start'] - last['end']

        if is_same_note and gap <= max_gap:
            last['end'] = current['end']
            last['frequency_mean'] = np.mean([last['frequency_mean'], current['frequency_mean']])
        else:
            merged.append(current)

    return merged


def detect_notes(vocals_file_path: str):
    audio, sr = librosa.load(vocals_file_path, sr=16000, mono=True)

    time, frequency, confidence, _ = crepe.predict(
        audio,
        sr,
        step_size=10,
        viterbi=True,
        model_capacity='full',
        verbose=0,
    )

    raw_notes = group_notes(time, frequency, confidence, confidence_threshold=0.7)

    merged_notes = merge_close_notes(raw_notes, max_gap=0.1)
    
    MIN_NOTE_DURATION = 0.1 # 0.1 seconds
    filtered_notes = [
        note for note in merged_notes
        if (note['end'] - note['start']) >= MIN_NOTE_DURATION
    ]

    return filtered_notes

