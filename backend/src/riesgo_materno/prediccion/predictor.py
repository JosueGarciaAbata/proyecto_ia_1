from ..entrenamiento.entrenador import obtener_membresias_optimizadas
from ..logica_difusa.motor import SistemaDifusoMamdani
from .validacion_entrada import construir_entrada_lote


def predecir_caso(valores_entrada):
    membresias_optimizadas, origen_modelo = obtener_membresias_optimizadas()
    sistema = SistemaDifusoMamdani(membresias_optimizadas)
    entradas, ajustes = construir_entrada_lote(valores_entrada)
    inferencia = sistema.inferir_lote(entradas)
    return {
        "puntaje": float(inferencia["puntajes"][0]),
        "riesgo": str(inferencia["riesgos"][0]),
        "sistema": "optimizado entrenado desde el CSV original",
        "origen_modelo": origen_modelo,
        "ajustes_entrada": ajustes,
    }
