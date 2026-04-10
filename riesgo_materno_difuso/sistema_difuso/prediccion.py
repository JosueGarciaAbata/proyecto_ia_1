from collections import OrderedDict
from pathlib import Path

import pandas as pd

from ..logica_difusa.motor import SistemaDifusoMamdani
from ..optimizacion.cromosoma import MEMBRESIAS_BASE
from .configuracion import ESPECIFICACIONES_VARIABLES, RUTA_SALIDAS, VARIABLES_ENTRADA


def predecir_caso(valores_entrada, usar_sistema="optimizado"):
    membresias, origen = cargar_membresias_para_prediccion(usar_sistema=usar_sistema)
    sistema = SistemaDifusoMamdani(membresias)
    entradas = construir_entrada_lote(valores_entrada)
    inferencia = sistema.inferir_lote(entradas)
    return {
        "puntaje": float(inferencia["puntajes"][0]),
        "riesgo": str(inferencia["riesgos"][0]),
        "sistema": usar_sistema,
        "origen_membresias": origen,
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


def cargar_membresias_para_prediccion(usar_sistema="optimizado"):
    ruta_optimizadas = Path(RUTA_SALIDAS) / "membresias_optimizadas.csv"
    if usar_sistema == "optimizado" and ruta_optimizadas.exists():
        return cargar_membresias_desde_csv(ruta_optimizadas), str(ruta_optimizadas)
    return MEMBRESIAS_BASE, "membresias_base"


def cargar_membresias_desde_csv(ruta_csv):
    tabla = pd.read_csv(ruta_csv)
    columna_categoria = "categoria" if "categoria" in tabla.columns else "term"
    mapa_variables_antiguas = {
        "Age": "edad",
        "SystolicBP": "presion_sistolica",
        "DiastolicBP": "presion_diastolica",
        "BS": "azucar_sangre",
        "BodyTemp": "temperatura_corporal",
        "HeartRate": "frecuencia_cardiaca",
    }
    if "variable" in tabla.columns:
        tabla["variable"] = tabla["variable"].replace(mapa_variables_antiguas)
    membresias = OrderedDict()

    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        membresias[variable] = OrderedDict()
        filas_variable = tabla.loc[tabla["variable"] == variable]

        for categoria in especificacion["categorias"].keys():
            fila = filas_variable.loc[filas_variable[columna_categoria] == categoria]
            if fila.empty:
                raise ValueError(
                    f"Falta la categoria '{categoria}' de la variable '{variable}' en {ruta_csv}."
                )

            fila = fila.iloc[0]
            membresias[variable][categoria] = [
                float(fila["a"]),
                float(fila["b"]),
                float(fila["c"]),
                float(fila["d"]),
            ]

    return membresias
