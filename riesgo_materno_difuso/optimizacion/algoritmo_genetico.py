from dataclasses import dataclass
import math

import numpy as np
import pandas as pd

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
    poblacion = [
        evaluar_individuo(cromosoma, datos_validacion)
        for cromosoma in inicializar_poblacion()
    ]
    poblacion.sort(key=lambda individuo: individuo.fitness, reverse=True)
    mejor_individuo = poblacion[0]
    historial = [
        {
            "generacion": 0,
            "mejor_fitness": mejor_individuo.fitness,
            "fitness_promedio": float(np.mean([individuo.fitness for individuo in poblacion])),
            "macro_f1_validacion": mejor_individuo.macro_f1_validacion,
            "recall_alto_validacion": mejor_individuo.recall_alto_validacion,
        }
    ]
    generaciones_sin_mejora = 0

    for generacion in range(1, PARAMETROS_AG["maximo_generaciones"] + 1):
        padres = [
            seleccionar_por_torneo(poblacion, PARAMETROS_AG["tamano_torneo"])
            for _ in range(PARAMETROS_AG["cantidad_hijos"])
        ]
        hijos = []

        for indice in range(0, PARAMETROS_AG["cantidad_hijos"], 2):
            padre_uno = padres[indice].cromosoma
            padre_dos = padres[indice + 1].cromosoma
            hijo_uno, hijo_dos = cruce_aritmetico(padre_uno, padre_dos)
            hijo_uno = mutacion_gaussiana(hijo_uno)
            hijo_dos = mutacion_gaussiana(hijo_dos)
            hijos.append(evaluar_individuo(hijo_uno, datos_validacion))
            hijos.append(evaluar_individuo(hijo_dos, datos_validacion))

        competencia = poblacion + hijos
        competencia.sort(key=lambda individuo: individuo.fitness, reverse=True)
        poblacion = competencia[: PARAMETROS_AG["tamano_poblacion"]]
        mejor_generacion = poblacion[0]

        historial.append(
            {
                "generacion": generacion,
                "mejor_fitness": mejor_generacion.fitness,
                "fitness_promedio": float(np.mean([individuo.fitness for individuo in poblacion])),
                "macro_f1_validacion": mejor_generacion.macro_f1_validacion,
                "recall_alto_validacion": mejor_generacion.recall_alto_validacion,
            }
        )

        print(
            f"Generacion {generacion:03d} | "
            f"fitness={mejor_generacion.fitness:.4f} | "
            f"macro_f1={mejor_generacion.macro_f1_validacion:.4f} | "
            f"recall_alto={mejor_generacion.recall_alto_validacion:.4f}"
        )

        if mejor_generacion.fitness > mejor_individuo.fitness:
            mejor_individuo = mejor_generacion
            generaciones_sin_mejora = 0
        else:
            generaciones_sin_mejora += 1

        if generaciones_sin_mejora >= PARAMETROS_AG["paciencia"]:
            break

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

    return poblacion


def seleccionar_por_torneo(poblacion, tamano_torneo):
    indices = np.random.randint(0, len(poblacion), size=tamano_torneo)
    candidatos = [poblacion[indice] for indice in indices]
    return max(candidatos, key=lambda individuo: individuo.fitness)


def cruce_aritmetico(padre_uno, padre_dos):
    hijo_uno = padre_uno.copy()
    hijo_dos = padre_dos.copy()

    if np.random.random() < PARAMETROS_AG["probabilidad_cruce"]:
        lambdas = np.random.uniform(0.25, 0.75, size=padre_uno.shape[0])
        hijo_uno = lambdas * padre_uno + (1.0 - lambdas) * padre_dos
        hijo_dos = (1.0 - lambdas) * padre_uno + lambdas * padre_dos

    return hijo_uno, hijo_dos


def mutacion_gaussiana(cromosoma):
    cromosoma_mutado = cromosoma.copy()
    mascara = (
        np.random.random(size=cromosoma_mutado.shape[0])
        < PARAMETROS_AG["probabilidad_mutacion"]
    )
    sigma = 0.05 * RANGOS_GENES
    cromosoma_mutado[mascara] += np.random.normal(
        loc=0.0,
        scale=sigma[mascara],
        size=mascara.sum(),
    )
    return cromosoma_mutado
