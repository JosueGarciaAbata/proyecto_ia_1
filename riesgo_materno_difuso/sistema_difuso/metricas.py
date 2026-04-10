import pandas as pd
from sklearn.metrics import (
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    recall_score,
)

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
    return float(balanced_accuracy_score(riesgos_reales, riesgos_predichos))


def calcular_recall_de_riesgo_alto(riesgos_reales, riesgos_predichos):
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
    etiquetas = etiquetas or ETIQUETAS_RIESGO
    return confusion_matrix(riesgos_reales, riesgos_predichos, labels=etiquetas)
