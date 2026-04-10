from collections import OrderedDict
from pathlib import Path

import pandas as pd

from .chromosome import RAW_BASE_INPUT_MEMBERSHIPS
from .config import INPUT_COLUMNS, VARIABLE_SPECS
from .fuzzy_engine import MamdaniFuzzySystem


DEFAULT_OPTIMIZED_MEMBERSHIPS_PATH = Path("outputs") / "optimized_memberships.csv"


def load_memberships_from_csv(csv_path):
    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"No existe el archivo de membresias: {csv_path}")

    table = pd.read_csv(csv_path)
    memberships = OrderedDict()

    for variable, spec in VARIABLE_SPECS.items():
        memberships[variable] = OrderedDict()
        variable_rows = table.loc[table["variable"] == variable]

        for term in spec["terms"].keys():
            row = variable_rows.loc[variable_rows["term"] == term]
            if row.empty:
                raise ValueError(
                    f"Falta la categoria '{term}' de la variable '{variable}' en {csv_path}."
                )

            row = row.iloc[0]
            memberships[variable][term] = [
                float(row["a"]),
                float(row["b"]),
                float(row["c"]),
                float(row["d"]),
            ]

    return memberships


def load_prediction_memberships(system_name="optimized"):
    if system_name == "optimized" and DEFAULT_OPTIMIZED_MEMBERSHIPS_PATH.exists():
        memberships = load_memberships_from_csv(DEFAULT_OPTIMIZED_MEMBERSHIPS_PATH)
        return memberships, str(DEFAULT_OPTIMIZED_MEMBERSHIPS_PATH)

    return RAW_BASE_INPUT_MEMBERSHIPS, "base_memberships"


def validate_input_values(input_values):
    validated = {}

    for variable in INPUT_COLUMNS:
        value = float(input_values[variable])
        lower, upper = VARIABLE_SPECS[variable]["bounds"]

        if not (lower <= value <= upper):
            raise ValueError(
                f"{variable}={value} esta fuera del rango permitido [{lower}, {upper}]."
            )

        validated[variable] = value

    return validated


def build_batch_input(input_values):
    validated = validate_input_values(input_values)
    return {variable: [value] for variable, value in validated.items()}


def predict_single_case(input_values, system_name="optimized"):
    memberships, source_name = load_prediction_memberships(system_name=system_name)
    system = MamdaniFuzzySystem(memberships)
    batch_input = build_batch_input(input_values)
    inference = system.infer_batch(batch_input)

    return {
        "score": float(inference["scores"][0]),
        "label": str(inference["labels"][0]),
        "system_name": system_name,
        "memberships_source": source_name,
    }
