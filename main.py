import tempfile
import os
import youtube
import audio
import detect_notes
from prettytable import PrettyTable
import json
temp_dir = tempfile.mkdtemp('-notefinder-worker')

def log_notes(notes: list):
    table = PrettyTable()
    table.field_names = ["Note", "Octave", "Start (s)", "End (s)", "Frequency (Hz)"]

    for note in notes:
        table.add_row([
            note["note"],
            note["octave"],
            f'{note["start"]:.2f}',
            f'{note["end"]:.2f}',
            f'{note["frequency_mean"]:.2f}'
        ])

    print(f'🎵 Found {len(notes)} note{"s" if len(notes) != 1 else ""}')
    print(table)
    
def write_json(notes: list):
    with open("notes.json", "w") as f:
        json.dump(notes, f)
        
def main(url: str):
    # music_file_path = os.path.join(temp_dir, "music")
    # is_downloaded_yt_audio = youtube.download_youtube_audio(url, music_file_path)
    
    # if not is_downloaded_yt_audio:
    #     print("Failed to download YouTube audio")
    #     return
    
    # music_file_path = f"{music_file_path}.wav"
    
    # print(f'Downloaded YouTube audio to {music_file_path}')
    
    # vocals_file_path = os.path.join(temp_dir, "vocals.wav")
    # vocals_extract_temp_dir = os.path.join(temp_dir, "vocals_extract")
    # audio.extract_vocals(music_file_path, vocals_file_path, vocals_extract_temp_dir)
    
    # print(f'Extracted vocals to {vocals_file_path}')
    
    vocals_file_path = "vocals.wav"
    
    detected_notes = detect_notes.detect_notes(vocals_file_path)
    
    log_notes(detected_notes)
    write_json(detected_notes)

if __name__ == "__main__":
    main("https://youtu.be/kPhpHvnnn0Q")