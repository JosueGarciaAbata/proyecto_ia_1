export type RiskTone = "low" | "mid" | "high";

export interface PatientFormData {
  age: string;
  systolicBP: string;
  diastolicBP: string;
  bloodGlucose: string;
  bodyTemperature: string;
  heartRate: string;
  observations: string;
}

export interface RecommendationResult {
  riskLevel: string;
  riskTone: RiskTone;
  riskScore: number;
  confidence: number;
  inferenceStrength: number;
  recommendation: string;
  interpretation: string;
  clinicalFlags: string[];
}

export interface ActivatedRule {
  id: string;
  title: string;
  activation: number;
  tone: RiskTone;
  rationale: string;
  antecedents: string[];
}

export interface MetricComparison {
  label: string;
  base: number;
  optimized: number;
  unit?: string;
}

export interface MembershipCategory {
  name: string;
  color: string;
  base: [number, number, number, number];
  optimized: [number, number, number, number];
}

export interface MembershipVariableProfile {
  label: string;
  domain: [number, number];
  unit: string;
  categories: MembershipCategory[];
}

export interface ArchitectureStep {
  title: string;
  description: string;
}

export const initialPatientForm: PatientFormData = {
  age: "31",
  systolicBP: "146",
  diastolicBP: "94",
  bloodGlucose: "7.8",
  bodyTemperature: "100.1",
  heartRate: "88",
  observations: "Cefalea persistente, edema en extremidades inferiores y fatiga reciente.",
};

export const heroStats = [
  {
    label: "Entradas",
    value: "6 variables clinicas",
    description:
      "Edad, presion sistolica, presion diastolica, glucosa, temperatura corporal y frecuencia cardiaca.",
  },
  {
    label: "Razonamiento",
    value: "Reglas difusas interpretables",
    description:
      "Se muestra la activacion de reglas y las pertenencias linguisticas para facilitar la interpretacion.",
  },
  {
    label: "Optimizacion",
    value: "Algoritmo genetico",
    description:
      "Las funciones de pertenencia de entrada pueden ajustarse mediante busqueda evolutiva de codificacion real.",
  },
  {
    label: "Salida",
    value: "Puntaje de riesgo y recomendacion",
    description:
      "El sistema presenta clasificacion de riesgo, puntaje y apoyo interpretativo para el analisis clinico.",
  },
];

export const mockRecommendation: RecommendationResult = {
  riskLevel: "Riesgo alto",
  riskTone: "high",
  riskScore: 78,
  confidence: 0.91,
  inferenceStrength: 0.86,
  recommendation:
    "Se recomienda priorizar la evaluacion clinica, reforzar el monitoreo materno y revisar el estado hipertensivo y glucemico.",
  interpretation:
    "La inferencia del sistema muestra un perfil compatible con presion arterial elevada, frecuencia cardiaca alta y niveles de glucosa por encima del rango esperado.",
  clinicalFlags: [
    "Presion sistolica elevada",
    "Patron de taquicardia",
    "Glucosa por encima de la region normal",
    "Temperatura en zona subfebril",
  ],
};

