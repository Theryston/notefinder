import threading
import queue
import time
import uuid
from typing import Dict, Optional, Any

from pipeline import pipeline


class JobQueue:
    def __init__(self):
        self._queue: "queue.Queue[str]" = queue.Queue()
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._workers: list[threading.Thread] = []
        self._stop_event = threading.Event()

    def start(self, num_workers: int = 1):
        if self._workers:
            return
        self._stop_event.clear()
        for _ in range(max(1, num_workers)):
            worker = threading.Thread(target=self._worker_loop, daemon=True)
            worker.start()
            self._workers.append(worker)

    def stop(self, timeout: Optional[float] = 5.0):
        self._stop_event.set()
        # Put sentinels to unblock queue.get
        for _ in self._workers:
            self._queue.put(None)  # type: ignore[arg-type]
        for w in self._workers:
            w.join(timeout=timeout)
        self._workers.clear()

    def enqueue(self, content_path: str, content_type: str = "file", metadata: Optional[Dict[str, Any]] = None) -> str:
        job_id = str(uuid.uuid4())
        with self._lock:
            self._jobs[job_id] = {
                "id": job_id,
                "status": "pending",
                "content_path": content_path,
                "content_type": content_type,
                "enqueued_at": time.time(),
                "started_at": None,
                "finished_at": None,
                "prediction_id": None,
                "error": None,
                "progress": 0,
                "progress_message": "Na fila",
                "metadata": metadata or {},
            }
        self._queue.put(job_id)
        return job_id

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            # Return a shallow copy to avoid external mutation
            return dict(job) if job else None

    def list(self, limit: int = 50) -> list[Dict[str, Any]]:
        with self._lock:
            jobs = list(self._jobs.values())
        # Sort by enqueued_at desc
        jobs.sort(key=lambda j: j.get("enqueued_at", 0), reverse=True)
        return jobs[:limit]

    def _set_progress(self, job_id: str, progress: int, message: Optional[str] = None):
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            job["progress"] = max(0, min(100, int(progress)))
            if message is not None:
                job["progress_message"] = message

    def _worker_loop(self):
        while not self._stop_event.is_set():
            try:
                job_id = self._queue.get(timeout=0.5)
            except queue.Empty:
                continue

            if job_id is None:  # sentinel for shutdown
                break

            with self._lock:
                job = self._jobs.get(job_id)
                if not job:
                    continue
                job["status"] = "processing"
                job["started_at"] = time.time()
                job["error"] = None
                job["prediction_id"] = None
                job["progress"] = 5
                job["progress_message"] = "Iniciando"

            try:
                # Run the heavy processing with progress callback
                def on_progress(p: int, msg: str):
                    self._set_progress(job_id, p, msg)

                notes, prediction_id = pipeline(
                    job["content_path"],
                    save_to_history=True,
                    content_type=job["content_type"],
                    progress_callback=on_progress,
                    metadata=job.get("metadata") or {},
                )

                with self._lock:
                    job = self._jobs.get(job_id)
                    if job:
                        job["status"] = "completed"
                        job["finished_at"] = time.time()
                        job["prediction_id"] = prediction_id
                        job["progress"] = 100
                        job["progress_message"] = "Concluído"
            except Exception as exc:  # noqa: BLE001 - bubble failure into job record
                with self._lock:
                    job = self._jobs.get(job_id)
                    if job:
                        job["status"] = "failed"
                        job["finished_at"] = time.time()
                        job["error"] = str(exc)
                        job["progress_message"] = "Falhou"
            finally:
                self._queue.task_done() 