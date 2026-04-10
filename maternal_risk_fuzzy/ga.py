from dataclasses import dataclass
import math

import numpy as np
import pandas as pd

from .chromosome import (
    BASE_CHROMOSOME,
    GENE_MAXS,
    GENE_MINS,
    GENE_RANGES,
    decode_chromosome,
    repair_chromosome,
)
from .config import FITNESS_WEIGHTS, GA_SETTINGS
from .fuzzy_engine import MamdaniFuzzySystem
from .metrics import macro_f1, recall_for_label
from .penalties import compute_deviation_penalty, compute_interpretability_penalty


INVALID_FITNESS = -1000.0


@dataclass
class Candidate:
    chromosome: np.ndarray
    fitness: float
    macro_f1_val: float
    recall_high_val: float
    interpretability_penalty: float
    deviation_penalty: float
    support_penalty: float
    gap_penalty: float
    overlap_penalty: float
    disorder_penalty: float
    valid: bool


def evaluate_candidate(chromosome, validation_split, base_chromosome=BASE_CHROMOSOME):
    repaired, is_valid = repair_chromosome(chromosome)
    if not is_valid or np.isnan(repaired).any():
        return Candidate(
            chromosome=repaired,
            fitness=INVALID_FITNESS,
            macro_f1_val=0.0,
            recall_high_val=0.0,
            interpretability_penalty=1.0,
            deviation_penalty=1.0,
            support_penalty=1.0,
            gap_penalty=1.0,
            overlap_penalty=1.0,
            disorder_penalty=1.0,
            valid=False,
        )

    system = MamdaniFuzzySystem(decode_chromosome(repaired))
    inference = system.infer_batch(validation_split["X"])
    if np.isnan(inference["scores"]).any() or np.any(inference["labels"] == None):
        return Candidate(
            chromosome=repaired,
            fitness=INVALID_FITNESS,
            macro_f1_val=0.0,
            recall_high_val=0.0,
            interpretability_penalty=1.0,
            deviation_penalty=1.0,
            support_penalty=1.0,
            gap_penalty=1.0,
            overlap_penalty=1.0,
            disorder_penalty=1.0,
            valid=False,
        )

    y_true = validation_split["y"]
    y_pred = inference["labels"]
    macro_f1_val = macro_f1(y_true, y_pred)
    recall_high_val = recall_for_label(y_true, y_pred, "high risk")
    interpretability = compute_interpretability_penalty(repaired)
    deviation_penalty = compute_deviation_penalty(repaired, base_chromosome, GENE_RANGES)

    fitness = (
        FITNESS_WEIGHTS["macro_f1"] * macro_f1_val
        + FITNESS_WEIGHTS["recall_high"] * recall_high_val
        - FITNESS_WEIGHTS["interpretability"] * interpretability["total"]
        - FITNESS_WEIGHTS["deviation"] * deviation_penalty
    )

    return Candidate(
        chromosome=repaired,
        fitness=float(fitness),
        macro_f1_val=float(macro_f1_val),
        recall_high_val=float(recall_high_val),
        interpretability_penalty=float(interpretability["total"]),
        deviation_penalty=float(deviation_penalty),
        support_penalty=float(interpretability["support_penalty"]),
        gap_penalty=float(interpretability["gap_penalty"]),
        overlap_penalty=float(interpretability["overlap_penalty"]),
        disorder_penalty=float(interpretability["disorder_penalty"]),
        valid=True,
    )


def initialize_population():
    population_size = GA_SETTINGS["population_size"]
    sigma = 0.05 * (GENE_MAXS - GENE_MINS)
    population = [BASE_CHROMOSOME.copy()]

    perturbed_count = math.floor(0.65 * (population_size - 1))
    random_count = population_size - 1 - perturbed_count

    for _ in range(perturbed_count):
        perturbation = np.random.normal(loc=0.0, scale=sigma)
        individual, _ = repair_chromosome(BASE_CHROMOSOME + perturbation)
        population.append(individual)

    for _ in range(random_count):
        random_individual = np.random.uniform(low=GENE_MINS, high=GENE_MAXS)
        individual, _ = repair_chromosome(random_individual)
        population.append(individual)

    return population


