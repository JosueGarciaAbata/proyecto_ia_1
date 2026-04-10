from collections import OrderedDict

import numpy as np

from ..sistema_difuso.configuracion import ESPECIFICACIONES_VARIABLES


def reparar_cromosoma(cromosoma):
    cromosoma = np.asarray(cromosoma, dtype=float).copy()
    genes_reparados = []
    es_valido = True
    cursor = 0

    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        cantidad_categorias = len(especificacion["categorias"])
        bloque = cromosoma[cursor : cursor + cantidad_categorias * 4].reshape(
            cantidad_categorias,
            4,
        )
        bloque_reparado, bloque_valido = reparar_bloque_variable(
            bloque,
            limite_inferior=especificacion["limites"][0],
            limite_superior=especificacion["limites"][1],
            epsilon=especificacion["epsilon"],
        )
        genes_reparados.extend(bloque_reparado.reshape(-1).tolist())
        es_valido = es_valido and bloque_valido
        cursor += cantidad_categorias * 4

    cromosoma_reparado = np.asarray(genes_reparados, dtype=float)
    if np.isnan(cromosoma_reparado).any():
        es_valido = False

    return cromosoma_reparado, es_valido


def reparar_bloque_variable(bloque, limite_inferior, limite_superior, epsilon):
    bloque = np.clip(np.asarray(bloque, dtype=float), limite_inferior, limite_superior)
    bloque = np.sort(bloque, axis=1)
    bloque = np.asarray(
        [
            reparar_trapecio(fila, limite_inferior, limite_superior, epsilon)
            for fila in bloque
        ],
        dtype=float,
    )
    bloque = ordenar_categorias_por_centro(bloque)
    bloque = ajustar_categorias_adyacentes(
        bloque,
        limite_inferior,
        limite_superior,
        epsilon,
    )
    bloque = ordenar_categorias_por_centro(bloque)
    bloque = np.asarray(
        [
            reparar_trapecio(fila, limite_inferior, limite_superior, epsilon)
            for fila in bloque
        ],
        dtype=float,
    )
    return bloque, validar_bloque_variable(
        bloque,
        limite_inferior,
        limite_superior,
        epsilon,
    )


def validar_bloque_variable(bloque, limite_inferior, limite_superior, epsilon, tolerancia=1e-9):
    if np.isnan(bloque).any():
        return False
    if np.any(bloque < limite_inferior - tolerancia) or np.any(
        bloque > limite_superior + tolerancia
    ):
        return False
    if np.any(np.diff(bloque, axis=1) < -tolerancia):
        return False
    if np.any((bloque[:, 3] - bloque[:, 0]) <= tolerancia):
        return False

    centros = np.asarray([centro_de_trapecio(fila) for fila in bloque], dtype=float)
    if np.any(np.diff(centros) < -tolerancia):
        return False

    for indice in range(len(bloque) - 1):
        izquierda = bloque[indice]
        derecha = bloque[indice + 1]
        if izquierda[2] - derecha[1] > tolerancia:
            return False
        if izquierda[3] + tolerancia < derecha[0]:
            return False
        solapamiento = izquierda[3] - derecha[0]
        maximo_solapamiento = 0.30 * min(
            ancho_de_soporte(izquierda),
            ancho_de_soporte(derecha),
        )
        if solapamiento - maximo_solapamiento > max(epsilon * 0.1, tolerancia):
            return False

    return True


def ajustar_categorias_adyacentes(bloque, limite_inferior, limite_superior, epsilon):
    bloque = bloque.copy()

    for _ in range(5):
        bloque = np.asarray(
            [
                reparar_trapecio(fila, limite_inferior, limite_superior, epsilon)
                for fila in bloque
            ],
            dtype=float,
        )
        bloque = ordenar_categorias_por_centro(bloque)

        for indice in range(len(bloque) - 1):
            izquierda = bloque[indice].copy()
            derecha = bloque[indice + 1].copy()

            if izquierda[3] < derecha[0]:
                punto_medio = (izquierda[3] + derecha[0]) / 2.0
                izquierda[3] = punto_medio
                derecha[0] = punto_medio

            izquierda = reparar_trapecio(izquierda, limite_inferior, limite_superior, epsilon)
            derecha = reparar_trapecio(derecha, limite_inferior, limite_superior, epsilon)

            solapamiento = izquierda[3] - derecha[0]
            maximo_solapamiento = 0.30 * min(
                ancho_de_soporte(izquierda),
                ancho_de_soporte(derecha),
            )
            if solapamiento > maximo_solapamiento:
                exceso = (solapamiento - maximo_solapamiento) / 2.0
                izquierda[3] -= exceso
                derecha[0] += exceso

            izquierda = reparar_trapecio(izquierda, limite_inferior, limite_superior, epsilon)
            derecha = reparar_trapecio(derecha, limite_inferior, limite_superior, epsilon)

            if izquierda[2] > derecha[1]:
                punto_medio = (izquierda[2] + derecha[1]) / 2.0
                izquierda[2] = punto_medio - epsilon / 2.0
                derecha[1] = punto_medio + epsilon / 2.0

            izquierda = reparar_trapecio(izquierda, limite_inferior, limite_superior, epsilon)
            derecha = reparar_trapecio(derecha, limite_inferior, limite_superior, epsilon)
            bloque[indice] = izquierda
            bloque[indice + 1] = derecha

    return bloque


