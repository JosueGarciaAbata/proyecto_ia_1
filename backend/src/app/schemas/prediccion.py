from pydantic import BaseModel


# ── Prediccion ────────────────────────────────────────────────────────────────

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
    pertenencia: float


class ReglaActivada(BaseModel):
    numero: int
    antecedentes: list[AntecedentExplicacion]
    fuerza: float
    consecuente: str


class ExplicacionResponse(BaseModel):
    entrada_validada: dict[str, float]
    pertenencias: dict[str, dict[str, float]]
    reglas_activadas: list[ReglaActivada]
    activaciones: dict[str, float]
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


# ── Algoritmo genetico ────────────────────────────────────────────────────────

class GeneracionHistorial(BaseModel):
    generacion: int
    mejor_fitness: float
    fitness_promedio: float
    macro_f1_validacion: float
    recall_alto_validacion: float


class GAHistorialResponse(BaseModel):
    disponible: bool
    historial_generaciones: list[GeneracionHistorial]
    mejor_fitness: float
    generaciones: int
    macro_f1_validacion: float
    recall_alto_validacion: float


class ComparacionRow(BaseModel):
    metrica: str
    base: float
    optimizado: float
    delta: float


class GAComparacionResponse(BaseModel):
    disponible: bool
    tabla_comparativa: list[ComparacionRow]
    mejor_cromosoma: list[float]
    membresias_decodificadas: dict[str, dict[str, list[float]]]


class ReentrenarRequest(BaseModel):
    tamano_poblacion: int = 50
    maximo_generaciones: int = 60
    paciencia: int = 20


class ReentrenarResponse(BaseModel):
    exito: bool
    fitness: float
    generaciones: int
    macro_f1_validacion: float
    recall_alto_validacion: float


# ── Logica difusa ─────────────────────────────────────────────────────────────

class CategoriaDefinicion(BaseModel):
    puntos_base: list[float]
    puntos_optimizados: list[float]


class VariableDefinicion(BaseModel):
    limites: list[float]
    epsilon: float
    categorias: dict[str, CategoriaDefinicion]


class SalidaDifusa(BaseModel):
    nombre: str
    universo: list[float]
    categorias: dict[str, list[float]]


class FuzzyDefinicionesResponse(BaseModel):
    variables: dict[str, VariableDefinicion]
    salida: SalidaDifusa
    origen_modelo: str


class AntecedentRegla(BaseModel):
    variable: str
    categoria: str


class ReglaSchema(BaseModel):
    numero: int
    antecedentes: list[AntecedentRegla]
    consecuente: str


class FuzzyReglasResponse(BaseModel):
    reglas: list[ReglaSchema]
    total: int
