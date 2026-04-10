from collections import OrderedDict
from pathlib import Path


RUTA_PAQUETE = Path(__file__).resolve().parents[1]
RUTA_CSV = RUTA_PAQUETE / "datos" / "Maternal Health Risk Data Set.csv"
COLUMNA_RIESGO_CSV = "RiskLevel"
RUTA_MODELO_OPTIMIZADO = RUTA_PAQUETE / "modelos" / "modelo_optimizado.json"

MAPA_COLUMNAS_CSV = OrderedDict(
    [
        ("edad", "Age"),
        ("presion_sistolica", "SystolicBP"),
        ("presion_diastolica", "DiastolicBP"),
        ("azucar_sangre", "BS"),
        ("temperatura_corporal", "BodyTemp"),
        ("frecuencia_cardiaca", "HeartRate"),
    ]
)

PARAMETROS_AG = {
    "tamano_poblacion": 50,
    "cantidad_hijos": 50,
    "maximo_generaciones": 60,
    "probabilidad_cruce": 0.85,
    "probabilidad_mutacion": 0.04,
    "elitismo": 3,
    "tamano_torneo": 3,
    "paciencia": 20,
}

PESOS_FITNESS = {
    "macro_f1": 0.65,
    "recall_alto": 0.35,
    "interpretabilidad": 0.15,
    "desviacion": 0.10,
}

PROPORCIONES_SPLIT = {
    "entrenamiento": 0.70,
    "validacion": 0.15,
    "prueba": 0.15,
}
