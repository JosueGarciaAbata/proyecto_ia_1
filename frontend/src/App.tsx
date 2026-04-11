import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ActivitySquare,
  BarChart3,
  Brain,
  FlaskConical,
  GitBranch,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { AnalyticsSection } from "./components/sections/AnalyticsSection";
import { ArchitectureSection } from "./components/sections/ArchitectureSection";
import { ExplainabilitySection } from "./components/sections/ExplainabilitySection";
import { HeroSection } from "./components/sections/HeroSection";
import { MembershipFunctionsSection } from "./components/sections/MembershipFunctionsSection";
import { OptimizationSection } from "./components/sections/OptimizationSection";
import { PatientDataSection } from "./components/sections/PatientDataSection";
import { RecommendationSection } from "./components/sections/RecommendationSection";
import {
  initialPatientForm,
  mockActivatedRules,
  mockRecommendation,
  type PatientFormData,
} from "./data/mockData";
import { cn } from "./lib/utils";

const navigation = [
  { key: "patient-entry", label: "Ingreso de datos", icon: Stethoscope },
  { key: "recommendation", label: "Resultado", icon: ActivitySquare },
  { key: "explainability", label: "Explicabilidad", icon: Brain },
  { key: "membership-functions", label: "Membresias", icon: FlaskConical },
  { key: "optimization", label: "Optimizacion", icon: Microscope },
  { key: "analytics", label: "Analitica", icon: BarChart3 },
  { key: "architecture", label: "Arquitectura", icon: GitBranch },
] as const;

type SectionKey = (typeof navigation)[number]["key"];

export default function App() {
  const [formData, setFormData] = useState<PatientFormData>(initialPatientForm);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("patient-entry");
  const analysisTimeoutRef = useRef<number | null>(null);

  function handleFieldChange(
    field: keyof PatientFormData,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  }

  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current !== null) {
        window.clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  function handleAnalyze() {
    if (isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);

    if (analysisTimeoutRef.current !== null) {
      window.clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = window.setTimeout(() => {
      setHasAnalyzed(true);
      setActiveSection("recommendation");
      setIsAnalyzing(false);
    }, 700);
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
        return <RecommendationSection analyzed={hasAnalyzed} result={mockRecommendation} />;
      case "explainability":
        return <ExplainabilitySection rules={mockActivatedRules} />;
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
        <HeroSection
          activeSectionLabel={navigation.find((item) => item.key === activeSection)?.label ?? ""}
          onOpenOptimization={() => setActiveSection("optimization")}
          onOpenPatientEntry={() => setActiveSection("patient-entry")}
        />

        <div className="mt-6 rounded-[2rem] border border-sky-100 bg-white/70 px-4 py-3 sm:px-5">
          <div className="w-fit rounded-full border border-cyan-300/35 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
            Seccion actual: {navigation.find((item) => item.key === activeSection)?.label}
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