def tournament_select(population, tournament_size):
    candidate_indices = np.random.randint(0, len(population), size=tournament_size)
    candidates = [population[index] for index in candidate_indices]
    return max(candidates, key=lambda item: item.fitness)


def arithmetic_crossover(parent_one, parent_two):
    child_one = parent_one.copy()
    child_two = parent_two.copy()

    if np.random.random() < GA_SETTINGS["crossover_probability"]:
        lambdas = np.random.uniform(0.25, 0.75, size=parent_one.shape[0])
        child_one = lambdas * parent_one + (1.0 - lambdas) * parent_two
        child_two = (1.0 - lambdas) * parent_one + lambdas * parent_two

    return child_one, child_two


def gaussian_mutation(chromosome):
    mutated = chromosome.copy()
    mutation_mask = (
        np.random.random(size=mutated.shape[0]) < GA_SETTINGS["mutation_probability"]
    )
    sigma = 0.05 * GENE_RANGES
    mutated[mutation_mask] += np.random.normal(
        loc=0.0,
        scale=sigma[mutation_mask],
        size=mutation_mask.sum(),
    )
    return mutated


def run_genetic_algorithm(validation_split):
    current_population = [
        evaluate_candidate(individual, validation_split) for individual in initialize_population()
    ]
    current_population.sort(key=lambda item: item.fitness, reverse=True)
    best_candidate = current_population[0]

    history_rows = [
        {
            "generation": 0,
            "best_fitness": best_candidate.fitness,
            "mean_fitness": float(np.mean([item.fitness for item in current_population])),
            "best_macro_f1_val": best_candidate.macro_f1_val,
            "best_recall_high_val": best_candidate.recall_high_val,
            "best_interpretability_penalty": best_candidate.interpretability_penalty,
            "best_deviation_penalty": best_candidate.deviation_penalty,
        }
    ]

    stagnation = 0

    for generation in range(1, GA_SETTINGS["max_generations"] + 1):
        parents = [
            tournament_select(current_population, GA_SETTINGS["tournament_size"])
            for _ in range(GA_SETTINGS["offspring_size"])
        ]

        offspring = []
        for idx in range(0, GA_SETTINGS["offspring_size"], 2):
            parent_one = parents[idx].chromosome
            parent_two = parents[idx + 1].chromosome

            child_one, child_two = arithmetic_crossover(parent_one, parent_two)
            child_one = gaussian_mutation(child_one)
            child_two = gaussian_mutation(child_two)

            offspring.append(evaluate_candidate(child_one, validation_split))
            offspring.append(evaluate_candidate(child_two, validation_split))

        pool = current_population + offspring
        pool.sort(key=lambda item: item.fitness, reverse=True)
        elites = pool[: GA_SETTINGS["elitism"]]
        remainder = pool[GA_SETTINGS["elitism"] : GA_SETTINGS["population_size"]]
        current_population = elites + remainder
        current_population.sort(key=lambda item: item.fitness, reverse=True)

        generation_best = current_population[0]
        mean_fitness = float(np.mean([item.fitness for item in current_population]))
        history_rows.append(
            {
                "generation": generation,
                "best_fitness": generation_best.fitness,
                "mean_fitness": mean_fitness,
                "best_macro_f1_val": generation_best.macro_f1_val,
                "best_recall_high_val": generation_best.recall_high_val,
                "best_interpretability_penalty": generation_best.interpretability_penalty,
                "best_deviation_penalty": generation_best.deviation_penalty,
            }
        )

        print(
            f"Generacion {generation:03d} | "
            f"best_fitness={generation_best.fitness:.4f} | "
            f"macro_f1_val={generation_best.macro_f1_val:.4f} | "
            f"recall_high_val={generation_best.recall_high_val:.4f}"
        )

        if generation_best.fitness > best_candidate.fitness:
            best_candidate = generation_best
            stagnation = 0
        else:
            stagnation += 1

        if stagnation >= GA_SETTINGS["patience"]:
            break

    return best_candidate, pd.DataFrame(history_rows)
