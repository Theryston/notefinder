import subprocess
import os
from pydub import AudioSegment

def extract_vocals(music_file_path: str, output_file_path: str, temp_output_dir: str):
    subprocess.run([
        "demucs",
        "--two-stems", "vocals",
        "-o", temp_output_dir,
        music_file_path
    ], check=True)

    filename = os.path.splitext(os.path.basename(music_file_path))[0]
    vocal_path = os.path.join(temp_output_dir, "htdemucs", filename, "vocals.wav")

    if not os.path.isfile(vocal_path):
        raise FileNotFoundError(f"File not found: {vocal_path}")

    audio = AudioSegment.from_wav(vocal_path)

    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_sample_width(2)

    audio.export(output_file_path, format="wav")
    
    return True;