from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from pipeline import pipeline

app = FastAPI()

@app.post("/pipeline")
async def run_pipeline(request: Request):
    data = await request.json()
    content_path = data.get("content_path")
    content_type = data.get("content_type")
    
    if not content_path or not content_type:
        return JSONResponse(status_code=400, content={"error": "Missing content_path or content_type"})
    
    notes = pipeline(content_path, content_type)
    return JSONResponse(status_code=200, content={"notes": notes})

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
