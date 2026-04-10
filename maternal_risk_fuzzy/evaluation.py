import numpy as np
import pandas as pd

from .chromosome import decode_chromosome
from .fuzzy_engine import MamdaniFuzzySystem
from .metrics import evaluation_summary


def evaluate_system_on_split(system, split_data):
    inference = system.infer_batch(split_data["X"])
    scores = inference["scores"]
    labels = inference["labels"]

    if np.isnan(scores).any() or np.any(labels == None):
        raise ValueError("El sistema produjo salidas NaN o etiquetas vacias.")

    metrics = evaluation_summary(split_data["y"], labels)
    metrics["scores"] = scores
    metrics["labels"] = labels
    return metrics


def evaluate_chromosome_on_splits(chromosome, split_arrays):
    memberships = decode_chromosome(chromosome)
    return evaluate_memberships_on_splits(memberships, split_arrays)


def evaluate_memberships_on_splits(input_memberships, split_arrays):
    system = MamdaniFuzzySystem(input_memberships)
    results = {}
    for split_name, split_data in split_arrays.items():
        results[split_name] = evaluate_system_on_split(system, split_data)
    return results


def comparative_metrics_table(base_results, optimized_results):
    rows = [
        {
            "metric": "MacroF1 train",
            "base": base_results["train"]["macro_f1"],
            "optimized": optimized_results["train"]["macro_f1"],
        },
        {
            "metric": "MacroF1 validation",
            "base": base_results["validation"]["macro_f1"],
            "optimized": optimized_results["validation"]["macro_f1"],
        },
        {
            "metric": "MacroF1 test",
            "base": base_results["test"]["macro_f1"],
            "optimized": optimized_results["test"]["macro_f1"],
        },
        {
            "metric": "Recall high validation",
            "base": base_results["validation"]["recall_high"],
            "optimized": optimized_results["validation"]["recall_high"],
        },
        {
            "metric": "Recall high test",
            "base": base_results["test"]["recall_high"],
            "optimized": optimized_results["test"]["recall_high"],
        },
        {
            "metric": "Balanced accuracy test",
            "base": base_results["test"]["balanced_accuracy"],
            "optimized": optimized_results["test"]["balanced_accuracy"],
        },
    ]
    table = pd.DataFrame(rows)
    table["delta"] = table["optimized"] - table["base"]
    return table
