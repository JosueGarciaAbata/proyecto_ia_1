from functools import lru_cache
import json
from pathlib import Path

import numpy as np

from ..optimizacion.algoritmo_genetico import ejecutar_algoritmo_genetico
from ..optimizacion.cromosoma import MEMBRESIAS_BASE, decodificar_cromosoma, reparar_cromosoma
from .datos import cargar_datos, convertir_split_a_diccionario, dividir_datos_estratificados
from .evaluacion import crear_tabla_comparativa, evaluar_membresias_en_splits
from .modelo import RUTA_CSV, RUTA_MODELO_OPTIMIZADO


def obtener_resultado_entrenamiento(forzar_reentrenamiento=False):
    if forzar_reentrenamiento:
        entrenar_y_guardar.cache_clear()
        return entrenar_y_guardar()
    return entrenar_y_guardar()


def obtener_membresias_optimizadas():
    resultado = cargar_modelo_optimizado()
    if resultado is not None:
        return resultado["membresias_optimizadas"], "modelo persistido en disco"

    resultado = entrenar_y_guardar()
    return resultado["membresias_optimizadas"], "modelo entrenado y guardado desde el CSV"


@lru_cache(maxsize=1)
def entrenar_y_guardar():
    datos = cargar_datos(RUTA_CSV)
    splits = dividir_datos_estratificados(datos)
    datos_por_split = {
        nombre: convertir_split_a_diccionario(tabla)
        for nombre, tabla in splits.items()
    }
    # Se necesita un punto de comparacion, despues no sabemos si el optimizado realmente mejoró.
    resultados_base = evaluar_membresias_en_splits(MEMBRESIAS_BASE, datos_por_split)
    mejor_individuo, historial = ejecutar_algoritmo_genetico(datos_por_split["validacion"])
    membresias_optimizadas = decodificar_cromosoma(mejor_individuo.cromosoma)
    resultados_optimizados = evaluar_membresias_en_splits(
        membresias_optimizadas,
        datos_por_split,
    )
    tabla_comparativa = crear_tabla_comparativa(resultados_base, resultados_optimizados)

    resultado = {
        "splits": splits,
        "datos_por_split": datos_por_split,
        "membresias_base": MEMBRESIAS_BASE,
        "membresias_optimizadas": membresias_optimizadas,
        "resultados_base": resultados_base,
        "resultados_optimizados": resultados_optimizados,
        "tabla_comparativa": tabla_comparativa,
        "mejor_individuo": mejor_individuo,
        "historial": historial,
    }
    guardar_modelo_optimizado(resultado)
    return resultado


def cargar_modelo_optimizado():
    ruta_modelo = Path(RUTA_MODELO_OPTIMIZADO)
    if not ruta_modelo.exists():
        return None

    datos_modelo = json.loads(ruta_modelo.read_text(encoding="utf-8"))
    cromosoma = np.asarray(datos_modelo["mejor_cromosoma"], dtype=float)
    cromosoma_reparado = reparar_cromosoma(cromosoma)
    if np.isnan(cromosoma_reparado).any():
        return None

    return {
        "membresias_optimizadas": decodificar_cromosoma(cromosoma_reparado),
        "mejor_cromosoma": cromosoma_reparado,
        "fuente_modelo": "disco",
        "ruta_modelo": str(ruta_modelo),
    }


def guardar_modelo_optimizado(resultado):
    mejor_individuo = resultado["mejor_individuo"]
    historial = resultado["historial"]
    contenido = {
        "ruta_csv": str(RUTA_CSV),
        "mejor_cromosoma": [float(valor) for valor in mejor_individuo.cromosoma.tolist()],
        "fitness": float(mejor_individuo.fitness),
        "macro_f1_validacion": float(mejor_individuo.macro_f1_validacion),
        "recall_alto_validacion": float(mejor_individuo.recall_alto_validacion),
        "generaciones": int(len(historial) - 1),
    }
    Path(RUTA_MODELO_OPTIMIZADO).write_text(
        json.dumps(contenido, indent=2),
        encoding="utf-8",
    )
