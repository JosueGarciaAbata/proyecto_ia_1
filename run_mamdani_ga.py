import json
from pathlib import Path

import pandas as pd

from maternal_risk_fuzzy.chromosome import (
    RAW_BASE_INPUT_MEMBERSHIPS,
    decode_chromosome,
    memberships_to_table,
)
from maternal_risk_fuzzy.config import DATASET_PATH, GA_SETTINGS, VARIABLE_SPECS
from maternal_risk_fuzzy.data import (
    load_dataset,
    split_to_numpy,
    stratified_train_validation_test_split,
    summarize_split_sizes,
)
from maternal_risk_fuzzy.evaluation import (
    comparative_metrics_table,
    evaluate_memberships_on_splits,
)
from maternal_risk_fuzzy.ga import run_genetic_algorithm
from maternal_risk_fuzzy.visualization import (
    save_fitness_curve_svg,
    save_membership_comparison_svg,
)


def print_membership_system(title, memberships):
    print(title)
    print("-" * 90)
    for variable, terms in memberships.items():
        print(variable)
        for term, params in terms.items():
            formatted = ", ".join(f"{value:.4f}" for value in params)
            print(f"  {term:<22} [{formatted}]")
        print()


def build_membership_comparison_table(initial_memberships, optimized_memberships):
    rows = []
    for variable in initial_memberships.keys():
        for term in initial_memberships[variable].keys():
            initial = initial_memberships[variable][term]
            optimized = optimized_memberships[variable][term]
            rows.append(
                {
                    "variable": variable,
                    "term": term,
                    "initial_a": float(initial[0]),
                    "initial_b": float(initial[1]),
                    "initial_c": float(initial[2]),
                    "initial_d": float(initial[3]),
                    "optimized_a": float(optimized[0]),
                    "optimized_b": float(optimized[1]),
                    "optimized_c": float(optimized[2]),
                    "optimized_d": float(optimized[3]),
                }
            )
    return pd.DataFrame(rows)


def save_confusion_matrix(matrix, labels, output_path):
    df = pd.DataFrame(matrix, index=labels, columns=labels)
    df.to_csv(output_path)


