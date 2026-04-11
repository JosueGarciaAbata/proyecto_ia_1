import numpy as np
import skfuzzy as fuzz

from .variables import (
    ESPECIFICACIONES_VARIABLES,
    PUNTOS_GRAFICA,
    PUNTOS_SALIDA,
    SALIDA_DIFUSA,
    VARIABLES_ENTRADA,
)
from .reglas import REGLAS


class SistemaDifusoMamdani:
    """Motor de inferencia Mamdani para clasificacion de riesgo materno.

    Flujo: fusificacion -> evaluacion de reglas -> desfusificacion (centroide).
    """

    def __init__(self, membresias_entrada):
        self.membresias_entrada = membresias_entrada
        self.puntaje_neutro = 50.0
        
        # Recordar: universo -> posibles valores de una variable
        self.universos_entrada = self._crear_universos_entrada()
        self.universo_salida = self._crear_universo_salida()

        # Las funciones de pertenencai son la definicion maetmatica minima de la curva.
        # Las curvas son el mecanismo real que convierte numeros exactso en significados difusos.
        self.curvas_entrada = self._crear_curvas_entrada()
        self.curvas_salida = self._crear_curvas_salida()
        
        # Pre-compilar reglas para evaluacion rapida
        self._reglas_compiladas = self._compilar_reglas()

    # -- Inferencia (vectorizada para velocidad) --

    def inferir_lote(self, entradas):
        """Clasifica un lote de casos de forma vectorizada."""
        n = len(next(iter(entradas.values())))

        # Paso 1: fusificar todas las variables de golpe
        # pertenencias["edad"]["avanzada"] = [0.3]
        
        pertenencias = {}  # pertenencias[var][cat] = array de n floats
        for variable in VARIABLES_ENTRADA:
            pertenencias[variable] = {}
            universo = self.universos_entrada[variable]
            valores = np.asarray(entradas[variable], dtype=float)
            for categoria, curva in self.curvas_entrada[variable].items():
                pertenencias[variable][categoria] = np.array(
                    [fuzz.interp_membership(universo, curva, v) for v in valores],
                    dtype=float,
                )
        
        # Paso 2: evaluar reglas vectorizadamente
        # Activacion; que tan fuerte quedo actividad esta salida despues de aplicar reglas.
        act_bajo = np.zeros(n, dtype=float)
        act_medio = np.zeros(n, dtype=float)
        act_alto = np.zeros(n, dtype=float)
        mapa_act = {"bajo": act_bajo, "medio": act_medio, "alto": act_alto}

        for regla_var_cats, consecuente in self._reglas_compiladas:
            # AND de antecedentes: minimo a lo largo de antecedentes
            fuerza = np.ones(n, dtype=float)
            for variable, categoria in regla_var_cats:
                fuerza = np.minimum(fuerza, pertenencias[variable][categoria])
            # OR entre reglas: maximo
            np.maximum(mapa_act[consecuente], fuerza, out=mapa_act[consecuente])

        # Paso 3: desfusificar cada caso
        puntajes = np.empty(n, dtype=float)
        for i in range(n):
            activaciones_i = {
                "bajo": float(act_bajo[i]),
                "medio": float(act_medio[i]),
                "alto": float(act_alto[i]),
            }
            puntajes[i] = self._desfusificar(activaciones_i)

        riesgos = np.array([puntaje_a_riesgo(p) for p in puntajes], dtype=object)

        activaciones = [
            {"bajo": float(act_bajo[i]), "medio": float(act_medio[i]), "alto": float(act_alto[i])}
            for i in range(n)
        ]

        return {
            "puntajes": puntajes,
            "riesgos": riesgos,
            "activaciones": activaciones,
        }

    # -- Desfusificacion --

    def _desfusificar(self, activaciones):
        """Agrega las salidas recortadas y calcula el centroide."""
        salida_agregada = np.zeros_like(self.universo_salida, dtype=float)

        for categoria, curva_salida in self.curvas_salida.items():
            salida_recortada = np.fmin(activaciones[categoria], curva_salida)
            salida_agregada = np.fmax(salida_agregada, salida_recortada)

        if float(np.max(salida_agregada)) == 0.0:
            return self.puntaje_neutro

        return float(fuzz.defuzz(self.universo_salida, salida_agregada, "centroid"))

    # -- Compilacion de reglas --

    def _compilar_reglas(self):
        """Convierte las reglas a tuplas para evaluacion rapida."""
        compiladas = []
        for regla in REGLAS:
            var_cats = [(v, c) for v, c in regla["antecedentes"]]
            compiladas.append((var_cats, regla["consecuente"]))
        return compiladas

    # -- Construccion de universos y curvas --

    def _crear_universos_entrada(self):
        universos = {}
        for variable, espec in ESPECIFICACIONES_VARIABLES.items():
            minimo,  maximo = espec["limites"]
            universos[variable] = np.linspace(minimo, maximo, PUNTOS_GRAFICA)
        return universos

    def _crear_universo_salida(self):
        minimo, maximo = SALIDA_DIFUSA["universo"]
        return np.linspace(minimo, maximo, PUNTOS_SALIDA)

    def _crear_curvas_entrada(self):
        curvas = {}
        for variable, categorias in self.membresias_entrada.items():
            universo = self.universos_entrada[variable]
            curvas[variable] = {}
            for categoria, puntos in categorias.items():
                curvas[variable][categoria] = fuzz.trapmf(universo, puntos)
        return curvas

    def _crear_curvas_salida(self):
        curvas = {}
        for categoria, puntos in SALIDA_DIFUSA["categorias"].items():
            curvas[categoria] = fuzz.trapmf(self.universo_salida, puntos)
        return curvas


def puntaje_a_riesgo(puntaje):
    """Convierte un puntaje numerico a una etiqueta de riesgo."""
    if np.isnan(puntaje):
        return None
    if puntaje < 40.0:
        return "low risk"
    if puntaje < 65.0:
        return "mid risk"
    return "high risk"