export const mockActivatedRules: ActivatedRule[] = [
  {
    id: "R17",
    title: "Edad adulta + presion sistolica alta + diastolica normal",
    activation: 0.86,
    tone: "high",
    rationale:
      "La curva optimizada de presion sistolica activa con fuerza la rama de riesgo alto aun antes de alcanzar hipertension severa.",
    antecedents: [
      "Edad es adulta",
      "Presion sistolica es alta",
      "Presion diastolica es normal",
      "Glucosa es normal",
      "Temperatura es normal",
      "Frecuencia cardiaca es normal",
    ],
  },
  {
    id: "R26",
    title: "Edad adulta + glucosa elevada + temperatura subfebril + taquicardia",
    activation: 0.73,
    tone: "high",
    rationale:
      "La combinacion metabolica y termica refuerza la trayectoria de recomendacion de riesgo alto dentro de la base de reglas.",
    antecedents: [
      "Edad es adulta",
      "Presion sistolica es normal",
      "Presion diastolica es normal",
      "Glucosa es elevada",
      "Temperatura es subfebril",
      "Frecuencia cardiaca es taquicardia",
    ],
  },
  {
    id: "R11",
    title: "Edad adulta + presion normal + glucosa elevada",
    activation: 0.48,
    tone: "mid",
    rationale:
      "Esta regla sigue parcialmente activa y explica por que el sistema conserva una contribucion de riesgo medio en el centroide final.",
    antecedents: [
      "Edad es adulta",
      "Presion sistolica es normal",
      "Presion diastolica es normal",
      "Glucosa es elevada",
      "Temperatura es normal",
      "Frecuencia cardiaca es normal",
    ],
  },
  {
    id: "R30",
    title: "Edad adulta + presion limitrofe + glucosa elevada + frecuencia alta",
    activation: 0.62,
    tone: "high",
    rationale:
      "Las membresias optimizadas aumentan el solapamiento en estados cardiovasculares limitrofes y refuerzan la tendencia a riesgo alto.",
    antecedents: [
      "Edad es adulta",
      "Presion sistolica es limitrofe",
      "Presion diastolica es limitrofe",
      "Glucosa es elevada",
      "Temperatura es subfebril",
      "Frecuencia cardiaca es elevada",
    ],
  },
];

export const metricComparison: MetricComparison[] = [
  { label: "Macro F1", base: 0.31, optimized: 0.52 },
  { label: "Recall riesgo alto", base: 0.22, optimized: 0.71 },
  { label: "Exactitud balanceada", base: 0.43, optimized: 0.67 },
  { label: "Penalizacion interpretabilidad", base: 0.06, optimized: 0.02 },
  { label: "Penalizacion desviacion", base: 0.0, optimized: 0.11 },
];

export const fitnessHistory = Array.from({ length: 36 }, (_, index) => {
  const generation = index;
  const bestFitness = 0.32 + generation * 0.009 + Math.sin(generation / 2.5) * 0.01;
  const averageFitness =
    0.25 + generation * 0.007 + Math.cos(generation / 3.2) * 0.006;

  return {
    generation,
    bestFitness: Number(bestFitness.toFixed(3)),
    averageFitness: Number(averageFitness.toFixed(3)),
  };
});

export const optimizationSummary = [
  {
    label: "Mejor fitness",
    value: "0.641",
    detail: "Valor obtenido en validacion despues de la busqueda evolutiva restringida.",
  },
  {
    label: "Convergencia",
    value: "Generacion 31",
    detail: "No se observaron mejoras importantes despues de la ultima meseta elitista.",
  },
  {
    label: "Mejor cromosoma",
    value: "104 genes",
    detail: "Parametros trapezoidales codificados para todas las membresias de entrada.",
  },
  {
    label: "Mejora relativa",
    value: "+49%",
    detail: "Incremento relativo del recall de riesgo alto frente a la configuracion base.",
  },
];

export const mockChromosomePreview = [
  "Edad.adulta = [18.4, 22.3, 31.7, 35.1]",
  "PresionSistolica.alta = [138.5, 144.0, 156.7, 167.2]",
  "PresionDiastolica.alta = [89.5, 94.1, 106.3, 113.4]",
  "Glucosa.elevada = [5.0, 5.2, 6.2, 7.3]",
  "Temperatura.subfebril = [99.1, 99.5, 100.1, 100.8]",
  "FrecuenciaCardiaca.taquicardia = [108.0, 116.3, 134.6, 145.0]",
];

