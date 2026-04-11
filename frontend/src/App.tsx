import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ActivitySquare,
  AlertTriangle,
  BarChart3,
  FlaskConical,
  GitBranch,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { AnalyticsSection } from "./components/sections/AnalyticsSection";
import { ArchitectureSection } from "./components/sections/ArchitectureSection";
import { HeroSection } from "./components/sections/HeroSection";
import { MembershipFunctionsSection } from "./components/sections/MembershipFunctionsSection";
import { OptimizationSection } from "./components/sections/OptimizationSection";
import { PatientDataSection } from "./components/sections/PatientDataSection";
import { RecommendationSection } from "./components/sections/RecommendationSection";
import {
  initialPatientForm,
  type PatientFormData,
} from "./data/mockData";
import {
  buildPredictionPayload,
  explicarPrediccion,
  type ExplicacionResponse,
  type PrediccionRequest,
} from "./lib/riesgoMaterno";
import { cn } from "./lib/utils";

const navigation = [
  {
    key: "patient-entry",
    label: "Ingreso de datos",
    icon: Stethoscope,
    requiresAnalysis: false,
  },
  {
    key: "recommendation",
    label: "Resultado",
    icon: ActivitySquare,
    requiresAnalysis: true,
  },
  {
    key: "membership-functions",
    label: "Membresias",
    icon: FlaskConical,
    requiresAnalysis: false,
  },
  {
    key: "optimization",
    label: "Optimizacion",
    icon: Microscope,
    requiresAnalysis: false,
  },
  {
    key: "analytics",
    label: "Analitica",
    icon: BarChart3,
    requiresAnalysis: false,
  },
  {
    key: "architecture",
    label: "Arquitectura",
    icon: GitBranch,
    requiresAnalysis: false,
  },
] as const;

type SectionKey = (typeof navigation)[number]["key"];

export default function App() {
  const [formData, setFormData] = useState<PatientFormData>(initialPatientForm);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanationResult, setExplanationResult] = useState<ExplicacionResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("patient-entry");
  const abortRef = useRef<AbortController | null>(null);
  const hasAnalyzed = explanationResult !== null;

  function handleFieldChange(
    field: keyof PatientFormData,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (explanationResult || analysisError || isAnalyzing) {
      resetAnalysisState();
    }

    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!hasAnalyzed && !isAnalyzing && activeSection === "recommendation") {
      setActiveSection("patient-entry");
    }
  }, [activeSection, hasAnalyzed, isAnalyzing]);

  async function handleAnalyze() {
    if (isAnalyzing) {
      return;
    }

    let payload: PrediccionRequest;

    try {
      payload = buildPredictionPayload(formData);
    } catch (error) {
      setAnalysisError(getErrorMessage(error));
      return;
    }

    resetAnalysisState();
    setIsAnalyzing(true);
    setActiveSection("recommendation");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await explicarPrediccion(payload, controller.signal);

      if (abortRef.current !== controller) {
        return;
      }

      abortRef.current = null;
      setExplanationResult(result);
      setAnalysisError(null);
      setIsAnalyzing(false);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      if (abortRef.current === controller) {
        abortRef.current = null;
      }

      setAnalysisError(getErrorMessage(error));
      setIsAnalyzing(false);
    }
  }

  function renderActiveSection() {
    switch (activeSection) {
      case "patient-entry":
        return (
          <PatientDataSection
            formData={formData}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            onFieldChange={handleFieldChange}
          />
        );
      case "recommendation":
        return (
          <RecommendationSection
            result={explanationResult}
            isLoading={isAnalyzing}
            error={analysisError}
          />
        );
      case "membership-functions":
        return <MembershipFunctionsSection />;
      case "optimization":
        return <OptimizationSection />;
      case "analytics":
        return <AnalyticsSection />;
      case "architecture":
        return <ArchitectureSection />;
      default:
        return null;
    }
  }

  function resetAnalysisState() {
    abortRef.current?.abort();
    abortRef.current = null;
    setExplanationResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }

  const visibleNavigation = navigation.filter(
    (item) => !item.requiresAnalysis || hasAnalyzed,
  );
  const activeSectionLabel =
    navigation.find((item) => item.key === activeSection)?.label ?? "Ingreso de datos";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute right-[-12rem] top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-sky-100/90 bg-white/78 backdrop-blur-xl">
        <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 xl:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <button
              className="flex items-center gap-3 text-left"
              onClick={() => setActiveSection("patient-entry")}
              type="button"
            >
              <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-2.5 text-cyan-700">
                <ActivitySquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Sistema de apoyo a la decision medica
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Logica difusa + algoritmo genetico
                </div>
              </div>
            </button>

            <nav className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2">
                {visibleNavigation.map((item) => {
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
        {analysisError ? (
          <div className="mt-6 flex items-start gap-3 rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">No se pudo ejecutar el analisis.</div>
              <div className="mt-1">{analysisError}</div>
            </div>
          </div>
        ) : null}

        <HeroSection
          activeSectionLabel={activeSectionLabel}
          onOpenOptimization={() => setActiveSection("optimization")}
          onOpenPatientEntry={() => setActiveSection("patient-entry")}
        />

        <div className="mt-6 rounded-[2rem] border border-sky-100 bg-white/70 px-4 py-3 sm:px-5">
          <div className="w-fit rounded-full border border-cyan-300/35 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
            Seccion actual: {activeSectionLabel}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrio un error inesperado.";
}
