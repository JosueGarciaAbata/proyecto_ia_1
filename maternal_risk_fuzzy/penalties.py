import numpy as np

from .chromosome import decode_chromosome
from .config import VARIABLE_SPECS


def compute_interpretability_penalty(chromosome):
    memberships = decode_chromosome(chromosome)
    support_penalties = []
    gap_penalties = []
    overlap_penalties = []
    disorder_penalties = []

    for variable, spec in VARIABLE_SPECS.items():
        lower, upper = spec["bounds"]
        variable_range = upper - lower
        min_support = 0.05 * variable_range
        rows = np.asarray(list(memberships[variable].values()), dtype=float)
        centers = (rows[:, 1] + rows[:, 2]) / 2.0

        for row in rows:
            width = row[3] - row[0]
            penalty = max(0.0, min_support - width) / max(min_support, 1e-9)
            support_penalties.append(np.clip(penalty, 0.0, 1.0))

        for idx in range(len(rows) - 1):
            left = rows[idx]
            right = rows[idx + 1]
            gap = max(0.0, right[0] - left[3])
            overlap = max(0.0, left[3] - right[0])
            max_overlap = 0.30 * min(left[3] - left[0], right[3] - right[0])
            excess_overlap = max(0.0, overlap - max_overlap)
            disorder = max(0.0, centers[idx] - centers[idx + 1])

            gap_penalties.append(np.clip(gap / max(variable_range, 1e-9), 0.0, 1.0))
            overlap_penalties.append(
                np.clip(excess_overlap / max(variable_range, 1e-9), 0.0, 1.0)
            )
            disorder_penalties.append(
                np.clip(disorder / max(variable_range, 1e-9), 0.0, 1.0)
            )

    support_penalty = float(np.mean(support_penalties)) if support_penalties else 0.0
    gap_penalty = float(np.mean(gap_penalties)) if gap_penalties else 0.0
    overlap_penalty = float(np.mean(overlap_penalties)) if overlap_penalties else 0.0
    disorder_penalty = float(np.mean(disorder_penalties)) if disorder_penalties else 0.0

    return {
        "support_penalty": support_penalty,
        "gap_penalty": gap_penalty,
        "overlap_penalty": overlap_penalty,
        "disorder_penalty": disorder_penalty,
        "total": float(
            np.mean(
                [
                    support_penalty,
                    gap_penalty,
                    overlap_penalty,
                    disorder_penalty,
                ]
            )
        ),
    }


def compute_deviation_penalty(chromosome, base_chromosome, gene_ranges):
    deviation = np.abs(np.asarray(chromosome) - np.asarray(base_chromosome)) / np.asarray(
        gene_ranges
    )
    return float(np.mean(deviation))
