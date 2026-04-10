import numpy as np
import pandas as pd

from ..logica_difusa.motor import SistemaDifusoMamdani
from ..optimizacion.cromosoma import decodificar_cromosoma
from .metricas import crear_resumen_evaluacion


def evaluar_cromosoma_en_splits(cromosoma, datos_por_split):
    membresias = decodificar_cromosoma(cromosoma)
    return evaluar_membresias_en_splits(membresias, datos_por_split)


def evaluar_membresias_en_splits(membresias, datos_por_split):
    sistema = SistemaDifusoMamdani(membresias)
    resultados = {}
    for nombre_split, datos_split in datos_por_split.items():
        resultados[nombre_split] = evaluar_sistema_en_split(sistema, datos_split)
    return resultados


def evaluar_sistema_en_split(sistema, datos_split):
    inferencia = sistema.inferir_lote(datos_split["entradas"])
    puntajes = inferencia["puntajes"]
    riesgos = inferencia["riesgos"]

    if np.isnan(puntajes).any() or np.any(riesgos == None):
        raise ValueError("El sistema produjo puntajes invalidos o riesgos vacios.")

    resumen = crear_resumen_evaluacion(datos_split["riesgos"], riesgos)
    resumen["puntajes"] = puntajes
    resumen["riesgos_predichos"] = riesgos
    return resumen


def crear_tabla_comparativa(base, optimizado):
    tabla = pd.DataFrame(
        [
            {
                "metrica": "MacroF1 entrenamiento",
                "base": base["entrenamiento"]["macro_f1"],
                "optimizado": optimizado["entrenamiento"]["macro_f1"],
            },
            {
                "metrica": "MacroF1 validacion",
                "base": base["validacion"]["macro_f1"],
                "optimizado": optimizado["validacion"]["macro_f1"],
            },
            {
                "metrica": "MacroF1 prueba",
                "base": base["prueba"]["macro_f1"],
                "optimizado": optimizado["prueba"]["macro_f1"],
            },
            {
                "metrica": "Recall alto validacion",
                "base": base["validacion"]["recall_riesgo_alto"],
                "optimizado": optimizado["validacion"]["recall_riesgo_alto"],
            },
            {
                "metrica": "Recall alto prueba",
                "base": base["prueba"]["recall_riesgo_alto"],
                "optimizado": optimizado["prueba"]["recall_riesgo_alto"],
            },
            {
                "metrica": "Exactitud balanceada prueba",
                "base": base["prueba"]["exactitud_balanceada"],
                "optimizado": optimizado["prueba"]["exactitud_balanceada"],
            },
        ]
    )
    tabla["delta"] = tabla["optimizado"] - tabla["base"]
    return tabla
