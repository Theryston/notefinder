# syntax=docker/dockerfile:1
FROM python:3.11-slim

# Faster, quieter, sane defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

# System dependencies required at runtime
# - ffmpeg: for yt-dlp postprocessing and pydub
# - libsndfile1: for librosa/soundfile backend
# - ca-certificates: HTTPS for yt-dlp
# - curl: used by container HEALTHCHECK
# - git: optional but often required by some models/tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       libsndfile1 \
       ca-certificates \
       curl \
       git \
    && rm -rf /var/lib/apt/lists/*

# Define environment variables for Demucs
ENV DEMUCS_MODEL=mdx_q \
    DEMUCS_JOBS=1 \
    DEMUCS_SEGMENT=15 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1

# Put ML caches under /app/.cache (can be mounted as a persistent volume)
ENV TORCH_HOME=/app/.cache/torch \
    HF_HOME=/app/.cache/hf \
    TRANSFORMERS_CACHE=/app/.cache/hf \
    XDG_CACHE_HOME=/app/.cache

WORKDIR /app

# Prepare cache dirs (optional but avoids first-write race)
RUN mkdir -p /app/.cache/torch /app/.cache/hf

# Install Python dependencies first to leverage Docker layer caching
COPY requirements.txt ./
RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source code
# (frontend is not needed to run the API; copying the whole tree is acceptable but
#  we keep the image lean by only copying backend files)
COPY server.py pipeline.py audio.py detect_notes.py youtube.py job_queue.py prediction_history.py ./

# Ensure writable directories exist
RUN mkdir -p /app/uploads /app/data

EXPOSE 8000

# Container healthcheck (FastAPI ready)
HEALTHCHECK --interval=120s --timeout=5s --start-period=10s --retries=6 \
  CMD curl -fsS http://localhost:8000/predictions/stats >/dev/null || exit 1

# Launch FastAPI via Uvicorn in production mode (no reload)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]