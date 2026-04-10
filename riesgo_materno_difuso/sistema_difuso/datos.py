import pandas as pd
from sklearn.model_selection import train_test_split

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

    datos = quitar_registros_con_frecuencia_cardiaca_erronea(datos)
    return datos


def dividir_datos_estratificados(tabla):
    validar_proporciones()
    proporcion_temporal = PROPORCIONES_SPLIT["validacion"] + PROPORCIONES_SPLIT["prueba"]

    entrenamiento, temporal = train_test_split(
        tabla,
        train_size=PROPORCIONES_SPLIT["entrenamiento"],
        stratify=tabla["riesgo"],
        shuffle=True,
    )
    validacion, prueba = train_test_split(
        temporal,
        train_size=PROPORCIONES_SPLIT["validacion"] / proporcion_temporal,
        stratify=temporal["riesgo"],
        shuffle=True,
    )

    return {
        "entrenamiento": entrenamiento.reset_index(drop=True),
        "validacion": validacion.reset_index(drop=True),
        "prueba": prueba.reset_index(drop=True),
    }


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


def validar_proporciones():
    total = sum(PROPORCIONES_SPLIT.values())
    if abs(total - 1.0) > 1e-9:
        raise ValueError("Las proporciones de entrenamiento, validacion y prueba deben sumar 1.")


def quitar_registros_con_frecuencia_cardiaca_erronea(datos):
    # Limpieza puntual del dataset original:
    # existen 2 filas con frecuencia cardiaca igual a 7, valor que no debe
    # participar en el entrenamiento ni en la optimizacion.
    datos_limpios = datos.loc[datos["frecuencia_cardiaca"] != 7].copy()
    return datos_limpios.reset_index(drop=True)
