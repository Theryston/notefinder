import subprocess
import os
from pydub import AudioSegment

def extract_vocals(music_file_path: str, output_file_path: str, temp_output_dir: str):
    model_name = os.getenv("DEMUCS_MODEL", "mdx_q")  # lighter than default htdemucs
    jobs = os.getenv("DEMUCS_JOBS", "1")  # limit parallelism to reduce RAM
    segment = os.getenv("DEMUCS_SEGMENT")  # e.g., "15" to split into 15s chunks

    cmd = [
        "demucs",
        "--two-stems", "vocals",
        "-n", model_name,
        "--jobs", jobs,
        "-o", temp_output_dir,
    ]

    if segment and segment.isdigit():
        cmd.extend(["--segment", segment])

    cmd.append(music_file_path)

    subprocess.run(cmd, check=True)

    filename = os.path.splitext(os.path.basename(music_file_path))[0]
    vocal_path = os.path.join(temp_output_dir, "htdemucs" if model_name.startswith("htdemucs") else model_name, filename, "vocals.wav")

    if not os.path.isfile(vocal_path):
        # Fallback: try default htdemucs folder structure if custom model path differs
        alt_path = os.path.join(temp_output_dir, "htdemucs", filename, "vocals.wav")
        if os.path.isfile(alt_path):
            vocal_path = alt_path
        else:
            raise FileNotFoundError(f"File not found: {vocal_path}")

    audio = AudioSegment.from_wav(vocal_path)

    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_sample_width(2)

    audio.export(output_file_path, format="wav")
    
    return True;