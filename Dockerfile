# syntax=docker/dockerfile:1

########################
# Stage 1: builder
########################
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

# Build toolchains and headers only in builder
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       pkg-config \
       cmake \
       ninja-build \
       rustc \
       cargo \
       ffmpeg \
       libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Create virtualenv for deterministic copy
ENV VENV_PATH=/opt/venv
RUN python -m venv ${VENV_PATH}
ENV PATH="${VENV_PATH}/bin:${PATH}"

# Install Python dependencies into venv
WORKDIR /build
COPY requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

########################
# Stage 2: runtime
########################
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2

# Runtime-only system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       libsndfile1 \
       ca-certificates \
       curl \
    && rm -rf /var/lib/apt/lists/*

# App env tuning
ENV DEMUCS_MODEL=mdx_q \
    DEMUCS_JOBS=1 \
    DEMUCS_SEGMENT=15 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    TORCH_HOME=/app/.cache/torch \
    HF_HOME=/app/.cache/hf \
    TRANSFORMERS_CACHE=/app/.cache/hf \
    XDG_CACHE_HOME=/app/.cache

# Copy venv from builder
ENV VENV_PATH=/opt/venv
COPY --from=builder ${VENV_PATH} ${VENV_PATH}
ENV PATH="${VENV_PATH}/bin:${PATH}"

WORKDIR /app

# Prepare cache & data dirs
RUN mkdir -p /app/.cache/torch /app/.cache/hf /app/uploads /app/data

# Copy backend source code
COPY server.py pipeline.py audio.py detect_notes.py youtube.py job_queue.py prediction_history.py ./

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=120s --timeout=5s --start-period=10s --retries=6 \
  CMD curl -fsS http://localhost:8000/predictions/stats >/dev/null || exit 1

# Entrypoint
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]