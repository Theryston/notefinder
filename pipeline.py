import tempfile
import os
import youtube
import audio
import detect_notes
from prettytable import PrettyTable
import random
from prediction_history import prediction_history

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
    
def import_yt_vocals(content_path: str):
    music_file_path = os.path.join(temp_dir, "music")
    is_downloaded_yt_audio = youtube.download_youtube_audio(content_path, music_file_path)
    
    if not is_downloaded_yt_audio:
        print("Failed to download YouTube audio")
        return
    
    music_file_path = f"{music_file_path}.wav"
    
    print(f'Downloaded YouTube audio to {music_file_path}')
    

    
    return music_file_path

def pipeline(content_path: str, save_to_history: bool = True, content_type: str = "file"):
    print(f'Content path {content_path}')
    
    vocals_file_path = os.path.join(temp_dir, f"{random.randint(1000, 9999)}-vocals.wav")
    vocals_extract_temp_dir = os.path.join(temp_dir, "vocals_extract")
    audio.extract_vocals(content_path, vocals_file_path, vocals_extract_temp_dir)
    
    print(f'Vocal path {vocals_file_path}')
    
    detected_notes = detect_notes.detect_notes(vocals_file_path)
    
    log_notes(detected_notes)
    
    # Salva no histórico se solicitado
    if save_to_history:
        prediction_id = prediction_history.save_prediction(
            content_path=vocals_file_path,
            notes=detected_notes,
            content_type=content_type,
            metadata={
                "source": "pipeline_direct",
                "file_size": os.path.getsize(content_path) if os.path.exists(content_path) else None
            }
        )
        print(f'💾 Prediction saved with ID: {prediction_id}')
    
    return detected_notes
