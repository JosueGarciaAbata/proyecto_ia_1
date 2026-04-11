from fastapi import FastAPI

from .controllers.riesgo_materno_controller import router as riesgo_materno_router
from .core.config import settings

app = FastAPI(
  title = settings.app_name,
  version=settings.app_version,
  description=settings.app_description,
)

app.include_router(riesgo_materno_router)

@app.get("/health")
def health():
    return {"status": "ok"}
