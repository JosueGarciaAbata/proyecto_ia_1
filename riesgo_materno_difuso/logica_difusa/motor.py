import numpy as np

from ..sistema_difuso.configuracion import PUNTOS_SALIDA, SALIDA_DIFUSA, VARIABLES_ENTRADA
from .reglas import REGLAS


class SistemaDifusoMamdani:
    def __init__(self, membresias_entrada):
        self.membresias_entrada = membresias_entrada
        minimo_salida, maximo_salida = SALIDA_DIFUSA["universo"]
        self.universo_salida = np.linspace(minimo_salida, maximo_salida, PUNTOS_SALIDA)
        self.puntaje_neutro = 50.0
        self.membresias_salida = {
            etiqueta: pertenencia_trapezoidal(self.universo_salida, puntos)
            for etiqueta, puntos in SALIDA_DIFUSA["categorias"].items()
        }

    def inferir_lote(self, entradas):
        borrosificados = self.fusificar_lote(entradas)
        cantidad_muestras = len(next(iter(entradas.values())))
        activaciones = {
            "bajo": np.zeros(cantidad_muestras, dtype=float),
            "medio": np.zeros(cantidad_muestras, dtype=float),
            "alto": np.zeros(cantidad_muestras, dtype=float),
        }

        for regla in REGLAS:
            grados_antecedentes = [
                borrosificados[variable][categoria]
                for variable, categoria in regla["antecedentes"]
            ]
            fuerza_regla = np.minimum.reduce(grados_antecedentes)
            activacion_actual = activaciones[regla["consecuente"]]
            activaciones[regla["consecuente"]] = np.maximum(
                activacion_actual,
                fuerza_regla,
            )

        puntajes = self.desfusificar_lote(activaciones)
        riesgos = np.array([puntaje_a_riesgo(puntaje) for puntaje in puntajes], dtype=object)
        return {
            "puntajes": puntajes,
            "riesgos": riesgos,
            "activaciones": activaciones,
        }

    def fusificar_lote(self, entradas):
        borrosificados = {}
        for variable in VARIABLES_ENTRADA:
            valores = np.asarray(entradas[variable], dtype=float)
            borrosificados[variable] = {
                categoria: pertenencia_trapezoidal(valores, puntos)
                for categoria, puntos in self.membresias_entrada[variable].items()
            }
        return borrosificados

    def desfusificar_lote(self, activaciones):
        salidas_recortadas = [
            np.minimum(activaciones[etiqueta][:, None], membresia[None, :])
            for etiqueta, membresia in self.membresias_salida.items()
        ]
        salida_agregada = np.maximum.reduce(salidas_recortadas)
        divisor = np.trapezoid(salida_agregada, self.universo_salida, axis=1)
        dividendo = np.trapezoid(
            salida_agregada * self.universo_salida[None, :],
            self.universo_salida,
            axis=1,
        )

        puntajes = np.full(salida_agregada.shape[0], np.nan, dtype=float)
        puntajes[divisor > 0.0] = dividendo[divisor > 0.0] / divisor[divisor > 0.0]
        puntajes[divisor == 0.0] = self.puntaje_neutro
        return puntajes


def puntaje_a_riesgo(puntaje):
    if np.isnan(puntaje):
        return None
    if puntaje < 45.0:
        return "low risk"
    if puntaje < 70.0:
        return "mid risk"
    return "high risk"


def pertenencia_trapezoidal(x, puntos):
    a, b, c, d = [float(valor) for valor in puntos]
    x = np.asarray(x, dtype=float)
    pertenencia = np.zeros_like(x, dtype=float)

    if a == b:
        pertenencia[(x >= a) & (x <= c)] = 1.0
    else:
        subida = (a < x) & (x < b)
        pertenencia[subida] = (x[subida] - a) / (b - a)
        pertenencia[(x >= b) & (x <= c)] = 1.0

    if c == d:
        pertenencia[(x >= b) & (x <= d)] = np.maximum(
            pertenencia[(x >= b) & (x <= d)],
            1.0,
        )
    else:
        bajada = (c < x) & (x < d)
        pertenencia[bajada] = (d - x[bajada]) / (d - c)
        pertenencia[(x >= b) & (x <= c)] = 1.0

    return np.clip(pertenencia, 0.0, 1.0)


def pertenencia_triangular(x, puntos):
    a, b, c = [float(valor) for valor in puntos]
    x = np.asarray(x, dtype=float)
    pertenencia = np.zeros_like(x, dtype=float)

    if b > a:
        subida = (a < x) & (x < b)
        pertenencia[subida] = (x[subida] - a) / (b - a)
    if c > b:
        bajada = (b < x) & (x < c)
        pertenencia[bajada] = (c - x[bajada]) / (c - b)

    pertenencia[x == b] = 1.0
    return np.clip(pertenencia, 0.0, 1.0)