export const membershipProfiles: Record<string, MembershipVariableProfile> = {
  Edad: {
    label: "Edad",
    domain: [10, 50],
    unit: "anos",
    categories: [
      {
        name: "Adolescente",
        color: "#5eead4",
        base: [10, 10, 17, 20],
        optimized: [10, 10, 16, 18.5],
      },
      {
        name: "Adulta",
        color: "#60a5fa",
        base: [18, 22, 32, 35],
        optimized: [18.5, 22.5, 31.7, 35.4],
      },
      {
        name: "Avanzada",
        color: "#c084fc",
        base: [33, 35, 50, 50],
        optimized: [32.5, 35.6, 50, 50],
      },
    ],
  },
  "Presion sistolica": {
    label: "Presion sistolica",
    domain: [80, 200],
    unit: "mmHg",
    categories: [
      { name: "Baja", color: "#22d3ee", base: [80, 80, 90, 100], optimized: [80, 80, 92, 101] },
      {
        name: "Normal",
        color: "#38bdf8",
        base: [95, 105, 120, 130],
        optimized: [94, 104, 121, 131],
      },
      {
        name: "Limitrofe",
        color: "#818cf8",
        base: [125, 130, 138, 145],
        optimized: [124, 130, 140, 147],
      },
      {
        name: "Alta",
        color: "#fb7185",
        base: [140, 145, 155, 165],
        optimized: [138.5, 144, 156.7, 167.2],
      },
      {
        name: "Severa",
        color: "#f97316",
        base: [158, 160, 200, 200],
        optimized: [156, 160, 200, 200],
      },
    ],
  },
  "Presion diastolica": {
    label: "Presion diastolica",
    domain: [40, 140],
    unit: "mmHg",
    categories: [
      { name: "Baja", color: "#22d3ee", base: [40, 40, 50, 60], optimized: [40, 40, 52, 61] },
      {
        name: "Normal",
        color: "#38bdf8",
        base: [55, 60, 75, 85],
        optimized: [54.5, 60, 76, 85.5],
      },
      {
        name: "Limitrofe",
        color: "#818cf8",
        base: [80, 84, 89, 92],
        optimized: [79.5, 83.5, 90, 93],
      },
      {
        name: "Alta",
        color: "#fb7185",
        base: [90, 95, 105, 112],
        optimized: [89.5, 94.1, 106.3, 113.4],
      },
      {
        name: "Severa",
        color: "#f97316",
        base: [108, 110, 140, 140],
        optimized: [107, 110.5, 140, 140],
      },
    ],
  },
  Glucosa: {
    label: "Glucosa / BS",
    domain: [2.5, 11],
    unit: "mmol/L",
    categories: [
      { name: "Baja", color: "#22d3ee", base: [2.5, 2.5, 3.3, 3.8], optimized: [2.5, 2.5, 3.2, 3.9] },
      {
        name: "Normal",
        color: "#38bdf8",
        base: [3.5, 4.0, 4.8, 5.1],
        optimized: [3.5, 4.1, 4.9, 5.2],
      },
      {
        name: "Elevada",
        color: "#818cf8",
        base: [4.9, 5.1, 6.0, 7.0],
        optimized: [4.8, 5.1, 6.2, 7.3],
      },
      {
        name: "Muy elevada",
        color: "#fb7185",
        base: [6.8, 7.0, 11.0, 11.0],
        optimized: [6.7, 7.0, 11.0, 11.0],
      },
    ],
  },
  Temperatura: {
    label: "Temperatura corporal",
    domain: [96, 104.5],
    unit: "F",
    categories: [
      {
        name: "Normal",
        color: "#22d3ee",
        base: [96.0, 96.8, 99.1, 99.5],
        optimized: [96.0, 96.7, 99.0, 99.4],
      },
      {
        name: "Subfebril",
        color: "#38bdf8",
        base: [99.0, 99.5, 100.2, 100.6],
        optimized: [98.9, 99.4, 100.3, 100.8],
      },
      {
        name: "Fiebre",
        color: "#fb7185",
        base: [100.4, 100.8, 101.8, 102.4],
        optimized: [100.3, 100.8, 101.9, 102.5],
      },
      {
        name: "Fiebre alta",
        color: "#f97316",
        base: [102.2, 102.5, 104.5, 104.5],
        optimized: [102.0, 102.4, 104.5, 104.5],
      },
    ],
  },
  "Frecuencia cardiaca": {
    label: "Frecuencia cardiaca",
    domain: [45, 180],
    unit: "bpm",
    categories: [
      { name: "Baja", color: "#22d3ee", base: [45, 45, 55, 60], optimized: [45, 45, 56, 61] },
      {
        name: "Normal",
        color: "#38bdf8",
        base: [60, 68, 95, 100],
        optimized: [60, 69, 96, 101],
      },
      {
        name: "Elevada",
        color: "#818cf8",
        base: [95, 100, 109, 115],
        optimized: [94, 99, 110, 117],
      },
      {
        name: "Taquicardia",
        color: "#fb7185",
        base: [110, 118, 135, 145],
        optimized: [108, 116.3, 134.6, 145],
      },
      {
        name: "Taquicardia marcada",
        color: "#f97316",
        base: [140, 145, 180, 180],
        optimized: [138, 144, 180, 180],
      },
    ],
  },
};

