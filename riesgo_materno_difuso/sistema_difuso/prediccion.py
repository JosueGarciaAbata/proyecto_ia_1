from ..logica_difusa.motor import SistemaDifusoMamdani
from .configuracion import ESPECIFICACIONES_VARIABLES, VARIABLES_ENTRADA
from .entrenamiento import obtener_membresias_optimizadas


def predecir_caso(valores_entrada):
    membresias_optimizadas, origen_modelo = obtener_membresias_optimizadas()
    sistema = SistemaDifusoMamdani(membresias_optimizadas)
    entradas = construir_entrada_lote(valores_entrada)
    inferencia = sistema.inferir_lote(entradas)
    return {
        "puntaje": float(inferencia["puntajes"][0]),
        "riesgo": str(inferencia["riesgos"][0]),
        "sistema": "optimizado entrenado desde el CSV original",
        "origen_modelo": origen_modelo,
    }


def construir_entrada_lote(valores_entrada):
    valores_validados = validar_valores_entrada(valores_entrada)
    return {variable: [valor] for variable, valor in valores_validados.items()}


def validar_valores_entrada(valores_entrada):
    valores_validados = {}
    for variable in VARIABLES_ENTRADA:
        valor = float(valores_entrada[variable])
        minimo, maximo = ESPECIFICACIONES_VARIABLES[variable]["limites"]
        if not (minimo <= valor <= maximo):
            raise ValueError(
                f"{variable}={valor} esta fuera del rango permitido [{minimo}, {maximo}]."
            )
        valores_validados[variable] = valor
    return valores_validados
