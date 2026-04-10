from collections import OrderedDict

import numpy as np

from .config import VARIABLE_SPECS


def get_raw_base_input_memberships():
    memberships = OrderedDict()
    for variable, spec in VARIABLE_SPECS.items():
        memberships[variable] = OrderedDict()
        for term, params in spec["terms"].items():
            memberships[variable][term] = np.asarray(params, dtype=float)
    return memberships


def flatten_memberships(input_memberships):
    genes = []
    gene_mins = []
    gene_maxs = []
    gene_ranges = []
    layout = []

    for variable, spec in VARIABLE_SPECS.items():
        lower, upper = spec["bounds"]
        variable_range = upper - lower
        for term in spec["terms"].keys():
            params = np.asarray(input_memberships[variable][term], dtype=float)
            genes.extend(params.tolist())
            gene_mins.extend([lower] * 4)
            gene_maxs.extend([upper] * 4)
            gene_ranges.extend([variable_range] * 4)
            layout.extend([(variable, term, parameter_index) for parameter_index in range(4)])

    return (
        np.asarray(genes, dtype=float),
        np.asarray(gene_mins, dtype=float),
        np.asarray(gene_maxs, dtype=float),
        np.asarray(gene_ranges, dtype=float),
        layout,
    )


def decode_chromosome(chromosome):
    memberships = OrderedDict()
    cursor = 0

    for variable, spec in VARIABLE_SPECS.items():
        memberships[variable] = OrderedDict()
        for term in spec["terms"].keys():
            memberships[variable][term] = np.asarray(
                chromosome[cursor : cursor + 4],
                dtype=float,
            )
            cursor += 4

    return memberships


def support_width(trapezoid):
    return float(trapezoid[3] - trapezoid[0])


def center_of_trapezoid(trapezoid):
    return float((trapezoid[1] + trapezoid[2]) / 2.0)


def repair_trapezoid(trapezoid, lower, upper, epsilon):
    trap = np.clip(np.sort(np.asarray(trapezoid, dtype=float)), lower, upper)
    a, b, c, d = trap
    min_support = max(epsilon * 0.5, 1e-6)

    if d - a < min_support:
        midpoint = np.clip((a + d) / 2.0, lower, upper)
        half = min_support / 2.0
        a = max(lower, midpoint - half)
        d = min(upper, midpoint + half)
        if d - a < min_support:
            if a <= lower:
                d = min(upper, lower + min_support)
            else:
                a = max(lower, upper - min_support)
                d = upper

    b = np.clip(b, a, d)
    c = np.clip(c, b, d)
    return np.asarray([a, b, c, d], dtype=float)


def sort_categories_by_center(params):
    centers = np.asarray([(row[1] + row[2]) / 2.0 for row in params], dtype=float)
    order = np.argsort(centers, kind="stable")
    return params[order]


def enforce_adjacent_constraints(params, lower, upper, epsilon):
    repaired = params.copy()

    for _ in range(5):
        repaired = np.asarray(
            [repair_trapezoid(row, lower, upper, epsilon) for row in repaired],
            dtype=float,
        )
        repaired = sort_categories_by_center(repaired)

        for idx in range(len(repaired) - 1):
            left = repaired[idx].copy()
            right = repaired[idx + 1].copy()

            if left[3] < right[0]:
                midpoint = (left[3] + right[0]) / 2.0
                left[3] = midpoint
                right[0] = midpoint

            left = repair_trapezoid(left, lower, upper, epsilon)
            right = repair_trapezoid(right, lower, upper, epsilon)

            overlap = left[3] - right[0]
            max_overlap = 0.30 * min(support_width(left), support_width(right))
            if overlap > max_overlap:
                excess = (overlap - max_overlap) / 2.0
                left[3] -= excess
                right[0] += excess

            left = repair_trapezoid(left, lower, upper, epsilon)
            right = repair_trapezoid(right, lower, upper, epsilon)

            if left[2] > right[1]:
                midpoint = (left[2] + right[1]) / 2.0
                left[2] = midpoint - epsilon / 2.0
                right[1] = midpoint + epsilon / 2.0

            left = repair_trapezoid(left, lower, upper, epsilon)
            right = repair_trapezoid(right, lower, upper, epsilon)

            overlap = left[3] - right[0]
            max_overlap = 0.30 * min(support_width(left), support_width(right))
            if overlap > max_overlap:
                excess = (overlap - max_overlap) / 2.0
                left[3] -= excess
                right[0] += excess

            left = repair_trapezoid(left, lower, upper, epsilon)
            right = repair_trapezoid(right, lower, upper, epsilon)
            repaired[idx] = left
            repaired[idx + 1] = right

    return np.asarray(
        [repair_trapezoid(row, lower, upper, epsilon) for row in repaired],
        dtype=float,
    )


