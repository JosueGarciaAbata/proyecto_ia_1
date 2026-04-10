import numpy as np

from .config import INPUT_COLUMNS, OUTPUT_GRID_SIZE, OUTPUT_VARIABLE
from .rules import RULES


def trapezoidal_membership(x, params):
    a, b, c, d = [float(value) for value in params]
    x = np.asarray(x, dtype=float)
    membership = np.zeros_like(x, dtype=float)

    if a == b:
        membership[(x >= a) & (x <= c)] = 1.0
    else:
        rising = (a < x) & (x < b)
        membership[rising] = (x[rising] - a) / (b - a)
        membership[(x >= b) & (x <= c)] = 1.0

    if c == d:
        membership[(x >= b) & (x <= d)] = np.maximum(
            membership[(x >= b) & (x <= d)],
            1.0,
        )
    else:
        falling = (c < x) & (x < d)
        membership[falling] = (d - x[falling]) / (d - c)
        membership[(x >= b) & (x <= c)] = 1.0

    return np.clip(membership, 0.0, 1.0)


def triangular_membership(x, params):
    a, b, c = [float(value) for value in params]
    x = np.asarray(x, dtype=float)
    membership = np.zeros_like(x, dtype=float)

    if b > a:
        rising = (a < x) & (x < b)
        membership[rising] = (x[rising] - a) / (b - a)
    if c > b:
        falling = (b < x) & (x < c)
        membership[falling] = (c - x[falling]) / (c - b)

    membership[x == b] = 1.0
    return np.clip(membership, 0.0, 1.0)


class MamdaniFuzzySystem:
    def __init__(self, input_memberships):
        self.input_memberships = input_memberships
        output_min, output_max = OUTPUT_VARIABLE["universe"]
        self.output_universe = np.linspace(output_min, output_max, OUTPUT_GRID_SIZE)
        self.neutral_score = 50.0
        self.output_memberships = {
            label: trapezoidal_membership(self.output_universe, params)
            for label, params in OUTPUT_VARIABLE["terms"].items()
        }

    def fuzzify_batch(self, X):
        fuzzified = {}
        for variable in INPUT_COLUMNS:
            values = np.asarray(X[variable], dtype=float)
            fuzzified[variable] = {
                term: trapezoidal_membership(values, params)
                for term, params in self.input_memberships[variable].items()
            }
        return fuzzified

    def infer_batch(self, X):
        fuzzified = self.fuzzify_batch(X)
        n_samples = len(next(iter(X.values())))
        activation_levels = {
            "low": np.zeros(n_samples, dtype=float),
            "mid": np.zeros(n_samples, dtype=float),
            "high": np.zeros(n_samples, dtype=float),
        }

        for rule in RULES:
            antecedent_memberships = [
                fuzzified[variable][term] for variable, term in rule["antecedent"]
            ]
            firing_strength = np.minimum.reduce(antecedent_memberships)
            current = activation_levels[rule["consequent"]]
            activation_levels[rule["consequent"]] = np.maximum(current, firing_strength)

        scores = self.defuzzify_batch(activation_levels)
        labels = np.array([score_to_label(score) for score in scores], dtype=object)
        return {
            "scores": scores,
            "labels": labels,
            "activation_levels": activation_levels,
        }

    def defuzzify_batch(self, activation_levels):
        clipped_outputs = [
            np.minimum(activation_levels[label][:, None], membership[None, :])
            for label, membership in self.output_memberships.items()
        ]
        aggregated = np.maximum.reduce(clipped_outputs)
        denominator = np.trapezoid(aggregated, self.output_universe, axis=1)
        numerator = np.trapezoid(
            aggregated * self.output_universe[None, :],
            self.output_universe,
            axis=1,
        )

        scores = np.full(aggregated.shape[0], np.nan, dtype=float)
        valid = denominator > 0.0
        scores[valid] = numerator[valid] / denominator[valid]
        # Conservative execution safeguard for uncovered rule combinations:
        # if no rule fires, use the fixed output midpoint so the system remains
        # executable without altering the rule base or the output variable.
        scores[~valid] = self.neutral_score
        return scores


def score_to_label(score):
    if np.isnan(score):
        return None
    if score < 45.0:
        return "low risk"
    if score < 70.0:
        return "mid risk"
    return "high risk"
