from html import escape

import numpy as np

from .config import PLOT_GRID_SIZE
from .fuzzy_engine import trapezoidal_membership


COLOR_PALETTE = [
    "#0b5fff",
    "#009688",
    "#ef6c00",
    "#c62828",
    "#6a1b9a",
    "#2e7d32",
]


def _scale_points(x_values, y_values, x_min, x_max, width, height, padding):
    scaled_x = padding + ((x_values - x_min) / (x_max - x_min)) * (width - 2 * padding)
    scaled_y = height - padding - y_values * (height - 2 * padding)
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in zip(scaled_x, scaled_y))


def save_membership_comparison_svg(variable, initial_terms, optimized_terms, bounds, output_path):
    width, height, padding = 920, 420, 55
    x_min, x_max = bounds
    x_values = np.linspace(x_min, x_max, PLOT_GRID_SIZE)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="{padding}" y="28" font-size="20" font-family="Consolas, monospace">'
        f"{escape(variable)}: inicial (solida) vs optimizada (punteada)</text>",
        f'<line x1="{padding}" y1="{height - padding}" x2="{width - padding}" y2="{height - padding}" '
        'stroke="#333" stroke-width="1.5"/>',
        f'<line x1="{padding}" y1="{padding}" x2="{padding}" y2="{height - padding}" '
        'stroke="#333" stroke-width="1.5"/>',
    ]

    for tick in np.linspace(0.0, 1.0, 6):
        y = height - padding - tick * (height - 2 * padding)
        parts.append(
            f'<line x1="{padding}" y1="{y:.2f}" x2="{width - padding}" y2="{y:.2f}" '
            'stroke="#e0e0e0" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="10" y="{y + 4:.2f}" font-size="12" font-family="Consolas, monospace">'
            f"{tick:.1f}</text>"
        )

    for idx, (term, params) in enumerate(initial_terms.items()):
        color = COLOR_PALETTE[idx % len(COLOR_PALETTE)]
        y_initial = trapezoidal_membership(x_values, params)
        y_optimized = trapezoidal_membership(x_values, optimized_terms[term])
        initial_points = _scale_points(x_values, y_initial, x_min, x_max, width, height, padding)
        optimized_points = _scale_points(
            x_values,
            y_optimized,
            x_min,
            x_max,
            width,
            height,
            padding,
        )

        legend_y = 55 + idx * 18
        parts.append(
            f'<polyline points="{initial_points}" fill="none" stroke="{color}" '
            'stroke-width="2.2"/>'
        )
        parts.append(
            f'<polyline points="{optimized_points}" fill="none" stroke="{color}" '
            'stroke-width="2.2" stroke-dasharray="6,4"/>'
        )
        parts.append(
            f'<text x="{width - 300}" y="{legend_y}" font-size="12" '
            'font-family="Consolas, monospace" '
            f'fill="{color}">{escape(term)}</text>'
        )

    for tick in np.linspace(x_min, x_max, 8):
        x = padding + ((tick - x_min) / (x_max - x_min)) * (width - 2 * padding)
        parts.append(
            f'<line x1="{x:.2f}" y1="{height - padding}" x2="{x:.2f}" y2="{height - padding + 6}" '
            'stroke="#333" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{x - 12:.2f}" y="{height - padding + 22}" font-size="12" '
            'font-family="Consolas, monospace">'
            f"{tick:.1f}</text>"
        )

    parts.append("</svg>")

    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(parts))


def save_fitness_curve_svg(history_df, output_path):
    width, height, padding = 920, 420, 55
    generations = history_df["generation"].to_numpy(dtype=float)
    best_fitness = history_df["best_fitness"].to_numpy(dtype=float)
    mean_fitness = history_df["mean_fitness"].to_numpy(dtype=float)

    x_min = float(generations.min())
    x_max = float(generations.max())
    if x_max <= x_min:
        x_max = x_min + 1.0

    y_min = float(min(best_fitness.min(), mean_fitness.min()))
    y_max = float(max(best_fitness.max(), mean_fitness.max()))
    if y_max <= y_min:
        y_max = y_min + 1.0

    def to_points(x_values, y_values):
        scaled_x = padding + ((x_values - x_min) / (x_max - x_min)) * (width - 2 * padding)
        scaled_y = height - padding - ((y_values - y_min) / (y_max - y_min)) * (height - 2 * padding)
        return " ".join(f"{x:.2f},{y:.2f}" for x, y in zip(scaled_x, scaled_y))

    best_points = to_points(generations, best_fitness)
    mean_points = to_points(generations, mean_fitness)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
        f'<text x="{padding}" y="28" font-size="20" font-family="Consolas, monospace">'
        "Curva de fitness por generacion</text>",
        f'<line x1="{padding}" y1="{height - padding}" x2="{width - padding}" y2="{height - padding}" '
        'stroke="#333" stroke-width="1.5"/>',
        f'<line x1="{padding}" y1="{padding}" x2="{padding}" y2="{height - padding}" '
        'stroke="#333" stroke-width="1.5"/>',
    ]

    for tick in np.linspace(y_min, y_max, 6):
        y = height - padding - ((tick - y_min) / (y_max - y_min)) * (height - 2 * padding)
        parts.append(
            f'<line x1="{padding}" y1="{y:.2f}" x2="{width - padding}" y2="{y:.2f}" '
            'stroke="#e0e0e0" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="10" y="{y + 4:.2f}" font-size="12" font-family="Consolas, monospace">'
            f"{tick:.3f}</text>"
        )

    for tick in np.linspace(x_min, x_max, min(10, len(generations))):
        x = padding + ((tick - x_min) / (x_max - x_min)) * (width - 2 * padding)
        parts.append(
            f'<line x1="{x:.2f}" y1="{height - padding}" x2="{x:.2f}" y2="{height - padding + 6}" '
            'stroke="#333" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{x - 8:.2f}" y="{height - padding + 22}" font-size="12" '
            'font-family="Consolas, monospace">'
            f"{int(round(tick))}</text>"
        )

    parts.append(
        f'<polyline points="{best_points}" fill="none" stroke="#c62828" stroke-width="2.5"/>'
    )
    parts.append(
        f'<polyline points="{mean_points}" fill="none" stroke="#1565c0" stroke-width="2.0" stroke-dasharray="6,4"/>'
    )
    parts.append(
        f'<text x="{width - 260}" y="55" font-size="12" font-family="Consolas, monospace" fill="#c62828">'
        "best_fitness</text>"
    )
    parts.append(
        f'<text x="{width - 260}" y="73" font-size="12" font-family="Consolas, monospace" fill="#1565c0">'
        "mean_fitness</text>"
    )
    parts.append("</svg>")

    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(parts))
