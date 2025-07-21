from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn
from pipeline import pipeline, import_yt_vocals
from fastapi.responses import FileResponse
import os
import random

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/import_yt_vocals")
async def api_import_yt_vocals(request: Request):
    data = await request.json()
    content_path = data.get("content_path")
    vocals_file_path = import_yt_vocals(content_path)
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
    
    if not content_path:
        return JSONResponse(status_code=400, content={"error": "Missing content_path"})
    
    notes = pipeline(content_path)
    return JSONResponse(status_code=200, content={"notes": notes})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, f"{random.randint(1000, 9999)}-{file.filename}")
    with open(file_location, "wb") as f:
        f.write(await file.read())
    return {"path": file_location}

@app.get("/")
async def web_file():
    return FileResponse("web/index.html")

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
