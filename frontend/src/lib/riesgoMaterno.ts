import type { PatientFormData } from "../data/mockData";

export type RiskTone = "low" | "mid" | "high";

export interface PrediccionRequest {
  edad: number;
  presion_sistolica: number;
  presion_diastolica: number;
  azucar_sangre: number;
  temperatura_corporal: number;
  frecuencia_cardiaca: number;
}

export interface AjusteEntradaResponse {
  variable: keyof PrediccionRequest | string;
  valor_original: number;
  valor_ajustado: number;
}

export interface PrediccionResponse {
  puntaje: number;
  riesgo: string;
  sistema: string;
  origen_modelo: string;
  ajustes_entrada: AjusteEntradaResponse[];
}

export interface AntecedentExplicacion {
  variable: keyof PrediccionRequest | string;
  categoria: string;
  pertenencia: number;
}

export interface ReglaActivada {
  numero: number;
  antecedentes: AntecedentExplicacion[];
  fuerza: number;
  consecuente: string;
}

export interface ExplicacionResponse {
  pertenencias: Record<string, Record<string, number>>;
  reglas_activadas: ReglaActivada[];
  activaciones: Record<string, number>;
  puntaje: number;
  riesgo: string;
  origen_modelo: string;
  ajustes_entrada: AjusteEntradaResponse[];
}

export const numericFieldSpecs = [
  {
    formKey: "age",
    apiKey: "edad",
    label: "Edad",
    helper: "Edad materna en anos",
    placeholder: "31",
    unit: "anos",
    min: 10,
    max: 70,
    step: 1,
  },
  {
    formKey: "systolicBP",
    apiKey: "presion_sistolica",
    label: "Presion sistolica",
    helper: "Valor superior de referencia",
    placeholder: "146",
    unit: "mmHg",
    min: 70,
    max: 160,
    step: 1,
  },
  {
    formKey: "diastolicBP",
    apiKey: "presion_diastolica",
    label: "Presion diastolica",
    helper: "Valor inferior de referencia",
    placeholder: "94",
    unit: "mmHg",
    min: 49,
    max: 100,
    step: 1,
  },
  {
    formKey: "bloodGlucose",
    apiKey: "azucar_sangre",
    label: "Glucosa / BS",
    helper: "Medicion de glucosa en sangre",
    placeholder: "7.8",
    unit: "mmol/L",
    min: 6,
    max: 19,
    step: 0.1,
  },
  {
    formKey: "bodyTemperature",
    apiKey: "temperatura_corporal",
    label: "Temperatura corporal",
    helper: "Registro termico observado",
    placeholder: "100.1",
    unit: "F",
    min: 97,
    max: 103,
    step: 0.1,
  },
  {
    formKey: "heartRate",
    apiKey: "frecuencia_cardiaca",
    label: "Frecuencia cardiaca",
    helper: "Frecuencia cardiaca observada",
    placeholder: "88",
    unit: "bpm",
    min: 60,
    max: 90,
    step: 1,
  },
] as const;

export type NumericFormField = (typeof numericFieldSpecs)[number]["formKey"];
type NumericFieldSpec = (typeof numericFieldSpecs)[number];

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api/v1/predicciones").replace(
  /\/$/,
  "",
);

const fieldSpecByApiKey = Object.fromEntries(
  numericFieldSpecs.map((spec) => [spec.apiKey, spec]),
) as Record<(typeof numericFieldSpecs)[number]["apiKey"], NumericFieldSpec>;

const riskToneConfig = {
  low: {
    accent: "#4ade80",
    label: "Riesgo bajo",
  },
  mid: {
    accent: "#f59e0b",
    label: "Riesgo medio",
  },
  high: {
    accent: "#fb7185",
    label: "Riesgo alto",
  },
} as const;

const numberFormatter = new Intl.NumberFormat("es-EC", {
  maximumFractionDigits: 2,
});

const scoreFormatter = new Intl.NumberFormat("es-EC", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function buildPredictionPayload(formData: PatientFormData): PrediccionRequest {
  return numericFieldSpecs.reduce((payload, spec) => {
    payload[spec.apiKey] = parseNumericField(formData[spec.formKey], spec.label);
    return payload;
  }, {} as PrediccionRequest);
}

export function getFieldLabel(variable: string) {
  return fieldSpecByApiKey[variable as keyof typeof fieldSpecByApiKey]?.label ?? humanize(variable);
}

export function getFieldUnit(variable: string) {
  return fieldSpecByApiKey[variable as keyof typeof fieldSpecByApiKey]?.unit ?? "";
}

export function getFieldRange(formKey: NumericFormField) {
  const spec = numericFieldSpecs.find((item) => item.formKey === formKey);

  if (!spec) {
    return "";
  }

  return `${spec.min} - ${spec.max} ${spec.unit}`;
}

export function getRiskTone(value: string): RiskTone {
  const normalized = value.toLowerCase();

  if (normalized.includes("high") || normalized.includes("alto")) {
    return "high";
  }

  if (normalized.includes("mid") || normalized.includes("medio")) {
    return "mid";
  }

  return "low";
}

export function getRiskUi(value: string) {
  const tone = getRiskTone(value);
  return {
    tone,
    ...riskToneConfig[tone],
  };
}

export function formatScore(value: number) {
  return scoreFormatter.format(value);
}

export function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatValue(variable: string, value: number) {
  const unit = getFieldUnit(variable);
  return unit ? `${numberFormatter.format(value)} ${unit}` : numberFormatter.format(value);
}

export function formatAntecedentLabel(antecedent: AntecedentExplicacion) {
  return `${getFieldLabel(antecedent.variable)} es ${humanize(antecedent.categoria)}`;
}

export function buildRuleTitle(rule: ReglaActivada) {
  return `Si ${rule.antecedentes.map((antecedent) => formatAntecedentLabel(antecedent)).join(" y ")}`;
}

// ─── Narrativa clínica ────────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  bajo: "bajo",
  baja: "baja",
  normal: "normal",
  alto: "alto",
  alta: "alta",
  elevado: "elevado",
  elevada: "elevada",
  muy_alto: "muy alto",
  muy_alta: "muy alta",
  joven: "joven",
  adulta: "adulta",
  mayor: "en edad avanzada",
  lenta: "lenta",
  rapida: "rápida",
  muy_rapida: "muy rápida",
  taquicardia: "con taquicardia",
  fiebre: "con fiebre",
  hipotermia: "con hipotermia",
};

