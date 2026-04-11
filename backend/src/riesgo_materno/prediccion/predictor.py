from ..entrenamiento.entrenador import obtener_membresias_optimizadas
from ..logica_difusa.motor import SistemaDifusoMamdani
from .validacion_entrada import construir_entrada_lote

# Dado los valores de entrada de un paciente, da el riesgo.
def predecir_caso(valores_entrada):
    # Recordar: membrias_optimizadas -> funciones de pertenenecia.
    membresias_optimizadas, origen_modelo = obtener_membresias_optimizadas()
    
    sistema = SistemaDifusoMamdani(membresias_optimizadas)

    # Aqui hacemos el ajuste, es decir si llega una variable como 20.2 y tiene un ajute de 0.5, se ajusta a 20.0,
    # y se guarda aquello para mostrarlo en la respuesta.
    entradas, ajustes = construir_entrada_lote(valores_entrada)

    inferencia = sistema.inferir_lote(entradas)

    return {
        "puntaje": float(inferencia["puntajes"][0]),
        "riesgo": str(inferencia["riesgos"][0]),
        "sistema": "optimizado entrenado desde el CSV original",
        "origen_modelo": origen_modelo,
        "ajustes_entrada": ajustes,
    }
