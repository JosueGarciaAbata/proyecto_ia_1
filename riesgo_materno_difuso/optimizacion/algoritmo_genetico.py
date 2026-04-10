from dataclasses import dataclass
import math

import numpy as np
import pandas as pd
import pygad

from ..logica_difusa.motor import SistemaDifusoMamdani
from ..sistema_difuso.configuracion import PARAMETROS_AG, PESOS_FITNESS
from ..sistema_difuso.metricas import calcular_macro_f1, calcular_recall_de_riesgo_alto
from .cromosoma import (
    CROMOSOMA_BASE,
    LIMITES_INFERIORES,
    LIMITES_SUPERIORES,
    RANGOS_GENES,
    decodificar_cromosoma,
    reparar_cromosoma,
)
from .penalizaciones import (
    calcular_penalizacion_desviacion,
    calcular_penalizacion_interpretabilidad,
)


FITNESS_INVALIDO = -1000.0


@dataclass
class Individuo:
    cromosoma: np.ndarray
    fitness: float
    macro_f1_validacion: float
    recall_alto_validacion: float
    penalizacion_interpretabilidad: float
    penalizacion_desviacion: float
    es_valido: bool


def ejecutar_algoritmo_genetico(datos_validacion):
    evaluaciones_cache = {}
    historial = []
    mejor_individuo = None
    generaciones_sin_mejora = 0
    poblacion_inicial = inicializar_poblacion()

    def obtener_individuo(solucion):
        clave = crear_clave_solucion(solucion)
        if clave not in evaluaciones_cache:
            evaluaciones_cache[clave] = evaluar_individuo(solucion, datos_validacion)
        return evaluaciones_cache[clave]

    def fitness_func(instancia_ga, solucion, indice_solucion):
        return obtener_individuo(solucion).fitness

    def on_generation(instancia_ga):
        nonlocal mejor_individuo, generaciones_sin_mejora
        poblacion = [obtener_individuo(solucion) for solucion in instancia_ga.population]
        mejor_generacion = max(poblacion, key=lambda individuo: individuo.fitness)
        promedio_fitness = float(np.mean([individuo.fitness for individuo in poblacion]))

        historial.append(
            {
                "generacion": int(instancia_ga.generations_completed),
                "mejor_fitness": mejor_generacion.fitness,
                "fitness_promedio": promedio_fitness,
                "macro_f1_validacion": mejor_generacion.macro_f1_validacion,
                "recall_alto_validacion": mejor_generacion.recall_alto_validacion,
            }
        )

        print(
            f"Generacion {instancia_ga.generations_completed:03d} | "
            f"fitness={mejor_generacion.fitness:.4f} | "
            f"macro_f1={mejor_generacion.macro_f1_validacion:.4f} | "
            f"recall_alto={mejor_generacion.recall_alto_validacion:.4f}"
        )

        if mejor_individuo is None or mejor_generacion.fitness > mejor_individuo.fitness:
            mejor_individuo = mejor_generacion
            generaciones_sin_mejora = 0
        else:
            generaciones_sin_mejora += 1

        if generaciones_sin_mejora >= PARAMETROS_AG["paciencia"]:
            return "stop"
        return None

    poblacion_evaluada = [obtener_individuo(solucion) for solucion in poblacion_inicial]
    mejor_inicial = max(poblacion_evaluada, key=lambda individuo: individuo.fitness)
    historial.append(
        {
            "generacion": 0,
            "mejor_fitness": mejor_inicial.fitness,
            "fitness_promedio": float(np.mean([individuo.fitness for individuo in poblacion_evaluada])),
            "macro_f1_validacion": mejor_inicial.macro_f1_validacion,
            "recall_alto_validacion": mejor_inicial.recall_alto_validacion,
        }
    )
    mejor_individuo = mejor_inicial

    instancia_ga = pygad.GA(
        initial_population=poblacion_inicial,
        num_parents_mating=PARAMETROS_AG["cantidad_hijos"],
        fitness_func=fitness_func,
        num_generations=PARAMETROS_AG["maximo_generaciones"],
        parent_selection_type="tournament",
        K_tournament=PARAMETROS_AG["tamano_torneo"],
        keep_elitism=PARAMETROS_AG["elitismo"],
        crossover_type=cruce_aritmetico,
        crossover_probability=PARAMETROS_AG["probabilidad_cruce"],
        mutation_type=mutacion_gaussiana,
        mutation_probability=PARAMETROS_AG["probabilidad_mutacion"],
        gene_type=float,
        gene_space=[
            {"low": float(limite_inferior), "high": float(limite_superior)}
            for limite_inferior, limite_superior in zip(LIMITES_INFERIORES, LIMITES_SUPERIORES)
        ],
        on_generation=on_generation,
        save_solutions=False,
        suppress_warnings=True,
    )
    instancia_ga.run()

    mejor_solucion, _, _ = instancia_ga.best_solution()
    mejor_individuo = obtener_individuo(mejor_solucion)
    return mejor_individuo, pd.DataFrame(historial)


