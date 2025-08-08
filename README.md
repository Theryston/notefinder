# NoteFinder — Detect Vocal Notes from YouTube, Audio, and Video

Turn any song into a timeline of sung notes. NoteFinder automatically downloads or ingests audio/video (including YouTube), isolates vocals, detects the sung notes and octaves, and renders an interactive timeline in a modern web UI.

- Detects vocal notes from songs and voice tracks
- Imports directly from YouTube or local audio/video files
- Isolates vocals automatically (source separation)
- Visualizes notes on an interactive, scrollable timeline
- Exposes a clean REST API and an async processing queue

> This repository contains both the FastAPI backend and a Next.js frontend.

## Key Features

- Vocal isolation: High‑quality source separation powered by Demucs, resampled to 16 kHz mono for robust pitch tracking.
- Accurate pitch/note detection: CREPE + librosa pipeline with confidence gating, note grouping and merging to reduce spurious detections.
- YouTube ingestion: Paste any YouTube link. We download and convert audio automatically using `yt-dlp`.
- Interactive timeline UI: Zoom/scroll horizontally through time, see every detected note with octave; drag the playhead, click to seek.
- Audio A/B: Toggle “vocals only” playback to compare isolated vocals vs original content.
- Processing queue: Non-blocking job queue with live progress so multiple uploads/links can be processed concurrently.
- Recent history and stats: Persisted prediction history with counts, totals, and per‑item details.
- Docker support: One‑command container build and run.

## How It Works

1. Input
   - Upload an audio/video file, or paste a YouTube URL.
2. Vocal isolation
   - Demucs extracts the vocals stem; result is normalized to 16 kHz mono WAV.
3. Pitch tracking
   - CREPE runs frame‑level pitch estimation; frames are filtered by confidence.
4. Note grouping
   - Consecutive frames of the same note/octave are grouped and short blips are removed; near‑adjacent segments are merged.
5. Visualization
   - Notes are saved and displayed on a timeline with start/end times, note name, octave, and mean frequency (Hz).

### Libraries & Tech

- Backend: FastAPI, Uvicorn, `yt-dlp`, Demucs, ffmpeg, pydub, librosa, CREPE (TensorFlow‑CPU)
- Frontend: Next.js 14 (App Router), React 18, TanStack Query, Tailwind CSS, Headless UI
- Queue & persistence: In‑process worker threads and JSON history storage

## Repository Structure

- `server.py` — FastAPI app, endpoints, queue, static serving
- `pipeline.py` — Orchestrates vocal extraction and note detection
- `audio.py` — Demucs integration and WAV conditioning (mono, 16 kHz)
- `detect_notes.py` — CREPE pitch detection, note grouping/merging, filters
- `youtube.py` — YouTube audio download and metadata fetch via `yt-dlp`
- `prediction_history.py` — JSON‑file backed storage, stats, retrieval
- `frontend/` — Next.js app (home, new analysis, timeline viewer)
- `Dockerfile`, `requirements.txt`

## Frontend Overview

- Home (`/`)
  - Hero section, live counters (total predictions and total notes), list of recent analyses
- New Analysis (`/new`)
  - Choose “File” or “YouTube”; upload or paste a URL; submit job and watch live progress
- Timeline (`/timeline/[id]`)
  - Play/pause audio; toggle “vocals only”; adjust playback speed; drag/click to seek; notes are colored bars labeled with note+octave; below, a sortable table lists all detections with timings and mean frequency

Environment configuration for the frontend is read from `process.env.BACKEND_URL` at build time (falls back to `http://localhost:8000`).

## Quick Start (Local)

### 1) Backend (FastAPI)

Prerequisites:

- Python 3.11+
- ffmpeg
- Git

Install Python dependencies:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run the API:

```bash
python server.py
# Serves at http://localhost:8000
```

Notes:

- The server writes outputs under `uploads/` and prediction history to `data/`.
- CORS is open by default for local development.

### 2) Frontend (Next.js)

Prerequisites:

- Node.js 18+

Configure the backend URL (optional if using default `http://localhost:8000`):

```bash
# from the frontend/ directory
printf "BACKEND_URL=http://localhost:8000\n" > .env.local
```

Install and run:

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000
```

Open `http://localhost:3000` and click “Nova Análise” to get started.

## Docker

Build and run the backend API:

```bash
# Build image
docker build -t notefinder-backend .

# Run container (exposes :8000)
docker run --rm -p 8000:8000 --name notefinder notefinder-backend
```

Then run the frontend (outside Docker) pointing to `http://localhost:8000`.

> Demucs and CREPE run on CPU here (via `tensorflow-cpu`). For large videos, processing time will depend on your CPU performance.

## API Reference

Base URL: `http://localhost:8000`

- POST `/upload`
  - Multipart file upload; returns `{ path: "uploads/<id>-<filename>" }`
- POST `/import_yt_vocals`
  - Body: `{ "content_path": "<youtube_url>" }`
  - Downloads the YouTube audio and makes it available in `uploads/`; returns `{ path }`
- POST `/queue/enqueue`
  - Body: `{ content_path, content_type: "file" | "youtube", metadata? }`
  - Enqueues processing (vocal separation + note detection); returns `{ job_id }`
- GET `/queue/status/{job_id}`
  - Returns job `{ status, progress, progress_message, prediction_id? }`
- GET `/queue/recent?limit=20`
  - Returns recent jobs
- GET `/predictions?limit=10`
  - Returns recent predictions with summary info
- GET `/predictions/stats`
  - Returns counters: total predictions, total notes, etc.
- GET `/predictions/{prediction_id}`
  - Full prediction: original `content_path`, `vocals_path`, detected `notes`, and `metadata`
- DELETE `/predictions/{prediction_id}`
  - Removes a prediction from history

Example enqueue for YouTube:

```bash
curl -X POST http://localhost:8000/queue/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "content_path": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "content_type": "youtube",
    "metadata": { "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  }'
```

## Configuration

- BACKEND_URL (frontend)
  - Default: `http://localhost:8000`
  - Set via `frontend/.env.local` or at runtime when starting Next.js
- Storage
  - `uploads/` — holds uploaded files and generated vocals
  - `data/` — rolling log of recent predictions
- CORS
  - Open in development for easy local testing

## Accuracy & Limitations

- YouTube rate limits or copyright restrictions can cause download failures.
- Demucs is CPU‑intensive; long videos will take time and disk space in temp dirs.
- CREPE runs on CPU and is accurate, but background music bleed can still affect pitch; vocal isolation helps but is not perfect.
- Heuristics:
  - Confidence threshold ~0.85
  - Minimum note duration ~0.05 s
  - Merge adjacent identical notes if gap ≤ 0.2 s
- Exported vocals are WAV mono 16 kHz for stable pitch detection.

## Why NoteFinder?

- End‑to‑end pipeline: YouTube → vocals → notes → interactive timeline, in minutes
- Beautiful, responsive UI with immediate A/B of vocals vs original
- Simple REST API and a queue suitable for batch processing
- Zero‑GPU setup with Docker or local dev

## Roadmap Ideas

- Export to MIDI/MusicXML
- Per‑note confidence and loudness
- Batch imports and playlists
- Optional GPU builds for faster Demucs

## Acknowledgements

- Demucs by Facebook Research for source separation
- CREPE for pitch estimation (TensorFlow)
- librosa for audio processing
- FastAPI & Uvicorn
- Next.js, React, Tailwind CSS, TanStack Query
- `yt-dlp` for YouTube downloads
