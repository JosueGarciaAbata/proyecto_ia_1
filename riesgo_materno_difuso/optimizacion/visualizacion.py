from html import escape

import numpy as np

from ..logica_difusa.motor import pertenencia_trapezoidal
from ..sistema_difuso.configuracion import PUNTOS_GRAFICA


COLORES = ["#0b5fff", "#009688", "#ef6c00", "#c62828", "#6a1b9a", "#2e7d32"]


def guardar_curva_fitness_svg(historial, ruta_salida):
    ancho, alto, margen = 920, 420, 55
    generaciones = historial["generacion"].to_numpy(dtype=float)
    mejores = historial["mejor_fitness"].to_numpy(dtype=float)
    promedios = historial["fitness_promedio"].to_numpy(dtype=float)

    minimo_x = float(generaciones.min())
    maximo_x = float(generaciones.max()) if generaciones.max() > generaciones.min() else float(generaciones.min() + 1.0)
    minimo_y = float(min(mejores.min(), promedios.min()))
    maximo_y = float(max(mejores.max(), promedios.max()))
    if maximo_y <= minimo_y:
        maximo_y = minimo_y + 1.0

    puntos_mejores = escalar_puntos(
        generaciones,
        mejores,
        minimo_x,
        maximo_x,
        minimo_y,
        maximo_y,
        ancho,
        alto,
        margen,
    )
    puntos_promedios = escalar_puntos(
        generaciones,
        promedios,
        minimo_x,
        maximo_x,
        minimo_y,
        maximo_y,
        ancho,
        alto,
        margen,
    )

    partes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{ancho}" height="{alto}">',
        f'<rect width="{ancho}" height="{alto}" fill="#ffffff"/>',
        f'<text x="{margen}" y="28" font-size="20" font-family="Consolas, monospace">Curva de fitness por generacion</text>',
        f'<line x1="{margen}" y1="{alto - margen}" x2="{ancho - margen}" y2="{alto - margen}" stroke="#333" stroke-width="1.5"/>',
        f'<line x1="{margen}" y1="{margen}" x2="{margen}" y2="{alto - margen}" stroke="#333" stroke-width="1.5"/>',
        f'<polyline points="{puntos_mejores}" fill="none" stroke="#c62828" stroke-width="2.5"/>',
        f'<polyline points="{puntos_promedios}" fill="none" stroke="#1565c0" stroke-width="2.0" stroke-dasharray="6,4"/>',
    ]
    partes.append("</svg>")

    with open(ruta_salida, "w", encoding="utf-8") as archivo:
        archivo.write("\n".join(partes))


def guardar_comparacion_membresias_svg(variable, iniciales, optimizadas, limites, ruta_salida):
    ancho, alto, margen = 920, 420, 55
    minimo_x, maximo_x = limites
    valores_x = np.linspace(minimo_x, maximo_x, PUNTOS_GRAFICA)
    partes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{ancho}" height="{alto}">',
        f'<rect width="{ancho}" height="{alto}" fill="#ffffff"/>',
        f'<text x="{margen}" y="28" font-size="20" font-family="Consolas, monospace">{escape(variable)}: inicial (solida) vs optimizada (punteada)</text>',
        f'<line x1="{margen}" y1="{alto - margen}" x2="{ancho - margen}" y2="{alto - margen}" stroke="#333" stroke-width="1.5"/>',
        f'<line x1="{margen}" y1="{margen}" x2="{margen}" y2="{alto - margen}" stroke="#333" stroke-width="1.5"/>',
    ]

    for indice, (categoria, puntos_iniciales) in enumerate(iniciales.items()):
        color = COLORES[indice % len(COLORES)]
        y_inicial = pertenencia_trapezoidal(valores_x, puntos_iniciales)
        y_optimizada = pertenencia_trapezoidal(valores_x, optimizadas[categoria])
        puntos_inicial = escalar_puntos(
            valores_x,
            y_inicial,
            minimo_x,
            maximo_x,
            0.0,
            1.0,
            ancho,
            alto,
            margen,
        )
        puntos_optimizados = escalar_puntos(
            valores_x,
            y_optimizada,
            minimo_x,
            maximo_x,
            0.0,
            1.0,
            ancho,
            alto,
            margen,
        )
        partes.append(
            f'<polyline points="{puntos_inicial}" fill="none" stroke="{color}" stroke-width="2.2"/>'
        )
        partes.append(
            f'<polyline points="{puntos_optimizados}" fill="none" stroke="{color}" stroke-width="2.2" stroke-dasharray="6,4"/>'
        )

    partes.append("</svg>")

    with open(ruta_salida, "w", encoding="utf-8") as archivo:
        archivo.write("\n".join(partes))


def escalar_puntos(valores_x, valores_y, minimo_x, maximo_x, minimo_y, maximo_y, ancho, alto, margen):
    x_escalado = margen + ((valores_x - minimo_x) / (maximo_x - minimo_x)) * (ancho - 2 * margen)
    y_escalado = alto - margen - ((valores_y - minimo_y) / (maximo_y - minimo_y)) * (alto - 2 * margen)
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in zip(x_escalado, y_escalado))
