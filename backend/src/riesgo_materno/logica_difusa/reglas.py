# Reglas del sistema difuso Mamdani para riesgo materno.
#
# Carga las reglas aprendidas por RIPPER desde reglas_aprendidas.json.
# Si no existe, usa las reglas manuales desde reglas_manuales.json.
# Para regenerar las reglas: python -m src.riesgo_materno.entrenamiento.ripper

import json

from ..entrenamiento.modelo import RUTA_REGLAS_APRENDIDAS, RUTA_REGLAS_MANUALES


def _leer_json(ruta):
    """Lee un JSON de reglas y convierte antecedentes a tuplas."""
    contenido = json.loads(ruta.read_text(encoding="utf-8"))
    for r in contenido:
        r["antecedentes"] = [tuple(ant) for ant in r["antecedentes"]]
    return contenido


def _cargar_reglas():
    if RUTA_REGLAS_APRENDIDAS.exists():
        return _leer_json(RUTA_REGLAS_APRENDIDAS)
    return _leer_json(RUTA_REGLAS_MANUALES)


# REGLAS es lo que consume el resto del sistema (motor.py, service.py).
REGLAS = _cargar_reglas()
