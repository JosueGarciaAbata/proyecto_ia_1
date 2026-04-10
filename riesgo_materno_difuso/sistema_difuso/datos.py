import numpy as np
import pandas as pd

from .configuracion import (
    COLUMNA_RIESGO_CSV,
    ETIQUETAS_RIESGO,
    MAPA_COLUMNAS_CSV,
    PROPORCIONES_SPLIT,
    VARIABLES_ENTRADA,
)


def cargar_datos(ruta_csv):
    tabla = pd.read_csv(ruta_csv)
    columnas_necesarias = list(MAPA_COLUMNAS_CSV.values()) + [COLUMNA_RIESGO_CSV]
    faltantes = [columna for columna in columnas_necesarias if columna not in tabla.columns]

    if faltantes:
        raise ValueError(f"El CSV no contiene las columnas requeridas: {faltantes}")

    datos = pd.DataFrame()
    for variable, columna_csv in MAPA_COLUMNAS_CSV.items():
        datos[variable] = pd.to_numeric(tabla[columna_csv], errors="coerce")

    datos["riesgo"] = tabla[COLUMNA_RIESGO_CSV].astype(str).str.strip().str.lower()
    etiquetas_desconocidas = sorted(set(datos["riesgo"].unique()) - set(ETIQUETAS_RIESGO))

    if etiquetas_desconocidas:
        raise ValueError(f"Hay clases no reconocidas en el CSV: {etiquetas_desconocidas}")
    if datos[VARIABLES_ENTRADA].isna().any().any():
        raise ValueError("El CSV contiene valores faltantes o no numericos.")

    return datos


def dividir_datos_estratificados(tabla):
    proporcion_entrenamiento = PROPORCIONES_SPLIT["entrenamiento"]
    proporcion_validacion = PROPORCIONES_SPLIT["validacion"]
    proporcion_prueba = PROPORCIONES_SPLIT["prueba"]

    if not np.isclose(
        proporcion_entrenamiento + proporcion_validacion + proporcion_prueba,
        1.0,
    ):
        raise ValueError("Las proporciones de entrenamiento, validacion y prueba deben sumar 1.")

    indices_por_split = {
        "entrenamiento": [],
        "validacion": [],
        "prueba": [],
    }

    for etiqueta in ETIQUETAS_RIESGO:
        indices = tabla.index[tabla["riesgo"] == etiqueta].to_numpy()
        indices_barajados = np.random.permutation(indices)
        total = len(indices_barajados)
        cantidad_entrenamiento = int(np.floor(total * proporcion_entrenamiento))
        cantidad_validacion = int(np.floor(total * proporcion_validacion))

        indices_por_split["entrenamiento"].extend(
            indices_barajados[:cantidad_entrenamiento].tolist()
        )
        indices_por_split["validacion"].extend(
            indices_barajados[
                cantidad_entrenamiento : cantidad_entrenamiento + cantidad_validacion
            ].tolist()
        )
        indices_por_split["prueba"].extend(
            indices_barajados[cantidad_entrenamiento + cantidad_validacion :].tolist()
        )

    splits = {}
    for nombre_split, indices in indices_por_split.items():
        indices_finales = np.random.permutation(np.array(indices))
        splits[nombre_split] = tabla.loc[indices_finales].reset_index(drop=True)

    return splits


def convertir_split_a_diccionario(tabla_split):
    return {
        "entradas": {
            variable: tabla_split[variable].to_numpy(dtype=float)
            for variable in VARIABLES_ENTRADA
        },
        "riesgos": tabla_split["riesgo"].to_numpy(dtype=object),
    }


def resumir_splits(splits):
    filas = []
    for nombre_split, tabla_split in splits.items():
        conteos = tabla_split["riesgo"].value_counts().reindex(ETIQUETAS_RIESGO, fill_value=0)
        filas.append(
            {
                "split": nombre_split,
                "tamano": len(tabla_split),
                "low risk": int(conteos["low risk"]),
                "mid risk": int(conteos["mid risk"]),
                "high risk": int(conteos["high risk"]),
            }
        )
    return pd.DataFrame(filas)
