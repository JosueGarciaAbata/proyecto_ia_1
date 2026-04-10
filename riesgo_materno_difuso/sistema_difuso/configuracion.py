from collections import OrderedDict


RUTA_CSV = "Maternal Health Risk Data Set.csv"
COLUMNA_RIESGO_CSV = "RiskLevel"
RUTA_MODELO_OPTIMIZADO = "modelo_optimizado.json"

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

VARIABLES_ENTRADA = list(MAPA_COLUMNAS_CSV.keys())
ETIQUETAS_RIESGO = ["low risk", "mid risk", "high risk"]

SALIDA_DIFUSA = {
    "nombre": "puntaje_riesgo",
    "universo": (0.0, 100.0),
    "categorias": OrderedDict(
        [
            ("bajo", [0.0, 0.0, 25.0, 42.0]),
            ("medio", [35.0, 45.0, 58.0, 70.0]),
            ("alto", [62.0, 75.0, 100.0, 100.0]),
        ]
    ),
}

ESPECIFICACIONES_VARIABLES = OrderedDict(
    [
        (
            "edad",
            {
                "limites": (10.0, 70.0),
                "epsilon": 0.5,
                "tolerancia_saturacion": 2.0,
                "categorias": OrderedDict(
                    [
                        ("joven", [10.0, 10.0, 20.0, 28.0]),
                        ("adulta", [24.0, 28.0, 34.0, 38.0]),
                        ("avanzada", [34.0, 40.0, 70.0, 70.0]),
                    ]
                ),
            },
        ),
        (
            "presion_sistolica",
            {
                "limites": (70.0, 160.0),
                "epsilon": 1.0,
                "tolerancia_saturacion": 5.0,
                "categorias": OrderedDict(
                    [
                        ("normal", [70.0, 70.0, 110.0, 125.0]),
                        ("elevada", [120.0, 128.0, 138.0, 145.0]),
                        ("alta", [140.0, 148.0, 160.0, 160.0]),
                    ]
                ),
            },
        ),
        (
            "presion_diastolica",
            {
                "limites": (49.0, 100.0),
                "epsilon": 1.0,
                "tolerancia_saturacion": 5.0,
                "categorias": OrderedDict(
                    [
                        ("normal", [49.0, 49.0, 70.0, 80.0]),
                        ("elevada", [76.0, 82.0, 90.0, 95.0]),
                        ("alta", [90.0, 95.0, 100.0, 100.0]),
                    ]
                ),
            },
        ),
        (
            "azucar_sangre",
            {
                "limites": (6.0, 19.0),
                "epsilon": 0.1,
                "tolerancia_saturacion": 0.5,
                "categorias": OrderedDict(
                    [
                        ("normal", [6.0, 6.0, 7.5, 8.5]),
                        ("elevada", [8.0, 9.0, 12.0, 14.0]),
                        ("alta", [12.0, 14.0, 19.0, 19.0]),
                    ]
                ),
            },
        ),
        (
            "temperatura_corporal",
            {
                "limites": (97.0, 103.0),
                "epsilon": 0.1,
                "tolerancia_saturacion": 0.5,
                "categorias": OrderedDict(
                    [
                        ("normal", [97.0, 97.0, 98.5, 99.5]),
                        ("elevada", [99.0, 100.0, 101.0, 101.5]),
                        ("fiebre", [101.0, 101.5, 103.0, 103.0]),
                    ]
                ),
            },
        ),
        (
            "frecuencia_cardiaca",
            {
                "limites": (60.0, 90.0),
                "epsilon": 1.0,
                "tolerancia_saturacion": 5.0,
                "categorias": OrderedDict(
                    [
                        ("normal", [60.0, 60.0, 72.0, 80.0]),
                        ("elevada", [76.0, 82.0, 90.0, 90.0]),
                    ]
                ),
            },
        ),
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

PUNTOS_SALIDA = 401
PUNTOS_GRAFICA = 300