def validate_variable_params(params, lower, upper, epsilon, tolerance=1e-9):
    if np.isnan(params).any():
        return False
    if np.any(params < lower - tolerance) or np.any(params > upper + tolerance):
        return False
    if np.any(np.diff(params, axis=1) < -tolerance):
        return False
    if np.any((params[:, 3] - params[:, 0]) <= tolerance):
        return False

    centers = np.asarray([center_of_trapezoid(row) for row in params], dtype=float)
    if np.any(np.diff(centers) < -tolerance):
        return False

    for idx in range(len(params) - 1):
        left = params[idx]
        right = params[idx + 1]
        if left[2] - right[1] > tolerance:
            return False
        if left[3] + tolerance < right[0]:
            return False
        overlap = left[3] - right[0]
        max_overlap = 0.30 * min(support_width(left), support_width(right))
        if overlap - max_overlap > max(epsilon * 0.1, tolerance):
            return False

    return True


def repair_variable_block(params, lower, upper, epsilon):
    repaired = np.clip(np.asarray(params, dtype=float), lower, upper)
    repaired = np.sort(repaired, axis=1)
    repaired = np.asarray(
        [repair_trapezoid(row, lower, upper, epsilon) for row in repaired],
        dtype=float,
    )
    repaired = sort_categories_by_center(repaired)
    repaired = enforce_adjacent_constraints(repaired, lower, upper, epsilon)
    repaired = sort_categories_by_center(repaired)
    repaired = np.asarray(
        [repair_trapezoid(row, lower, upper, epsilon) for row in repaired],
        dtype=float,
    )

    is_valid = validate_variable_params(repaired, lower, upper, epsilon)
    return repaired, is_valid


def repair_chromosome(chromosome):
    chromosome = np.asarray(chromosome, dtype=float).copy()
    repaired_genes = []
    is_valid = True
    cursor = 0

    for variable, spec in VARIABLE_SPECS.items():
        term_count = len(spec["terms"])
        block = chromosome[cursor : cursor + term_count * 4].reshape(term_count, 4)
        repaired_block, block_valid = repair_variable_block(
            block,
            lower=spec["bounds"][0],
            upper=spec["bounds"][1],
            epsilon=spec["epsilon"],
        )
        repaired_genes.extend(repaired_block.reshape(-1).tolist())
        is_valid = is_valid and block_valid
        cursor += term_count * 4

    repaired = np.asarray(repaired_genes, dtype=float)
    if np.isnan(repaired).any():
        is_valid = False

    return repaired, is_valid


def memberships_to_table(input_memberships):
    rows = []
    for variable, terms in input_memberships.items():
        for term, params in terms.items():
            rows.append(
                {
                    "variable": variable,
                    "term": term,
                    "a": float(params[0]),
                    "b": float(params[1]),
                    "c": float(params[2]),
                    "d": float(params[3]),
                }
            )
    return rows


RAW_BASE_INPUT_MEMBERSHIPS = get_raw_base_input_memberships()
RAW_BASE_CHROMOSOME, GENE_MINS, GENE_MAXS, GENE_RANGES, GENE_LAYOUT = flatten_memberships(
    RAW_BASE_INPUT_MEMBERSHIPS
)
BASE_CHROMOSOME, BASE_CHROMOSOME_VALID = repair_chromosome(RAW_BASE_CHROMOSOME)
