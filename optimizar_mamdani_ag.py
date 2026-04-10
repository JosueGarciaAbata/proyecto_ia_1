import json
from pathlib import Path

import pandas as pd

from riesgo_materno_difuso.optimizacion.algoritmo_genetico import ejecutar_algoritmo_genetico
from riesgo_materno_difuso.optimizacion.cromosoma import (
    MEMBRESIAS_BASE,
    crear_tabla_de_membresias,
    decodificar_cromosoma,
)
from riesgo_materno_difuso.optimizacion.visualizacion import (
    guardar_comparacion_membresias_svg,
    guardar_curva_fitness_svg,
)
from riesgo_materno_difuso.sistema_difuso.configuracion import (
    ESPECIFICACIONES_VARIABLES,
    PARAMETROS_AG,
    RUTA_CSV,
    RUTA_SALIDAS,
)
from riesgo_materno_difuso.sistema_difuso.datos import (
    cargar_datos,
    convertir_split_a_diccionario,
    dividir_datos_estratificados,
    resumir_splits,
)
from riesgo_materno_difuso.sistema_difuso.evaluacion import (
    crear_tabla_comparativa,
    evaluar_membresias_en_splits,
)


def principal():
    carpeta_salidas = Path(RUTA_SALIDAS)
    carpeta_salidas.mkdir(exist_ok=True)

    datos = cargar_datos(RUTA_CSV)
    splits = dividir_datos_estratificados(datos)
    resumen_splits = resumir_splits(splits)
    resumen_splits.to_csv(carpeta_salidas / "resumen_splits.csv", index=False)
    datos_por_split = {
        nombre: convertir_split_a_diccionario(tabla)
        for nombre, tabla in splits.items()
    }

    resultados_base = evaluar_membresias_en_splits(MEMBRESIAS_BASE, datos_por_split)
    mejor_individuo, historial = ejecutar_algoritmo_genetico(datos_por_split["validacion"])
    membresias_optimizadas = decodificar_cromosoma(mejor_individuo.cromosoma)
    resultados_optimizados = evaluar_membresias_en_splits(
        membresias_optimizadas,
        datos_por_split,
    )
    tabla_comparativa = crear_tabla_comparativa(resultados_base, resultados_optimizados)
    tabla_membresias = construir_tabla_membresias(MEMBRESIAS_BASE, membresias_optimizadas)

    historial.to_csv(carpeta_salidas / "historial_fitness.csv", index=False)
    tabla_comparativa.to_csv(carpeta_salidas / "comparacion_metricas.csv", index=False)
    tabla_membresias.to_csv(carpeta_salidas / "comparacion_membresias.csv", index=False)
    pd.DataFrame(crear_tabla_de_membresias(MEMBRESIAS_BASE)).to_csv(
        carpeta_salidas / "membresias_base.csv",
        index=False,
    )
    pd.DataFrame(crear_tabla_de_membresias(membresias_optimizadas)).to_csv(
        carpeta_salidas / "membresias_optimizadas.csv",
        index=False,
    )

    guardar_curva_fitness_svg(historial, carpeta_salidas / "curva_fitness.svg")
    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        guardar_comparacion_membresias_svg(
            variable,
            MEMBRESIAS_BASE[variable],
            membresias_optimizadas[variable],
            especificacion["limites"],
            carpeta_salidas / f"{variable}_membresias.svg",
        )

    guardar_matriz_confusion(
        resultados_base["prueba"]["matriz_confusion"],
        carpeta_salidas / "matriz_confusion_base_prueba.csv",
    )
    guardar_matriz_confusion(
        resultados_optimizados["prueba"]["matriz_confusion"],
        carpeta_salidas / "matriz_confusion_optimizada_prueba.csv",
    )
    resultados_base["prueba"]["reporte_clasificacion"].to_csv(
        carpeta_salidas / "reporte_base_prueba.csv",
        index=False,
    )
    resultados_optimizados["prueba"]["reporte_clasificacion"].to_csv(
        carpeta_salidas / "reporte_optimizado_prueba.csv",
        index=False,
    )

    mejor_cromosoma = [float(valor) for valor in mejor_individuo.cromosoma.tolist()]
    (carpeta_salidas / "mejor_cromosoma.json").write_text(
        json.dumps(mejor_cromosoma, indent=2),
        encoding="utf-8",
    )
    escribir_reporte(
        carpeta_salidas / "reporte.txt",
        resumen_splits,
        resultados_base,
        resultados_optimizados,
        tabla_comparativa,
        historial,
        mejor_cromosoma,
    )

    print("Resumen de metricas")
    print("-" * 90)
    print(tabla_comparativa.to_string(index=False))
    print()
    print(f"Mejor fitness final: {mejor_individuo.fitness:.4f}")
    print(f"MacroF1 validacion final: {mejor_individuo.macro_f1_validacion:.4f}")
    print(f"Recall alto validacion final: {mejor_individuo.recall_alto_validacion:.4f}")
    print(f"Salidas guardadas en: {carpeta_salidas.resolve()}")
    print(json.dumps(PARAMETROS_AG, indent=2))


def construir_tabla_membresias(membresias_base, membresias_optimizadas):
    filas = []
    for variable in membresias_base.keys():
        for categoria in membresias_base[variable].keys():
            base = membresias_base[variable][categoria]
            optimizada = membresias_optimizadas[variable][categoria]
            filas.append(
                {
                    "variable": variable,
                    "categoria": categoria,
                    "a_base": float(base[0]),
                    "b_base": float(base[1]),
                    "c_base": float(base[2]),
                    "d_base": float(base[3]),
                    "a_optimizada": float(optimizada[0]),
                    "b_optimizada": float(optimizada[1]),
                    "c_optimizada": float(optimizada[2]),
                    "d_optimizada": float(optimizada[3]),
                }
            )
    return pd.DataFrame(filas)


def guardar_matriz_confusion(matriz, ruta_salida):
    pd.DataFrame(
        matriz,
        index=["low risk", "mid risk", "high risk"],
        columns=["low risk", "mid risk", "high risk"],
    ).to_csv(ruta_salida)


def escribir_reporte(
    ruta_salida,
    resumen_splits,
    resultados_base,
    resultados_optimizados,
    tabla_comparativa,
    historial,
    mejor_cromosoma,
):
    lineas = [
        "# Arquitectura",
        "La solucion separa logica difusa, sistema difuso y optimizacion.",
        "",
        "# Splits",
        resumen_splits.to_string(index=False),
        "",
        "# Comparacion base vs optimizado",
        tabla_comparativa.to_string(index=False),
        "",
        "# Mejor cromosoma",
        json.dumps(mejor_cromosoma, indent=2),
        "",
        "# Historial",
        historial.to_string(index=False),
        "",
        "# Resultados prueba base",
        (
            f"MacroF1={resultados_base['prueba']['macro_f1']:.4f}, "
            f"Recall_alto={resultados_base['prueba']['recall_riesgo_alto']:.4f}, "
            f"Exactitud_balanceada={resultados_base['prueba']['exactitud_balanceada']:.4f}"
        ),
        "",
        "# Resultados prueba optimizado",
        (
            f"MacroF1={resultados_optimizados['prueba']['macro_f1']:.4f}, "
            f"Recall_alto={resultados_optimizados['prueba']['recall_riesgo_alto']:.4f}, "
            f"Exactitud_balanceada={resultados_optimizados['prueba']['exactitud_balanceada']:.4f}"
        ),
    ]
    ruta_salida.write_text("\n".join(lineas), encoding="utf-8")
