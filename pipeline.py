import tempfile
import os
import youtube
import audio
import detect_notes
from prettytable import PrettyTable
import random
from prediction_history import prediction_history
from typing import Optional, Callable, Tuple, Dict, Any

UPLOAD_DIR = "uploads";
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
    

def import_yt_audio(content_path: str):
    audio_file_path = os.path.join(temp_dir, f"{random.randint(1000, 9999)}-audio")
    is_downloaded_yt_audio = youtube.download_youtube_audio(content_path, audio_file_path)
    
    if not is_downloaded_yt_audio:
        print("Failed to download YouTube audio")
        return
    
    audio_file_path = f"{audio_file_path}.wav"
    
    print(f'Downloaded YouTube audio to {audio_file_path}')
    
    
    
    return audio_file_path


def pipeline(
    content_path: str,
    save_to_history: bool = True,
    content_type: str = "file",
    progress_callback: Optional[Callable[[int, str], None]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Tuple[list, Optional[str]]:
    print(f'Content path {content_path}')

    if progress_callback:
        progress_callback(10, "Extraindo vocais")
    
    vocals_file_path = os.path.join(UPLOAD_DIR, f"{random.randint(1000, 9999)}-vocals.wav")
    vocals_extract_temp_dir = os.path.join(temp_dir, "vocals_extract")
    audio.extract_vocals(content_path, vocals_file_path, vocals_extract_temp_dir)

    if progress_callback:
        progress_callback(60, "Detectando notas")
    
    print(f'Vocal path {vocals_file_path}')
    
    detected_notes = detect_notes.detect_notes(vocals_file_path)
    
    if progress_callback:
        progress_callback(85, "Salvando resultado")

    log_notes(detected_notes)
    
    prediction_id: Optional[str] = None
    # Salva no histórico se solicitado
    if save_to_history:
        # Build metadata with SEO-friendly display title
        meta: Dict[str, Any] = metadata.copy() if metadata else {}
        if content_type == "file":
            # prefer filename from content_path
            try:
                meta.setdefault("display_title", os.path.basename(content_path))
            except Exception:
                pass
        elif content_type == "youtube":
            # prefer provided yt_title, else fetch
            if not meta.get("display_title"):
                try:
                    yt_info = youtube.get_youtube_info(meta.get("youtube_url") or content_path)
                    if yt_info and yt_info.get("title"):
                        meta["display_title"] = yt_info["title"]
                        meta["youtube_id"] = yt_info.get("id")
                        meta["youtube_uploader"] = yt_info.get("uploader")
                except Exception:
                    pass
        # Always include file size if possible
        meta.setdefault("file_size", os.path.getsize(content_path) if os.path.exists(content_path) else None)

        prediction_id = prediction_history.save_prediction(
            content_path=content_path,
            vocals_path=vocals_file_path,
            notes=detected_notes,
            content_type=content_type,
            metadata=meta,
        )
        print(f'💾 Prediction saved with ID: {prediction_id}')
    
    if progress_callback:
        progress_callback(100, "Concluído")
    
    return detected_notes, prediction_id