def ordenar_categorias_por_centro(bloque):
    centros = np.asarray([centro_de_trapecio(fila) for fila in bloque], dtype=float)
    orden = np.argsort(centros, kind="stable")
    return bloque[orden]


def reparar_trapecio(trapecio, limite_inferior, limite_superior, epsilon):
    trapecio = np.clip(
        np.sort(np.asarray(trapecio, dtype=float)),
        limite_inferior,
        limite_superior,
    )
    a, b, c, d = trapecio
    soporte_minimo = max(epsilon * 0.5, 1e-6)

    if d - a < soporte_minimo:
        punto_medio = np.clip((a + d) / 2.0, limite_inferior, limite_superior)
        mitad = soporte_minimo / 2.0
        a = max(limite_inferior, punto_medio - mitad)
        d = min(limite_superior, punto_medio + mitad)
        if d - a < soporte_minimo:
            if a <= limite_inferior:
                d = min(limite_superior, limite_inferior + soporte_minimo)
            else:
                a = max(limite_inferior, limite_superior - soporte_minimo)
                d = limite_superior

    b = np.clip(b, a, d)
    c = np.clip(c, b, d)
    return np.asarray([a, b, c, d], dtype=float)


def centro_de_trapecio(trapecio):
    return float((trapecio[1] + trapecio[2]) / 2.0)


def ancho_de_soporte(trapecio):
    return float(trapecio[3] - trapecio[0])


def crear_tabla_de_membresias(membresias):
    filas = []
    for variable, categorias in membresias.items():
        for categoria, puntos in categorias.items():
            filas.append(
                {
                    "variable": variable,
                    "categoria": categoria,
                    "a": float(puntos[0]),
                    "b": float(puntos[1]),
                    "c": float(puntos[2]),
                    "d": float(puntos[3]),
                }
            )
    return filas


def decodificar_cromosoma(cromosoma):
    membresias = OrderedDict()
    cursor = 0
    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        membresias[variable] = OrderedDict()
        for categoria in especificacion["categorias"].keys():
            membresias[variable][categoria] = np.asarray(
                cromosoma[cursor : cursor + 4],
                dtype=float,
            )
            cursor += 4
    return membresias


def aplanar_membresias(membresias):
    genes = []
    minimos = []
    maximos = []
    rangos = []

    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        limite_inferior, limite_superior = especificacion["limites"]
        rango = limite_superior - limite_inferior
        for categoria in especificacion["categorias"].keys():
            puntos = np.asarray(membresias[variable][categoria], dtype=float)
            genes.extend(puntos.tolist())
            minimos.extend([limite_inferior] * 4)
            maximos.extend([limite_superior] * 4)
            rangos.extend([rango] * 4)

    return (
        np.asarray(genes, dtype=float),
        np.asarray(minimos, dtype=float),
        np.asarray(maximos, dtype=float),
        np.asarray(rangos, dtype=float),
    )


def crear_membresias_base():
    membresias = OrderedDict()
    for variable, especificacion in ESPECIFICACIONES_VARIABLES.items():
        membresias[variable] = OrderedDict()
        for categoria, puntos in especificacion["categorias"].items():
            membresias[variable][categoria] = np.asarray(puntos, dtype=float)
    return membresias


MEMBRESIAS_BASE = crear_membresias_base()
CROMOSOMA_BASE_CRUDO, LIMITES_INFERIORES, LIMITES_SUPERIORES, RANGOS_GENES = aplanar_membresias(
    MEMBRESIAS_BASE
)
CROMOSOMA_BASE, CROMOSOMA_BASE_VALIDO = reparar_cromosoma(CROMOSOMA_BASE_CRUDO)
