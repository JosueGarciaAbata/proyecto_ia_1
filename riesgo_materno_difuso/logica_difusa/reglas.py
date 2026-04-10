# Reglas del sistema difuso Mamdani para riesgo materno
#
# Cada regla tiene:
#   - antecedentes: lista de (variable, categoria) conectados por AND (minimo)
#   - consecuente: "bajo", "medio" o "alto"
#
# Disenadas a partir de los percentiles del dataset y conocimiento clinico.
# Azucar en sangre (BS) es el predictor mas fuerte de alto riesgo.
# No hay reglas redundantes (ninguna esta subsumida por otra).
# 15 reglas para mantener interpretabilidad.

REGLAS = [
    # --- BAJO RIESGO ---
    {
        "numero": 1,
        "antecedentes": [
            ("azucar_sangre", "normal"),
            ("presion_sistolica", "normal"),
            ("presion_diastolica", "normal"),
        ],
        "consecuente": "bajo",
    },
    {
        "numero": 2,
        "antecedentes": [
            ("azucar_sangre", "normal"),
            ("presion_diastolica", "normal"),
            ("temperatura_corporal", "normal"),
        ],
        "consecuente": "bajo",
    },
    # --- MEDIO RIESGO ---
    # Azucar ligeramente elevada sin otros factores criticos
    {
        "numero": 3,
        "antecedentes": [
            ("azucar_sangre", "elevada"),
            ("presion_diastolica", "normal"),
        ],
        "consecuente": "medio",
    },
    # Presion elevada sin azucar critica
    {
        "numero": 4,
        "antecedentes": [
            ("presion_sistolica", "elevada"),
            ("azucar_sangre", "normal"),
        ],
        "consecuente": "medio",
    },
    {
        "numero": 5,
        "antecedentes": [
            ("presion_diastolica", "elevada"),
            ("azucar_sangre", "normal"),
        ],
        "consecuente": "medio",
    },
    # Edad avanzada con valores normales
    {
        "numero": 6,
        "antecedentes": [
            ("edad", "avanzada"),
            ("azucar_sangre", "normal"),
            ("presion_diastolica", "normal"),
        ],
        "consecuente": "medio",
    },
    # Temperatura elevada (subfebril)
    {
        "numero": 7,
        "antecedentes": [
            ("temperatura_corporal", "elevada"),
        ],
        "consecuente": "medio",
    },
    # --- ALTO RIESGO ---
    # Azucar muy alta: indicador primario por si solo
    {
        "numero": 8,
        "antecedentes": [
            ("azucar_sangre", "alta"),
        ],
        "consecuente": "alto",
    },
    # Combinacion azucar elevada + presion elevada
    {
        "numero": 9,
        "antecedentes": [
            ("azucar_sangre", "elevada"),
            ("presion_diastolica", "elevada"),
        ],
        "consecuente": "alto",
    },
    {
        "numero": 10,
        "antecedentes": [
            ("azucar_sangre", "elevada"),
            ("presion_sistolica", "elevada"),
        ],
        "consecuente": "alto",
    },
    # Combinacion azucar elevada + edad avanzada
    {
        "numero": 11,
        "antecedentes": [
            ("azucar_sangre", "elevada"),
            ("edad", "avanzada"),
        ],
        "consecuente": "alto",
    },
    # Presion diastolica alta: peligro por si sola
    {
        "numero": 12,
        "antecedentes": [
            ("presion_diastolica", "alta"),
        ],
        "consecuente": "alto",
    },
    # Presion sistolica alta: peligro por si sola
    {
        "numero": 13,
        "antecedentes": [
            ("presion_sistolica", "alta"),
        ],
        "consecuente": "alto",
    },
    # Fiebre: riesgo de infeccion/sepsis
    {
        "numero": 14,
        "antecedentes": [
            ("temperatura_corporal", "fiebre"),
        ],
        "consecuente": "alto",
    },
    # Edad avanzada + presion diastolica elevada
    {
        "numero": 15,
        "antecedentes": [
            ("edad", "avanzada"),
            ("presion_diastolica", "elevada"),
        ],
        "consecuente": "alto",
    },
]
