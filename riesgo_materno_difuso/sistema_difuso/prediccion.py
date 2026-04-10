from ..logica_difusa.motor import SistemaDifusoMamdani
from .configuracion import ESPECIFICACIONES_VARIABLES, VARIABLES_ENTRADA
from .entrenamiento import obtener_membresias_optimizadas


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


def construir_entrada_lote(valores_entrada):
    valores_validados, ajustes = validar_valores_entrada(valores_entrada)
    return (
        {variable: [valor] for variable, valor in valores_validados.items()},
        ajustes,
    )


def validar_valores_entrada(valores_entrada):
    valores_validados = {}
    ajustes = []
    for variable in VARIABLES_ENTRADA:
        valor = float(valores_entrada[variable])
        minimo, maximo = ESPECIFICACIONES_VARIABLES[variable]["limites"]
        tolerancia = ESPECIFICACIONES_VARIABLES[variable]["tolerancia_saturacion"]
        valor_ajustado = saturar_si_esta_cerca_del_limite(
            variable,
            valor,
            minimo,
            maximo,
            tolerancia,
        )
        if valor_ajustado is None:
            raise ValueError(
                f"{variable}={valor} esta demasiado fuera del rango permitido [{minimo}, {maximo}]."
            )
        if valor_ajustado != valor:
            ajustes.append(
                {
                    "variable": variable,
                    "valor_original": valor,
                    "valor_ajustado": valor_ajustado,
                }
            )
        valores_validados[variable] = valor_ajustado
    return valores_validados, ajustes


def saturar_si_esta_cerca_del_limite(variable, valor, minimo, maximo, tolerancia):
    # Decision conservadora para entrada por CLI:
    # si el valor queda ligeramente fuera del dominio operativo del sistema,
    # se satura al limite; si se aleja demasiado, se rechaza.
    if minimo <= valor <= maximo:
        return valor
    if minimo - tolerancia <= valor < minimo:
        return minimo
    if maximo < valor <= maximo + tolerancia:
        return maximo
    return None
