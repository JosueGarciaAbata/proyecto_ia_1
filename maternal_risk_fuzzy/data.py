import numpy as np
import pandas as pd

from .config import CLASS_LABELS, INPUT_COLUMNS, SPLIT_RATIOS, TARGET_COLUMN


def load_dataset(csv_path):
    df = pd.read_csv(csv_path)
    expected_columns = INPUT_COLUMNS + [TARGET_COLUMN]
    missing = [column for column in expected_columns if column not in df.columns]
    if missing:
        raise ValueError(f"El dataset no contiene las columnas requeridas: {missing}")

    data = df[expected_columns].copy()
    for column in INPUT_COLUMNS:
        data[column] = pd.to_numeric(data[column], errors="coerce")

    data[TARGET_COLUMN] = data[TARGET_COLUMN].astype(str).str.strip().str.lower()
    unknown_labels = sorted(set(data[TARGET_COLUMN].unique()) - set(CLASS_LABELS))
    if unknown_labels:
        raise ValueError(f"Clases no reconocidas en {TARGET_COLUMN}: {unknown_labels}")

    if data[INPUT_COLUMNS].isna().any().any():
        raise ValueError("El dataset contiene valores faltantes o no numericos.")

    return data


def stratified_train_validation_test_split(df):
    train_ratio = SPLIT_RATIOS["train"]
    validation_ratio = SPLIT_RATIOS["validation"]
    test_ratio = SPLIT_RATIOS["test"]
    if not np.isclose(train_ratio + validation_ratio + test_ratio, 1.0):
        raise ValueError("Las proporciones train/validation/test deben sumar 1.")

    split_indices = {"train": [], "validation": [], "test": []}

    for label in CLASS_LABELS:
        label_indices = df.index[df[TARGET_COLUMN] == label].to_numpy()
        shuffled = np.random.permutation(label_indices)
        total = len(shuffled)

        n_train = int(np.floor(total * train_ratio))
        n_validation = int(np.floor(total * validation_ratio))
        n_test = total - n_train - n_validation

        split_indices["train"].extend(shuffled[:n_train].tolist())
        split_indices["validation"].extend(
            shuffled[n_train : n_train + n_validation].tolist()
        )
        split_indices["test"].extend(shuffled[n_train + n_validation :].tolist())

    splits = {}
    for split_name, indices in split_indices.items():
        shuffled_indices = np.random.permutation(np.array(indices))
        splits[split_name] = df.loc[shuffled_indices].reset_index(drop=True)

    return splits


def split_to_numpy(split_df):
    return {
        "X": {column: split_df[column].to_numpy(dtype=float) for column in INPUT_COLUMNS},
        "y": split_df[TARGET_COLUMN].to_numpy(dtype=object),
    }


def summarize_split_sizes(splits):
    rows = []
    for split_name, split_df in splits.items():
        counts = split_df[TARGET_COLUMN].value_counts().reindex(CLASS_LABELS, fill_value=0)
        row = {
            "split": split_name,
            "size": len(split_df),
            "low risk": int(counts["low risk"]),
            "mid risk": int(counts["mid risk"]),
            "high risk": int(counts["high risk"]),
        }
        rows.append(row)
    return pd.DataFrame(rows)

