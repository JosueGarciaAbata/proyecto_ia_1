import numpy as np
import pandas as pd

from .configuracion import ETIQUETAS_RIESGO


def crear_resumen_evaluacion(riesgos_reales, riesgos_predichos):
    return {
        "macro_f1": calcular_macro_f1(riesgos_reales, riesgos_predichos),
        "recall_riesgo_alto": calcular_recall_de_riesgo_alto(riesgos_reales, riesgos_predichos),
        "exactitud_balanceada": calcular_exactitud_balanceada(riesgos_reales, riesgos_predichos),
        "matriz_confusion": crear_matriz_confusion(riesgos_reales, riesgos_predichos),
        "reporte_clasificacion": crear_reporte_clasificacion_tabla(
            riesgos_reales,
            riesgos_predichos,
        ),
    }


def crear_reporte_clasificacion_tabla(riesgos_reales, riesgos_predichos, etiquetas=None):
    etiquetas = etiquetas or ETIQUETAS_RIESGO
    tabla = calcular_metricas_por_clase(riesgos_reales, riesgos_predichos, etiquetas=etiquetas)
    exactitud = float(np.mean(np.asarray(riesgos_reales) == np.asarray(riesgos_predichos)))
    promedio_macro = {
        "etiqueta": "promedio macro",
        "precision": float(tabla["precision"].mean()),
        "recall": float(tabla["recall"].mean()),
        "f1": float(tabla["f1"].mean()),
        "soporte": int(tabla["soporte"].sum()),
    }
    promedio_ponderado = {
        "etiqueta": "promedio ponderado",
        "precision": float(np.average(tabla["precision"], weights=tabla["soporte"])),
        "recall": float(np.average(tabla["recall"], weights=tabla["soporte"])),
        "f1": float(np.average(tabla["f1"], weights=tabla["soporte"])),
        "soporte": int(tabla["soporte"].sum()),
    }
    fila_exactitud = {
        "etiqueta": "exactitud",
        "precision": exactitud,
        "recall": exactitud,
        "f1": exactitud,
        "soporte": int(tabla["soporte"].sum()),
    }
    return pd.concat(
        [tabla, pd.DataFrame([fila_exactitud, promedio_macro, promedio_ponderado])],
        ignore_index=True,
    )


def calcular_exactitud_balanceada(riesgos_reales, riesgos_predichos, etiquetas=None):
    tabla = calcular_metricas_por_clase(riesgos_reales, riesgos_predichos, etiquetas=etiquetas)
    return float(tabla["recall"].mean())


def calcular_recall_de_riesgo_alto(riesgos_reales, riesgos_predichos):
    tabla = calcular_metricas_por_clase(riesgos_reales, riesgos_predichos)
    fila = tabla.loc[tabla["etiqueta"] == "high risk"]
    if fila.empty:
        return 0.0
    return float(fila["recall"].iloc[0])


def calcular_macro_f1(riesgos_reales, riesgos_predichos, etiquetas=None):
    tabla = calcular_metricas_por_clase(riesgos_reales, riesgos_predichos, etiquetas=etiquetas)
    return float(tabla["f1"].mean())


def calcular_metricas_por_clase(riesgos_reales, riesgos_predichos, etiquetas=None):
    etiquetas = etiquetas or ETIQUETAS_RIESGO
    matriz = crear_matriz_confusion(riesgos_reales, riesgos_predichos, etiquetas=etiquetas)
    filas = []

    for indice, etiqueta in enumerate(etiquetas):
        verdaderos_positivos = matriz[indice, indice]
        falsos_positivos = matriz[:, indice].sum() - verdaderos_positivos
        falsos_negativos = matriz[indice, :].sum() - verdaderos_positivos
        soporte = matriz[indice, :].sum()

        precision = (
            verdaderos_positivos / (verdaderos_positivos + falsos_positivos)
            if (verdaderos_positivos + falsos_positivos) > 0
            else 0.0
        )
        recall = (
            verdaderos_positivos / (verdaderos_positivos + falsos_negativos)
            if (verdaderos_positivos + falsos_negativos) > 0
            else 0.0
        )
        f1 = (
            2.0 * precision * recall / (precision + recall)
            if (precision + recall) > 0
            else 0.0
        )

        filas.append(
            {
                "etiqueta": etiqueta,
                "precision": precision,
                "recall": recall,
                "f1": f1,
                "soporte": int(soporte),
            }
        )

    return pd.DataFrame(filas)


def crear_matriz_confusion(riesgos_reales, riesgos_predichos, etiquetas=None):
    etiquetas = etiquetas or ETIQUETAS_RIESGO
    indice_por_etiqueta = {etiqueta: indice for indice, etiqueta in enumerate(etiquetas)}
    matriz = np.zeros((len(etiquetas), len(etiquetas)), dtype=int)

    for real, predicho in zip(riesgos_reales, riesgos_predichos):
        matriz[indice_por_etiqueta[real], indice_por_etiqueta[predicho]] += 1

    return matriz
