from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pipeline import pipeline, import_yt_audio
from fastapi.responses import FileResponse
import os
import random
from prediction_history import prediction_history
from job_queue import JobQueue
from contextlib import asynccontextmanager

job_queue = JobQueue()

@asynccontextmanager
async def lifespan(app: FastAPI):
    job_queue.start(num_workers=1)
    try:
        yield
    finally:
        job_queue.stop()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/import_yt_vocals")
async def api_import_yt_vocals(request: Request):
    data = await request.json()
    content_path = data.get("content_path")
    vocals_file_path = import_yt_audio(content_path)
    if vocals_file_path:
        import shutil
        filename = os.path.basename(vocals_file_path)
        upload_path = os.path.join(UPLOAD_DIR, filename)
        shutil.copy2(vocals_file_path, upload_path)
        return JSONResponse(status_code=200, content={"path": upload_path})
    else:
        return JSONResponse(status_code=400, content={"error": "Failed to extract vocals"})


@app.post("/pipeline")
async def run_pipeline(request: Request):
    data = await request.json()
    content_path = data.get("content_path")
    content_type = data.get("content_type", "file")
    metadata = data.get("metadata") or {}

    if not content_path:
        return JSONResponse(status_code=400, content={"error": "Missing content_path"})

    notes, prediction_id = pipeline(content_path, save_to_history=True, content_type=content_type, metadata=metadata)

    return JSONResponse(status_code=200, content={
        "notes": notes,
        "prediction_id": prediction_id,
        "notes_count": len(notes)
    })


# Queue-based async processing
@app.post("/queue/enqueue")
async def enqueue_job(request: Request):
    data = await request.json()
    content_path = data.get("content_path")
    content_type = data.get("content_type", "file")
    metadata = data.get("metadata") or {}

    if not content_path:
        return JSONResponse(status_code=400, content={"error": "Missing content_path"})

    # Inject youtube_url into metadata for better titles when relevant
    if content_type == "youtube" and "youtube_url" not in metadata:
        metadata["youtube_url"] = content_path

    job_id = job_queue.enqueue(content_path=content_path, content_type=content_type, metadata=metadata)
    return JSONResponse(status_code=202, content={"job_id": job_id, "status": "queued"})


@app.get("/queue/status/{job_id}")
async def get_job_status(job_id: str):
    job = job_queue.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return JSONResponse(status_code=200, content=job)


@app.get("/queue/recent")
async def list_recent_jobs(limit: int = 20):
    jobs = job_queue.list(limit=limit)
    return JSONResponse(status_code=200, content={"jobs": jobs})


@app.get("/predictions")
async def get_predictions(limit: int = 10):
    """Retorna as predições mais recentes"""
    predictions = prediction_history.get_recent_predictions(limit)
    return JSONResponse(status_code=200, content={"predictions": predictions})


@app.get("/predictions/stats")
async def get_prediction_stats():
    """Retorna estatísticas das predições"""
    stats = prediction_history.get_statistics()
    return JSONResponse(status_code=200, content={"statistics": stats})


@app.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Retorna uma predição específica pelo ID"""
    prediction = prediction_history.get_prediction_by_id(prediction_id)
    if prediction:
        # surface vocals_path for frontend audio usage
        return JSONResponse(status_code=200, content={"prediction": prediction})
    else:
        return JSONResponse(status_code=404, content={"error": "Prediction not found"})


@app.delete("/predictions/{prediction_id}")
async def delete_prediction(prediction_id: str):
    """Remove uma predição do histórico"""
    success = prediction_history.delete_prediction(prediction_id)
    if success:
        return JSONResponse(status_code=200, content={"message": "Prediction deleted successfully"})
    else:
        return JSONResponse(status_code=404, content={"error": "Prediction not found"})


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, f"{random.randint(1000, 9999)}-{file.filename}")
    with open(file_location, "wb") as f:
        f.write(await file.read())
    return {"path": file_location}


@app.get("/")
async def web_file():
    return FileResponse("web/index.html")


@app.get("/new")
async def new_page():
    return FileResponse("web/new.html")


@app.get("/timeline")
async def timeline_page():
    return FileResponse("web/timeline.html")


@app.get('/uploads/{filepath:path}')
async def serve_uploads(filepath: str):
    file_path = os.path.join(UPLOAD_DIR, filepath)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "File not found"})


@app.get("/{filepath:path}")
async def serve_static_files(filepath: str):
    file_path = os.path.join("web", filepath)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "File not found"})


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
