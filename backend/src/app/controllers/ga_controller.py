from fastapi import APIRouter, HTTPException

from ..schemas.prediccion import (
    GAComparacionResponse,
    GAHistorialResponse,
    ReentrenarRequest,
    ReentrenarResponse,
)
from ..services.riesgo_materno_service import (
    obtener_comparacion_ga,
    obtener_historial_ga,
    reentrenar_ga,
)

router = APIRouter(prefix="/api/v1/ga", tags=["Algoritmo genetico"])


@router.get("/historial", response_model=GAHistorialResponse)
def historial_ga() -> GAHistorialResponse:
    return GAHistorialResponse(**obtener_historial_ga())


@router.get("/comparacion", response_model=GAComparacionResponse)
def comparacion_ga() -> GAComparacionResponse:
    return GAComparacionResponse(**obtener_comparacion_ga())


@router.post("/reentrenar", response_model=ReentrenarResponse)
def reentrenar(_payload: ReentrenarRequest) -> ReentrenarResponse:
    """Lanza el entrenamiento genetico completo. Puede tomar varios minutos."""
    try:
        resultado = reentrenar_ga()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ReentrenarResponse(**resultado)
