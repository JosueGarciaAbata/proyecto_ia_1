import numpy as np
import skfuzzy as fuzz

from ..sistema_difuso.configuracion import (
    ESPECIFICACIONES_VARIABLES,
    PUNTOS_GRAFICA,
    PUNTOS_SALIDA,
    SALIDA_DIFUSA,
    VARIABLES_ENTRADA,
)
from .reglas import REGLAS


class SistemaDifusoMamdani:
    def __init__(self, membresias_entrada):
        self.membresias_entrada = membresias_entrada
        self.puntaje_neutro = 50.0
        self.universos_entrada = self.crear_universos_entrada()
        self.universo_salida = self.crear_universo_salida()
        self.curvas_entrada = self.crear_curvas_entrada()
        self.curvas_salida = self.crear_curvas_salida()

    def inferir_lote(self, entradas):
        puntajes = []
        riesgos = []
        activaciones = []
        cantidad_casos = len(next(iter(entradas.values())))

        for indice in range(cantidad_casos):
            caso = {
                variable: float(np.asarray(entradas[variable], dtype=float)[indice])
                for variable in VARIABLES_ENTRADA
            }
            resultado = self.inferir_caso(caso)
            puntajes.append(resultado["puntaje"])
            riesgos.append(resultado["riesgo"])
            activaciones.append(resultado["activaciones"])

        return {
            "puntajes": np.asarray(puntajes, dtype=float),
            "riesgos": np.asarray(riesgos, dtype=object),
            "activaciones": activaciones,
        }

    def inferir_caso(self, caso):
        pertenencias = self.fusificar_caso(caso)
        activaciones = self.evaluar_reglas(pertenencias)
        puntaje = self.desfusificar_activaciones(activaciones)
        return {
            "puntaje": float(puntaje),
            "riesgo": puntaje_a_riesgo(puntaje),
            "activaciones": activaciones,
        }

    def fusificar_caso(self, caso):
        pertenencias = {}
        for variable in VARIABLES_ENTRADA:
            pertenencias[variable] = {}
            universo = self.universos_entrada[variable]
            for categoria, curva in self.curvas_entrada[variable].items():
                pertenencias[variable][categoria] = float(
                    fuzz.interp_membership(universo, curva, caso[variable])
                )
        return pertenencias

    def evaluar_reglas(self, pertenencias):
        activaciones = {"bajo": 0.0, "medio": 0.0, "alto": 0.0}

        for regla in REGLAS:
            grados = [
                pertenencias[variable][categoria]
                for variable, categoria in regla["antecedentes"]
            ]
            fuerza_regla = float(np.min(grados))
            consecuente = regla["consecuente"]
            activaciones[consecuente] = max(activaciones[consecuente], fuerza_regla)

        return activaciones

    def desfusificar_activaciones(self, activaciones):
        salida_agregada = np.zeros_like(self.universo_salida, dtype=float)

        for categoria, curva_salida in self.curvas_salida.items():
            salida_recortada = np.fmin(activaciones[categoria], curva_salida)
            salida_agregada = np.fmax(salida_agregada, salida_recortada)

        if float(np.max(salida_agregada)) == 0.0:
            return self.puntaje_neutro

        return float(fuzz.defuzz(self.universo_salida, salida_agregada, "centroid"))

    def crear_universos_entrada(self):
        universos = {}
        for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
            minimo, maximo = especificacion["limites"]
            universos[variable] = np.linspace(minimo, maximo, PUNTOS_GRAFICA)
        return universos

    def crear_universo_salida(self):
        minimo_salida, maximo_salida = SALIDA_DIFUSA["universo"]
        return np.linspace(minimo_salida, maximo_salida, PUNTOS_SALIDA)

    def crear_curvas_entrada(self):
        curvas = {}
        for variable, categorias in self.membresias_entrada.items():
            universo = self.universos_entrada[variable]
            curvas[variable] = {}
            for categoria, puntos in categorias.items():
                curvas[variable][categoria] = fuzz.trapmf(universo, puntos)
        return curvas

    def crear_curvas_salida(self):
        curvas = {}
        for categoria, puntos in SALIDA_DIFUSA["categorias"].items():
            curvas[categoria] = fuzz.trapmf(self.universo_salida, puntos)
        return curvas


def puntaje_a_riesgo(puntaje):
    if np.isnan(puntaje):
        return None
    if puntaje < 45.0:
        return "low risk"
    if puntaje < 70.0:
        return "mid risk"
    return "high risk"