function getCategoryLabel(categoria: string): string {
  return categoryLabels[categoria] ?? humanize(categoria);
}

/** Frase legible de los antecedentes de una regla, sin porcentajes técnicos. */
export function buildRuleNarrative(rule: ReglaActivada): string {
  const parts = rule.antecedentes.map(
    (a) => `la ${getFieldLabel(a.variable).toLowerCase()} está ${getCategoryLabel(a.categoria)}`,
  );
  if (parts.length === 0) return "";
  if (parts.length === 1) return capitalize(parts[0]) + ".";
  const last = parts.pop()!;
  return capitalize(parts.join(", ") + " y " + last) + ".";
}

export interface ClinicalNarrative {
  intro: string;
  details: string;
  conclusion: string;
}

/** Genera tres oraciones que explican la decisión del sistema en lenguaje clínico. */
export function buildClinicalNarrative(result: ExplicacionResponse): ClinicalNarrative {
  const riskLabel = getRiskUi(result.riesgo).label.toLowerCase();
  const score = Math.round(result.puntaje);
  const intro = `El sistema clasificó este caso como ${riskLabel} con un puntaje de ${score} sobre 100.`;

  // Variables cuyo estado dominante no es "normal"
  const alerts: string[] = [];
  for (const [variable, categories] of Object.entries(result.pertenencias)) {
    const top = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];
    if (!top) continue;
    const [topCat, topVal] = top;
    if (topVal >= 0.4 && topCat !== "normal") {
      alerts.push(`${getFieldLabel(variable).toLowerCase()} ${getCategoryLabel(topCat)}`);
    }
  }

  const details =
    alerts.length > 0
      ? `Los indicadores que más influyeron en esta decisión fueron: ${alerts.join(", ")}.`
      : "Los indicadores clínicos se encuentran dentro de los rangos esperados para este caso.";

  const high = result.activaciones["alto"] ?? 0;
  const mid = result.activaciones["medio"] ?? 0;
  const low = result.activaciones["bajo"] ?? 0;
  const rulesCount = result.reglas_activadas.length;

  let conclusion = `Se evaluaron ${rulesCount} regla${rulesCount === 1 ? "" : "s"} del sistema difuso.`;

  if (high > 0.5) {
    conclusion += ` La evidencia acumulada hacia riesgo alto alcanzó el ${Math.round(high * 100)}%, lo que justifica atención médica prioritaria.`;
  } else if (mid > 0.4) {
    conclusion += ` La evidencia hacia riesgo medio alcanzó el ${Math.round(mid * 100)}%, lo que sugiere seguimiento clínico cercano.`;
  } else if (low > 0.5) {
    conclusion += ` La evidencia hacia riesgo bajo alcanzó el ${Math.round(low * 100)}%, sin señales de alerta críticas.`;
  }

  return { intro, details, conclusion };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildResultSummary(result: Pick<ExplicacionResponse, "riesgo" | "puntaje" | "ajustes_entrada">) {
  const risk = getRiskUi(result.riesgo);
  const adjustmentsCount = result.ajustes_entrada.length;
  const adjustmentText =
    adjustmentsCount > 0
      ? `El sistema normalizo ${adjustmentsCount} valor${adjustmentsCount === 1 ? "" : "es"} para mantenerlos dentro del rango de analisis.`
      : "Los valores ingresados estaban dentro del rango de analisis valido.";

  return {
    headline: `El sistema clasifico el caso como ${risk.label.toLowerCase()}.`,
    description: `Se obtuvo un puntaje de ${formatScore(result.puntaje)} sobre 100. ${adjustmentText}`,
  };
}

export async function predecirRiesgoMaterno(
  payload: PrediccionRequest,
  signal?: AbortSignal,
) {
  return apiRequest<PrediccionResponse>("/riesgo-materno", {
    body: JSON.stringify(payload),
    method: "POST",
    signal,
  });
}

export async function explicarPrediccion(
  payload: PrediccionRequest,
  signal?: AbortSignal,
) {
  return apiRequest<ExplicacionResponse>("/riesgo-materno/explicacion", {
    body: JSON.stringify(payload),
    method: "POST",
    signal,
  });
}

function parseNumericField(value: string, label: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Ingrese un valor numerico valido para ${label.toLowerCase()}.`);
  }

  return numericValue;
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `No se pudo completar la solicitud (${response.status}).`;

    try {
      const data = (await response.json()) as { detail?: string };
      if (typeof data.detail === "string" && data.detail.trim().length > 0) {
        message = data.detail;
      }
    } catch {
      // Se conserva el mensaje por defecto cuando el backend no devuelve JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}
