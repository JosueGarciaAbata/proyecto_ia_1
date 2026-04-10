from collections import OrderedDict


DATASET_PATH = "Maternal Health Risk Data Set.csv"
TARGET_COLUMN = "RiskLevel"
INPUT_COLUMNS = [
    "Age",
    "SystolicBP",
    "DiastolicBP",
    "BS",
    "BodyTemp",
    "HeartRate",
]

CLASS_LABELS = ["low risk", "mid risk", "high risk"]
CLASS_TO_INDEX = {label: idx for idx, label in enumerate(CLASS_LABELS)}
INDEX_TO_CLASS = {idx: label for label, idx in CLASS_TO_INDEX.items()}

OUTPUT_VARIABLE = {
    "name": "RiskScore",
    "universe": (0.0, 100.0),
    "terms": OrderedDict(
        [
            ("low", [0.0, 0.0, 25.0, 45.0]),
            ("mid", [35.0, 45.0, 55.0, 70.0]),
            ("high", [60.0, 80.0, 100.0, 100.0]),
        ]
    ),
}

# Conservative implementation note:
# - DiastolicBP is clipped to 140 instead of 105 because the fixed base term
#   "severa" is explicitly defined as [108, 110, 140, 140]. Using 105 would make
#   the mandatory base chromosome infeasible.
# - HeartRate includes the extra terms "taquicardia" and
#   "taquicardia_marcada" because the fixed rule base uses them although the
#   initial list only provided three categories. The added terms are nested
#   right-shoulder sets to preserve the original semantics.
VARIABLE_SPECS = OrderedDict(
    [
        (
            "Age",
            {
                "bounds": (10.0, 75.0),
                "epsilon": 0.5,
                "terms": OrderedDict(
                    [
                        ("adolescente", [10.0, 10.0, 17.0, 20.0]),
                        ("adulta", [18.0, 22.0, 34.0, 40.0]),
                        ("avanzada", [35.0, 40.0, 75.0, 75.0]),
                    ]
                ),
            },
        ),
        (
            "SystolicBP",
            {
                "bounds": (65.0, 170.0),
                "epsilon": 1.0,
                "terms": OrderedDict(
                    [
                        ("baja", [65.0, 65.0, 85.0, 95.0]),
                        ("normal", [90.0, 100.0, 120.0, 130.0]),
                        ("limitrofe", [125.0, 130.0, 138.0, 145.0]),
                        ("alta", [140.0, 145.0, 155.0, 165.0]),
                        ("severa", [158.0, 160.0, 170.0, 170.0]),
                    ]
                ),
            },
        ),
        (
            "DiastolicBP",
            {
                "bounds": (45.0, 140.0),
                "epsilon": 1.0,
                "terms": OrderedDict(
                    [
                        ("baja", [45.0, 45.0, 55.0, 60.0]),
                        ("normal", [55.0, 60.0, 75.0, 85.0]),
                        ("limitrofe", [80.0, 84.0, 89.0, 92.0]),
                        ("alta", [90.0, 95.0, 105.0, 112.0]),
                        ("severa", [108.0, 110.0, 140.0, 140.0]),
                    ]
                ),
            },
        ),
        (
            "BS",
            {
                "bounds": (5.5, 20.0),
                "epsilon": 0.1,
                "terms": OrderedDict(
                    [
                        ("normal", [6.5, 7.0, 9.0, 11.0]),
                        ("elevada", [6.5, 7.0, 9.0, 11.0]),
                        ("muy_elevada", [10.0, 12.0, 20.0, 20.0]),
                    ]
                ),
            },
        ),
        (
            "BodyTemp",
            {
                "bounds": (97.0, 104.0),
                "epsilon": 0.1,
                "terms": OrderedDict(
                    [
                        ("normal", [97.0, 97.5, 99.1, 99.6]),
                        ("subfebril_elevada", [99.2, 99.6, 100.2, 100.7]),
                        ("fiebre", [100.4, 100.8, 101.8, 102.4]),
                        ("fiebre_alta", [102.0, 102.4, 104.0, 104.0]),
                    ]
                ),
            },
        ),
        (
            "HeartRate",
            {
                "bounds": (55.0, 100.0),
                "epsilon": 1.0,
                "terms": OrderedDict(
                    [
                        ("baja", [55.0, 55.0, 62.0, 68.0]),
                        ("normal", [64.0, 70.0, 80.0, 86.0]),
                        ("elevada", [82.0, 86.0, 100.0, 100.0]),
                        ("taquicardia", [90.0, 94.0, 100.0, 100.0]),
                        ("taquicardia_marcada", [95.0, 98.0, 100.0, 100.0]),
                    ]
                ),
            },
        ),
    ]
)

GA_SETTINGS = {
    "population_size": 60,
    "offspring_size": 60,
    "max_generations": 200,
    "crossover_probability": 0.85,
    "mutation_probability": 0.03,
    "elitism": 4,
    "tournament_size": 3,
    "patience": 25,
}

FITNESS_WEIGHTS = {
    "macro_f1": 0.6,
    "recall_high": 0.4,
    "interpretability": 0.2,
    "deviation": 0.2,
}

SPLIT_RATIOS = {
    "train": 0.70,
    "validation": 0.15,
    "test": 0.15,
}

OUTPUT_GRID_SIZE = 401
PLOT_GRID_SIZE = 300
