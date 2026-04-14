import numpy as np
import pandas as pd

from ..logica_difusa.motor import SistemaDifusoMamdani
from .metricas import crear_resumen_evaluacion


def evaluar_membresias_en_splits(membresias, datos_por_split):
    """Construye el sistema difuso con las membresias dadas y mide su desempeno en cada split."""
    sistema = SistemaDifusoMamdani(membresias)
    resultados = {}
    for nombre_split, datos_split in datos_por_split.items():
        resultados[nombre_split] = evaluar_sistema_en_split(sistema, datos_split)
    return resultados


def evaluar_sistema_en_split(sistema, datos_split):
    """Infiere en lote sobre un split y devuelve macro_f1, recall_riesgo_alto y reporte por clase."""
    inferencia = sistema.inferir_lote(datos_split["entradas"])
    puntajes = inferencia["puntajes"]
    riesgos = inferencia["riesgos"]

    if np.isnan(puntajes).any() or np.any(riesgos == None):
        raise ValueError("El sistema produjo puntajes invalidos o riesgos vacios.")

    return crear_resumen_evaluacion(datos_split["riesgos"], riesgos)


def crear_tabla_comparativa(base, optimizado):
    """Compara precision, recall y f1 por clase (split prueba) entre sistema base y optimizado."""
    clases = ["low risk", "mid risk", "high risk"]
    metricas = [("precision", "Precision"), ("recall", "Recall"), ("f1", "F1")]

    reporte_base = base["prueba"]["reporte_clasificacion"].set_index("etiqueta")
    reporte_opt = optimizado["prueba"]["reporte_clasificacion"].set_index("etiqueta")

    filas = []
    for metrica_key, metrica_label in metricas:
        for clase in clases:
            filas.append({
                "metrica": f"{metrica_label} {clase}",
                "base": float(reporte_base.loc[clase, metrica_key]),
                "optimizado": float(reporte_opt.loc[clase, metrica_key]),
            })

    tabla = pd.DataFrame(filas)
    tabla["delta"] = tabla["optimizado"] - tabla["base"]
    return tabla
