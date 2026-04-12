from ..entrenamiento.entrenador import obtener_membresias_optimizadas
from ..logica_difusa.motor import SistemaDifusoMamdani
from .validacion_entrada import construir_entrada_lote, validar_valores_entrada

"""Contiene la lógica para predecir el riesgo materno utilizando un sistema difuso de Mamdani."""
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

"""Retorna las curvas de membresía optimizadas del modelo actual, incluyendo el origen del modelo."""
def obtener_curvas_membresia():
    membresias_optimizadas, origen_modelo = obtener_membresias_optimizadas()
    sistema = SistemaDifusoMamdani(membresias_optimizadas)

    variables = {}
    for variable, universo in sistema.universos_entrada.items():
        puntos_x = universo.tolist()
        variables[variable] = {
            categoria: {
                "puntos_x": puntos_x,
                "puntos_y": curva.tolist(),
            }
            for categoria, curva in sistema.curvas_entrada[variable].items()
        }

    return {
        "variables": variables,
        "origen_modelo": origen_modelo,
    }

"""Predice el riesgo de un paciente exponiendo todo el proceso difuso."""
def predecir_caso_con_explicacion(valores_entrada):
    membresias_optimizadas, origen_modelo = obtener_membresias_optimizadas()
    sistema = SistemaDifusoMamdani(membresias_optimizadas)

    entradas, ajustes = validar_valores_entrada(valores_entrada)
    resultado = sistema.inferir_con_explicacion(entradas)

    return {
        **resultado,
        "entrada_validada": entradas,
        "origen_modelo": origen_modelo,
        "ajustes_entrada": ajustes,
    }