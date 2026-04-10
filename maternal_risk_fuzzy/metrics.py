import numpy as np
import pandas as pd

from .config import CLASS_LABELS


def confusion_matrix(y_true, y_pred, labels=None):
    labels = labels or CLASS_LABELS
    label_to_index = {label: idx for idx, label in enumerate(labels)}
    matrix = np.zeros((len(labels), len(labels)), dtype=int)

    for true_label, pred_label in zip(y_true, y_pred):
        matrix[label_to_index[true_label], label_to_index[pred_label]] += 1

    return matrix


def per_class_metrics(y_true, y_pred, labels=None):
    labels = labels or CLASS_LABELS
    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    rows = []

    for idx, label in enumerate(labels):
        tp = matrix[idx, idx]
        fp = matrix[:, idx].sum() - tp
        fn = matrix[idx, :].sum() - tp
        support = matrix[idx, :].sum()

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1_score = (
            2.0 * precision * recall / (precision + recall)
            if (precision + recall) > 0
            else 0.0
        )

        rows.append(
            {
                "label": label,
                "precision": precision,
                "recall": recall,
                "f1-score": f1_score,
                "support": int(support),
            }
        )

    return pd.DataFrame(rows)


def macro_f1(y_true, y_pred, labels=None):
    report = per_class_metrics(y_true, y_pred, labels=labels)
    return float(report["f1-score"].mean())


def recall_for_label(y_true, y_pred, target_label):
    report = per_class_metrics(y_true, y_pred)
    row = report.loc[report["label"] == target_label]
    if row.empty:
        return 0.0
    return float(row["recall"].iloc[0])


def balanced_accuracy(y_true, y_pred, labels=None):
    report = per_class_metrics(y_true, y_pred, labels=labels)
    return float(report["recall"].mean())


def classification_report_table(y_true, y_pred, labels=None):
    labels = labels or CLASS_LABELS
    report = per_class_metrics(y_true, y_pred, labels=labels)
    accuracy = float(np.mean(np.asarray(y_true) == np.asarray(y_pred)))

    macro_row = {
        "label": "macro avg",
        "precision": float(report["precision"].mean()),
        "recall": float(report["recall"].mean()),
        "f1-score": float(report["f1-score"].mean()),
        "support": int(report["support"].sum()),
    }
    weighted_precision = np.average(report["precision"], weights=report["support"])
    weighted_recall = np.average(report["recall"], weights=report["support"])
    weighted_f1 = np.average(report["f1-score"], weights=report["support"])
    weighted_row = {
        "label": "weighted avg",
        "precision": float(weighted_precision),
        "recall": float(weighted_recall),
        "f1-score": float(weighted_f1),
        "support": int(report["support"].sum()),
    }
    accuracy_row = {
        "label": "accuracy",
        "precision": accuracy,
        "recall": accuracy,
        "f1-score": accuracy,
        "support": int(report["support"].sum()),
    }

    return pd.concat(
        [report, pd.DataFrame([accuracy_row, macro_row, weighted_row])],
        ignore_index=True,
    )


def evaluation_summary(y_true, y_pred):
    matrix = confusion_matrix(y_true, y_pred)
    report = classification_report_table(y_true, y_pred)
    return {
        "macro_f1": macro_f1(y_true, y_pred),
        "recall_high": recall_for_label(y_true, y_pred, "high risk"),
        "balanced_accuracy": balanced_accuracy(y_true, y_pred),
        "confusion_matrix": matrix,
        "classification_report": report,
    }
