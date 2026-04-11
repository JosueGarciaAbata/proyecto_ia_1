from pydantic import BaseModel


class PrediccionRequest(BaseModel):
    edad: float
    presion_sistolica: float
    presion_diastolica: float
    azucar_sangre: float
    temperatura_corporal: float
    frecuencia_cardiaca: float


class AjusteEntradaResponse(BaseModel):
    variable: str
    valor_original: float
    valor_ajustado: float


class PrediccionResponse(BaseModel):
    puntaje: float
    riesgo: str
    sistema: str
    origen_modelo: str
    ajustes_entrada: list[AjusteEntradaResponse]


class AntecedentExplicacion(BaseModel):
    variable: str
    categoria: str
    # Del paciente.
    pertenencia: float


class ReglaActivada(BaseModel):
    numero: int
    antecedentes: list[AntecedentExplicacion]
    # resultado del AND (el mínimo de todas las pertenencias de los antecedentes)
    fuerza: float

    # hacia qué nivel de riesgo apunta esta regla: bajo, medio o alto
    consecuente: str


class ExplicacionResponse(BaseModel):

    # Para cada variable, cuanto pertenece el valor del paciente a cada categoria: { "edad": { "joven": 0.8, "adulta": 0.2 }, "presion_sistolica": { ... } }
    pertenencias: dict[str, dict[str, float]]
    reglas_activadas: list[ReglaActivada]

    # FFuerza final de cada nivel de riesgo tras acumular todas las reglas con OR: { "bajo": 0.05, "medio": 0.20, "alto": 0.70 }
    activaciones: dict[str, float]

    # Número entre 0 y 100 resultado de la desfusificación (centroide).
    puntaje: float
    riesgo: str
    origen_modelo: str
    ajustes_entrada: list[AjusteEntradaResponse]


class CurvaMembresia(BaseModel):
    puntos_x: list[float]
    puntos_y: list[float]

class MembresiasResponse(BaseModel):
    variables: dict[str, dict[str, CurvaMembresia]]
    origen_modelo: str