def write_report(
    output_path,
    split_summary,
    base_results,
    optimized_results,
    comparative_table,
    history_df,
    best_chromosome,
):
    lines = []
    lines.append("# Arquitectura")
    lines.append(
        "La solucion separa carga de datos, motor Mamdani, reglas fijas, cromosoma real,"
    )
    lines.append("reparacion, penalizaciones, GA, evaluacion y visualizacion SVG.")
    lines.append("")
    lines.append("# Pseudocodigo de alto nivel")
    lines.append("1. Cargar el CSV y dividirlo en train, validation y test de forma estratificada.")
    lines.append("2. Construir el sistema base con funciones trapezoidales y reglas fijas.")
    lines.append("3. Codificar en un cromosoma todos los parametros de entrada.")
    lines.append("4. Inicializar la poblacion con base, perturbados y aleatorios factibles.")
    lines.append("5. Reparar, inferir, defuzzificar y evaluar cada individuo sobre validation.")
    lines.append("6. Calcular fitness con MacroF1, Recall high, interpretabilidad y desviacion.")
    lines.append("7. Repetir torneo, cruce, mutacion, reparacion y seleccion (mu + lambda).")
    lines.append("8. Detener por maximo de generaciones o por falta de mejora.")
    lines.append("9. Evaluar una sola vez el mejor sistema sobre test y compararlo con el base.")
    lines.append("")
    lines.append("# Validaciones")
    lines.append("- Se validan columnas, clases y ausencia de valores faltantes.")
    lines.append("- Toda inicializacion, cruce y mutacion pasa por reparacion.")
    lines.append("- Si aparece un individuo invalido o una salida NaN, su fitness es -1000.")
    lines.append("")
    lines.append("# Tamano de splits")
    lines.append(split_summary.to_string(index=False))
    lines.append("")
    lines.append("# Tabla comparativa base vs optimizado")
    lines.append(comparative_table.to_string(index=False))
    lines.append("")
    lines.append("# Mejor cromosoma")
    lines.append(json.dumps(best_chromosome, indent=2))
    lines.append("")
    lines.append("# Fitness por generacion")
    lines.append(history_df.to_string(index=False))
    lines.append("")
    lines.append("# Resultados test base")
    lines.append(
        f"MacroF1={base_results['test']['macro_f1']:.4f}, "
        f"Recall_high={base_results['test']['recall_high']:.4f}, "
        f"BalancedAccuracy={base_results['test']['balanced_accuracy']:.4f}"
    )
    lines.append("")
    lines.append("# Resultados test optimizado")
    lines.append(
        f"MacroF1={optimized_results['test']['macro_f1']:.4f}, "
        f"Recall_high={optimized_results['test']['recall_high']:.4f}, "
        f"BalancedAccuracy={optimized_results['test']['balanced_accuracy']:.4f}"
    )
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main():
    output_dir = Path("outputs")
    output_dir.mkdir(exist_ok=True)

    dataset = load_dataset(DATASET_PATH)
    splits = stratified_train_validation_test_split(dataset)
    split_summary = summarize_split_sizes(splits)
    split_summary.to_csv(output_dir / "split_summary.csv", index=False)
    split_arrays = {name: split_to_numpy(split_df) for name, split_df in splits.items()}

    base_memberships = RAW_BASE_INPUT_MEMBERSHIPS
    base_results = evaluate_memberships_on_splits(base_memberships, split_arrays)
    print_membership_system("Sistema base", base_memberships)

    best_candidate, history_df = run_genetic_algorithm(split_arrays["validation"])
    optimized_memberships = decode_chromosome(best_candidate.chromosome)
    optimized_results = evaluate_memberships_on_splits(optimized_memberships, split_arrays)
    print_membership_system("Mejor sistema optimizado", optimized_memberships)

    comparative_table = comparative_metrics_table(base_results, optimized_results)
    membership_table = build_membership_comparison_table(
        base_memberships,
        optimized_memberships,
    )

    history_df.to_csv(output_dir / "fitness_history.csv", index=False)
    comparative_table.to_csv(output_dir / "metrics_comparison.csv", index=False)
    membership_table.to_csv(output_dir / "membership_comparison.csv", index=False)
    pd.DataFrame(memberships_to_table(base_memberships)).to_csv(
        output_dir / "base_memberships.csv",
        index=False,
    )
    pd.DataFrame(memberships_to_table(optimized_memberships)).to_csv(
        output_dir / "optimized_memberships.csv",
        index=False,
    )

    save_fitness_curve_svg(history_df, output_dir / "fitness_curve.svg")
    for variable, spec in VARIABLE_SPECS.items():
        save_membership_comparison_svg(
            variable=variable,
            initial_terms=base_memberships[variable],
            optimized_terms=optimized_memberships[variable],
            bounds=spec["bounds"],
            output_path=output_dir / f"{variable.lower()}_memberships.svg",
        )

    labels = ["low risk", "mid risk", "high risk"]
    save_confusion_matrix(
        base_results["test"]["confusion_matrix"],
        labels,
        output_dir / "base_test_confusion_matrix.csv",
    )
    save_confusion_matrix(
        optimized_results["test"]["confusion_matrix"],
        labels,
        output_dir / "optimized_test_confusion_matrix.csv",
    )
    base_results["test"]["classification_report"].to_csv(
        output_dir / "base_test_classification_report.csv",
        index=False,
    )
    optimized_results["test"]["classification_report"].to_csv(
        output_dir / "optimized_test_classification_report.csv",
        index=False,
    )

    best_chromosome_values = [float(value) for value in best_candidate.chromosome.tolist()]
    (output_dir / "best_chromosome.json").write_text(
        json.dumps(best_chromosome_values, indent=2),
        encoding="utf-8",
    )

    membership_shift = membership_table.copy()
    membership_shift["delta_center"] = (
        ((membership_shift["optimized_b"] + membership_shift["optimized_c"]) / 2.0)
        - ((membership_shift["initial_b"] + membership_shift["initial_c"]) / 2.0)
    )
    membership_shift["delta_support_width"] = (
        (membership_shift["optimized_d"] - membership_shift["optimized_a"])
        - (membership_shift["initial_d"] - membership_shift["initial_a"])
    )
    membership_shift.to_csv(output_dir / "membership_shift_summary.csv", index=False)

    write_report(
        output_path=output_dir / "report.txt",
        split_summary=split_summary,
        base_results=base_results,
        optimized_results=optimized_results,
        comparative_table=comparative_table,
        history_df=history_df,
        best_chromosome=best_chromosome_values,
    )

    print("Resumen de metricas")
    print("-" * 90)
    print(comparative_table.to_string(index=False))
    print()
    print(f"Mejor fitness final: {best_candidate.fitness:.4f}")
    print(f"MacroF1 validation final: {best_candidate.macro_f1_val:.4f}")
    print(f"Recall high validation final: {best_candidate.recall_high_val:.4f}")
    print(f"Balanced accuracy test base: {base_results['test']['balanced_accuracy']:.4f}")
    print(
        f"Balanced accuracy test optimizado: "
        f"{optimized_results['test']['balanced_accuracy']:.4f}"
    )
    print()
    print(f"Artefactos guardados en: {output_dir.resolve()}")
    print("Configuracion AG")
    print("-" * 90)
    print(json.dumps(GA_SETTINGS, indent=2))


if __name__ == "__main__":
    main()
