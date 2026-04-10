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
            ("bajo", [0.0, 0.0, 25.0, 45.0]),
            ("medio", [35.0, 45.0, 55.0, 70.0]),
            ("alto", [60.0, 80.0, 100.0, 100.0]),
        ]
    ),
}

# Nota conservadora:
# - presion_diastolica usa limite superior 140 porque la categoria fija
#   "severa" fue definida asi en la especificacion base.
# - frecuencia_cardiaca incluye "taquicardia" y "taquicardia_marcada"
#   porque las reglas fijas las usan explicitamente.
ESPECIFICACIONES_VARIABLES = OrderedDict(
    [
        (
            "edad",
            {
                "limites": (10.0, 75.0),
                "epsilon": 0.5,
                "tolerancia_saturacion": 2.0,
                "categorias": OrderedDict(
                    [
                        ("adolescente", [10.0, 10.0, 17.0, 20.0]),
                        ("adulta", [18.0, 22.0, 34.0, 40.0]),
                        ("avanzada", [35.0, 40.0, 75.0, 75.0]),
                    ]
                ),
            },
        ),
        (
            "presion_sistolica",
            {
                "limites": (65.0, 170.0),
                "epsilon": 1.0,
                "tolerancia_saturacion": 5.0,
                "categorias": OrderedDict(
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
            "presion_diastolica",
            {
                "limites": (45.0, 105.0),
                "epsilon": 1.0,
                "tolerancia_saturacion": 5.0,
                "categorias": OrderedDict(
                    [
                        ("baja", [45.0, 45.0, 55.0, 60.0]),
                        ("normal", [55.0, 60.0, 75.0, 85.0]),
                        ("limitrofe", [80.0, 84.0, 89.0, 92.0]),
                        ("alta", [90.0, 95.0, 105.0, 105.0]),
                    ]
                ),
            },
        ),
        (
            "azucar_sangre",
            {
                "limites": (5.5, 20.0),
                "epsilon": 0.1,
                "tolerancia_saturacion": 0.5,
                "categorias": OrderedDict(
                    [
                        ("normal", [5.5, 5.5, 6.3, 7.0]),
                        ("elevada", [6.5, 7.0, 9.0, 11.0]),
                        ("muy_elevada", [10.0, 12.0, 20.0, 20.0]),
                    ]
                ),
            },
        ),
        (
            "temperatura_corporal",
            {
                "limites": (97.0, 104.0),
                "epsilon": 0.1,
                "tolerancia_saturacion": 0.5,
                "categorias": OrderedDict(
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
            "frecuencia_cardiaca",
            {
                "limites": (55.0, 100.0),
                "epsilon": 1.0,
                "tolerancia_saturacion": 5.0,
                "categorias": OrderedDict(
                    [
                        ("baja", [55.0, 55.0, 62.0, 68.0]),
                        ("normal", [64.0, 70.0, 80.0, 86.0]),
                        ("elevada", [82.0, 86.0, 100.0, 100.0]),
                    ]
                ),
            },
        ),
    ]
)

PARAMETROS_AG = {
    "tamano_poblacion": 60,
    "cantidad_hijos": 60,
    "maximo_generaciones": 50,
    "probabilidad_cruce": 0.85,
    "probabilidad_mutacion": 0.03,
    "elitismo": 4,
    "tamano_torneo": 3,
    "paciencia": 25,
}

PESOS_FITNESS = {
    "macro_f1": 0.6,
    "recall_alto": 0.4,
    "interpretabilidad": 0.2,
    "desviacion": 0.2,
}

PROPORCIONES_SPLIT = {
    "entrenamiento": 0.70,
    "validacion": 0.15,
    "prueba": 0.15,
}

PUNTOS_SALIDA = 401
PUNTOS_GRAFICA = 300
