from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn
from pipeline import pipeline
from fastapi.responses import FileResponse
import os

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/pipeline")
async def run_pipeline(request: Request):
    data = await request.json()
    content_path = data.get("content_path")
    content_type = data.get("content_type")
    
    if not content_path or not content_type:
        return JSONResponse(status_code=400, content={"error": "Missing content_path or content_type"})
    
    notes = pipeline(content_path, content_type)
    return JSONResponse(status_code=200, content={"notes": notes})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
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
