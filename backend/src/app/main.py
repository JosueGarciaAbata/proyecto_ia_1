from fastapi import FastAPI
from .core.config import settings

app = FastAPI(
  title = settings.app_name,
  version=settings.app_version,
  description=settings.app_description,
)

@app.get("/health")
def health():
    return {"status": "ok"}