export const architectureSteps: ArchitectureStep[] = [
  {
    title: "Entradas del paciente",
    description:
      "Se registran signos vitales, estado glucemico, edad y observaciones clinicas en el formulario.",
  },
  {
    title: "Fusificacion",
    description:
      "Cada valor numerico se proyecta sobre categorias linguisticas con grados de pertenencia interpretables.",
  },
  {
    title: "Base de reglas",
    description:
      "Las reglas Mamdani fijas codifican el conocimiento del dominio sin alterar la logica clinica definida.",
  },
  {
    title: "Inferencia",
    description:
      "Las reglas activadas se agregan para construir la salida difusa del caso actual.",
  },
  {
    title: "Desfusificacion",
    description:
      "La operacion por centroide transforma la region difusa agregada en un puntaje de riesgo concreto.",
  },
  {
    title: "Optimizacion genetica",
    description:
      "El algoritmo genetico ajusta las membresias de entrada para mejorar el desempeno sin perder interpretabilidad.",
  },
];

export const patientDistribution = [
  { cohort: "18-24", low: 24, mid: 16, high: 8 },
  { cohort: "25-31", low: 31, mid: 20, high: 15 },
  { cohort: "32-38", low: 18, mid: 24, high: 19 },
  { cohort: "39-45", low: 11, mid: 18, high: 21 },
];

export const riskFrequency = [
  { name: "Riesgo bajo", value: 38 },
  { name: "Riesgo medio", value: 34 },
  { name: "Riesgo alto", value: 28 },
];

export const riskTrend = [
  { day: "Lun", riskScore: 58 },
  { day: "Mar", riskScore: 61 },
  { day: "Mie", riskScore: 64 },
  { day: "Jue", riskScore: 70 },
  { day: "Vie", riskScore: 68 },
  { day: "Sab", riskScore: 73 },
  { day: "Dom", riskScore: 76 },
];

export const variableInfluence = [
  { variable: "Edad", value: 0.49 },
  { variable: "Presion sistolica", value: 0.89 },
  { variable: "Presion diastolica", value: 0.78 },
  { variable: "Glucosa", value: 0.74 },
  { variable: "Temperatura", value: 0.56 },
  { variable: "Frecuencia cardiaca", value: 0.84 },
];

export const inputComparison = [
  { variable: "Edad", patient: 31, baseline: 28, optimized: 30 },
  { variable: "Presion sistolica", patient: 146, baseline: 132, optimized: 141 },
  { variable: "Presion diastolica", patient: 94, baseline: 84, optimized: 91 },
  { variable: "Glucosa", patient: 7.8, baseline: 5.4, optimized: 6.6 },
  { variable: "Temperatura", patient: 100.1, baseline: 98.8, optimized: 99.6 },
  { variable: "Frecuencia cardiaca", patient: 118, baseline: 88, optimized: 106 },
];