def evaluar_individuo(cromosoma, datos_validacion, cromosoma_base=CROMOSOMA_BASE):
    cromosoma_reparado, es_valido = reparar_cromosoma(cromosoma)
    if not es_valido or np.isnan(cromosoma_reparado).any():
        return Individuo(cromosoma_reparado, FITNESS_INVALIDO, 0.0, 0.0, 1.0, 1.0, False)

    sistema = SistemaDifusoMamdani(decodificar_cromosoma(cromosoma_reparado))
    inferencia = sistema.inferir_lote(datos_validacion["entradas"])
    riesgos_reales = datos_validacion["riesgos"]
    riesgos_predichos = inferencia["riesgos"]

    macro_f1 = calcular_macro_f1(riesgos_reales, riesgos_predichos)
    recall_alto = calcular_recall_de_riesgo_alto(riesgos_reales, riesgos_predichos)
    penalizacion_interpretabilidad = calcular_penalizacion_interpretabilidad(cromosoma_reparado)
    penalizacion_desviacion = calcular_penalizacion_desviacion(
        cromosoma_reparado,
        cromosoma_base,
        RANGOS_GENES,
    )

    fitness = (
        PESOS_FITNESS["macro_f1"] * macro_f1
        + PESOS_FITNESS["recall_alto"] * recall_alto
        - PESOS_FITNESS["interpretabilidad"] * penalizacion_interpretabilidad["total"]
        - PESOS_FITNESS["desviacion"] * penalizacion_desviacion
    )

    return Individuo(
        cromosoma_reparado,
        float(fitness),
        float(macro_f1),
        float(recall_alto),
        float(penalizacion_interpretabilidad["total"]),
        float(penalizacion_desviacion),
        True,
    )


def inicializar_poblacion():
    tamano = PARAMETROS_AG["tamano_poblacion"]
    sigma = 0.05 * (LIMITES_SUPERIORES - LIMITES_INFERIORES)
    poblacion = [CROMOSOMA_BASE.copy()]
    cantidad_perturbados = math.floor(0.65 * (tamano - 1))
    cantidad_aleatorios = tamano - 1 - cantidad_perturbados

    for _ in range(cantidad_perturbados):
        ruido = np.random.normal(loc=0.0, scale=sigma)
        cromosoma_reparado, _ = reparar_cromosoma(CROMOSOMA_BASE + ruido)
        poblacion.append(cromosoma_reparado)

    for _ in range(cantidad_aleatorios):
        cromosoma_aleatorio = np.random.uniform(
            low=LIMITES_INFERIORES,
            high=LIMITES_SUPERIORES,
        )
        cromosoma_reparado, _ = reparar_cromosoma(cromosoma_aleatorio)
        poblacion.append(cromosoma_reparado)

    return np.asarray(poblacion, dtype=float)


def cruce_aritmetico(padres, tamano_descendencia, instancia_ga):
    descendencia = []
    cantidad_genes = padres.shape[1]
    indice_padre = 0

    while len(descendencia) < tamano_descendencia[0]:
        padre_uno = padres[indice_padre % len(padres)]
        padre_dos = padres[(indice_padre + 1) % len(padres)]
        hijo_uno = padre_uno.copy()
        hijo_dos = padre_dos.copy()

        if np.random.random() < PARAMETROS_AG["probabilidad_cruce"]:
            lambdas = np.random.uniform(0.25, 0.75, size=cantidad_genes)
            hijo_uno = lambdas * padre_uno + (1.0 - lambdas) * padre_dos
            hijo_dos = (1.0 - lambdas) * padre_uno + lambdas * padre_dos

        hijo_uno, _ = reparar_cromosoma(hijo_uno)
        hijo_dos, _ = reparar_cromosoma(hijo_dos)
        descendencia.append(hijo_uno)

        if len(descendencia) < tamano_descendencia[0]:
            descendencia.append(hijo_dos)

        indice_padre += 2

    return np.asarray(descendencia, dtype=float)


def mutacion_gaussiana(descendencia, instancia_ga):
    descendencia_mutada = np.asarray(descendencia, dtype=float).copy()
    sigma = 0.05 * RANGOS_GENES

    for indice in range(descendencia_mutada.shape[0]):
        mascara = (
            np.random.random(size=descendencia_mutada.shape[1])
            < PARAMETROS_AG["probabilidad_mutacion"]
        )
        if mascara.any():
            descendencia_mutada[indice, mascara] += np.random.normal(
                loc=0.0,
                scale=sigma[mascara],
                size=mascara.sum(),
            )
        descendencia_mutada[indice], _ = reparar_cromosoma(descendencia_mutada[indice])

    return descendencia_mutada


def crear_clave_solucion(solucion):
    return np.asarray(solucion, dtype=np.float64).round(8).tobytes()
