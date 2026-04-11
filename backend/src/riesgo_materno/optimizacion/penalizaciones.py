import numpy as np

from ..logica_difusa.variables import ESPECIFICACIONES_VARIABLES
from .cromosoma import decodificar_cromosoma


def calcular_penalizacion_interpretabilidad(cromosoma):
    membresias = decodificar_cromosoma(cromosoma)
    penalizaciones_soporte = []
    penalizaciones_huecos = []
    penalizaciones_solapamiento = []
    penalizaciones_desorden = []

    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        limite_inferior, limite_superior = especificacion["limites"]
        rango_variable = limite_superior - limite_inferior
        soporte_minimo = 0.05 * rango_variable
        filas = np.asarray(list(membresias[variable].values()), dtype=float)
        centros = (filas[:, 1] + filas[:, 2]) / 2.0

        for fila in filas:
            ancho = fila[3] - fila[0]
            penalizacion = max(0.0, soporte_minimo - ancho) / max(soporte_minimo, 1e-9)
            penalizaciones_soporte.append(np.clip(penalizacion, 0.0, 1.0))

        for indice in range(len(filas) - 1):
            izquierda = filas[indice]
            derecha = filas[indice + 1]
            hueco = max(0.0, derecha[0] - izquierda[3])
            solapamiento = max(0.0, izquierda[3] - derecha[0])
            maximo_solapamiento = 0.30 * min(
                izquierda[3] - izquierda[0],
                derecha[3] - derecha[0],
            )
            exceso_solapamiento = max(0.0, solapamiento - maximo_solapamiento)
            desorden = max(0.0, centros[indice] - centros[indice + 1])

            penalizaciones_huecos.append(np.clip(hueco / max(rango_variable, 1e-9), 0.0, 1.0))
            penalizaciones_solapamiento.append(
                np.clip(exceso_solapamiento / max(rango_variable, 1e-9), 0.0, 1.0)
            )
            penalizaciones_desorden.append(
                np.clip(desorden / max(rango_variable, 1e-9), 0.0, 1.0)
            )

    penalizacion_soporte = float(np.mean(penalizaciones_soporte)) if penalizaciones_soporte else 0.0
    penalizacion_huecos = float(np.mean(penalizaciones_huecos)) if penalizaciones_huecos else 0.0
    penalizacion_solapamiento = (
        float(np.mean(penalizaciones_solapamiento)) if penalizaciones_solapamiento else 0.0
    )
    penalizacion_desorden = (
        float(np.mean(penalizaciones_desorden)) if penalizaciones_desorden else 0.0
    )

    return {
        "soporte": penalizacion_soporte,
        "huecos": penalizacion_huecos,
        "solapamiento": penalizacion_solapamiento,
        "desorden": penalizacion_desorden,
        "total": float(
            np.mean(
                [
                    penalizacion_soporte,
                    penalizacion_huecos,
                    penalizacion_solapamiento,
                    penalizacion_desorden,
                ]
            )
        ),
    }


def calcular_penalizacion_desviacion(cromosoma, cromosoma_base, rangos_genes):
    desviaciones = np.abs(np.asarray(cromosoma) - np.asarray(cromosoma_base)) / np.asarray(
        rangos_genes
    )
    return float(np.mean(desviaciones))
