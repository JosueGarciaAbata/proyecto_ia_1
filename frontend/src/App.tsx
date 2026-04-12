import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ActivitySquare, AlertTriangle, FlaskConical, Microscope, Stethoscope } from "lucide-react";
import { DifusoSection } from "./components/sections/DifusoSection";
import { OptimizationSection } from "./components/sections/OptimizationSection";
import { PatientDataSection } from "./components/sections/PatientDataSection";
import { RecommendationSection } from "./components/sections/RecommendationSection";
import { initialPatientForm, type PatientFormData } from "./data/mockData";
import {
  buildPredictionPayload,
  explicarPrediccion,
  type ExplicacionResponse,
  type PrediccionRequest,
} from "./lib/riesgoMaterno";
import { cn } from "./lib/utils";

const navigation = [
  { key: "prediccion", label: "Prediccion", icon: Stethoscope },
  { key: "difuso", label: "Sistema difuso", icon: FlaskConical },
  { key: "ga", label: "Algoritmo genetico", icon: Microscope },
] as const;

type SectionKey = (typeof navigation)[number]["key"];

export default function App() {
  const [formData, setFormData] = useState<PatientFormData>(initialPatientForm);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanationResult, setExplanationResult] = useState<ExplicacionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("prediccion");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  function handleFieldChange(
    field: keyof PatientFormData,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (explanationResult || analysisError || isAnalyzing) {
      resetAnalysisState();
    }
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleAnalyze() {
    if (isAnalyzing) return;

    let payload: PrediccionRequest;
    try {
      payload = buildPredictionPayload(formData);
    } catch (error) {
      setAnalysisError(getErrorMessage(error));
      return;
    }

    resetAnalysisState();
    setIsAnalyzing(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await explicarPrediccion(payload, controller.signal);
      if (abortRef.current !== controller) return;
      abortRef.current = null;
      setExplanationResult(result);
      setAnalysisError(null);
      setIsAnalyzing(false);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (abortRef.current === controller) abortRef.current = null;
      setAnalysisError(getErrorMessage(error));
      setIsAnalyzing(false);
    }
  }

  function resetAnalysisState() {
    abortRef.current?.abort();
    abortRef.current = null;
    setExplanationResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }

  const activeSectionLabel =
    navigation.find((item) => item.key === activeSection)?.label ?? "Prediccion";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-12rem] top-32 h-96 w-96 rounded-full bg-blue-300/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-sky-100/90 bg-white/78 backdrop-blur-xl">
        <div className="mx-auto max-w-[1480px] px-4 py-3 sm:px-6 xl:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-2 text-cyan-700">
                <ActivitySquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Riesgo materno
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Logica difusa Mamdani + AG
                </div>
              </div>
            </div>

            <nav>
              <div className="flex items-center gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  return (
                    <button
                      key={item.key}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                        isActive
                          ? "border-cyan-400/40 bg-cyan-50 text-cyan-900 shadow-sm"
                          : "border-sky-100 bg-white/80 text-slate-700 hover:border-cyan-300/45 hover:bg-cyan-50 hover:text-slate-900",
                      )}
                      onClick={() => setActiveSection(item.key)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 pb-16 sm:px-6 xl:px-8">
        {analysisError && activeSection !== "prediccion" ? (
          <div className="mt-4 flex items-start gap-3 rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full border border-cyan-300/35 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
            {activeSectionLabel}
          </span>
          {explanationResult && activeSection !== "prediccion" && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Caso analizado disponible
            </span>
          )}
        </div>

        {/* Secciones siempre montadas — se ocultan con CSS para no perder estado */}
        <div className={activeSection === "prediccion" ? undefined : "hidden"}>
          <div className="space-y-6">
            <PatientDataSection
              formData={formData}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              onFieldChange={handleFieldChange}
            />
            {(isAnalyzing || explanationResult || analysisError) && (
              <RecommendationSection
                result={explanationResult}
                isLoading={isAnalyzing}
                error={analysisError}
              />
            )}
          </div>
        </div>

        <div className={activeSection === "difuso" ? undefined : "hidden"}>
          <DifusoSection explanationResult={explanationResult} />
        </div>

        <div className={activeSection === "ga" ? undefined : "hidden"}>
          <OptimizationSection />
        </div>
      </main>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrio un error inesperado.";
}
