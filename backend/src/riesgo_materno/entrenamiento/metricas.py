import pandas as pd
from sklearn.metrics import (
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    recall_score,
)

from ..logica_difusa.variables import ETIQUETAS_RIESGO


def crear_resumen_evaluacion(riesgos_reales, riesgos_predichos):
    """Calcula macro F1, recall alto, exactitud balanceada, matriz de confusion y reporte completo."""
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
    """Genera un DataFrame con precision, recall, F1 y soporte por clase mas promedios macro y ponderado."""
    etiquetas = etiquetas or ETIQUETAS_RIESGO
    reporte = classification_report(
        riesgos_reales,
        riesgos_predichos,
        labels=etiquetas,
        output_dict=True,
        zero_division=0,
    )
    filas = []

    for etiqueta in etiquetas:
        fila = reporte[etiqueta]
        filas.append(
            {
                "etiqueta": etiqueta,
                "precision": float(fila["precision"]),
                "recall": float(fila["recall"]),
                "f1": float(fila["f1-score"]),
                "soporte": int(fila["support"]),
            }
        )

    for etiqueta_reporte, nombre_fila in (
        ("accuracy", "exactitud"),
        ("macro avg", "promedio macro"),
        ("weighted avg", "promedio ponderado"),
    ):
        fila = reporte[etiqueta_reporte]
        filas.append(
            {
                "etiqueta": nombre_fila,
                "precision": float(fila if etiqueta_reporte == "accuracy" else fila["precision"]),
                "recall": float(fila if etiqueta_reporte == "accuracy" else fila["recall"]),
                "f1": float(fila if etiqueta_reporte == "accuracy" else fila["f1-score"]),
                "soporte": int(
                    len(riesgos_reales) if etiqueta_reporte == "accuracy" else fila["support"]
                ),
            }
        )

    return pd.DataFrame(filas)


def calcular_exactitud_balanceada(riesgos_reales, riesgos_predichos):
    """Promedio del recall por clase — no se ve afectado por desbalance entre clases."""
    return float(balanced_accuracy_score(riesgos_reales, riesgos_predichos))


def calcular_recall_de_riesgo_alto(riesgos_reales, riesgos_predichos):
    """Fraccion de casos reales de high risk que el sistema detecto correctamente."""
    return float(
        recall_score(
            riesgos_reales,
            riesgos_predichos,
            labels=ETIQUETAS_RIESGO,
            average=None,
            zero_division=0,
        )[ETIQUETAS_RIESGO.index("high risk")]
    )


def calcular_macro_f1(riesgos_reales, riesgos_predichos):
    """Promedio simple del F1 de las 3 clases — trata bajo/medio/alto con igual peso."""
    return float(
        f1_score(
            riesgos_reales,
            riesgos_predichos,
            labels=ETIQUETAS_RIESGO,
            average="macro",
            zero_division=0,
        )
    )


def crear_matriz_confusion(riesgos_reales, riesgos_predichos, etiquetas=None):
    """Devuelve la matriz de confusion ordenada segun ETIQUETAS_RIESGO."""
    etiquetas = etiquetas or ETIQUETAS_RIESGO
    return confusion_matrix(riesgos_reales, riesgos_predichos, labels=etiquetas)
