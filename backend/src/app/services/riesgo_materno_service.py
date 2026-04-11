from src.riesgo_materno.prediccion import predecir_caso
from src.riesgo_materno.prediccion.predictor import obtener_curvas_membresia, predecir_caso_con_explicacion


def predecir_riesgo_materno(valores_entrada: dict[str, float]) -> dict:
    return predecir_caso(valores_entrada)

def obtener_membresias() -> dict:
    return obtener_curvas_membresia()

def explicar_prediccion(valores_entrada: dict[str, float]) -> dict:
    return predecir_caso_con_explicacion(valores_entrada)

