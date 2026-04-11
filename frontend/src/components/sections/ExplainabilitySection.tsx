import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, LoaderCircle } from "lucide-react";
import {
  buildClinicalNarrative,
  buildRuleNarrative,
  formatPercentage,
  formatValue,
  getFieldLabel,
  getRiskUi,
  type ExplicacionResponse,
} from "../../lib/riesgoMaterno";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface ExplainabilitySectionProps {
  result: ExplicacionResponse | null;
  isLoading: boolean;
  error: string | null;
}

const toneClassMap = {
  low: "text-emerald-700 border-emerald-200 bg-emerald-50",
  mid: "text-amber-700 border-amber-200 bg-amber-50",
  high: "text-rose-700 border-rose-200 bg-rose-50",
};

const activationOrder = [
  { key: "alto", label: "Evidencia hacia riesgo alto" },
  { key: "medio", label: "Evidencia hacia riesgo medio" },
  { key: "bajo", label: "Evidencia hacia riesgo bajo" },
] as const;

export function ExplainabilitySection({
  result,
  isLoading,
  error,
}: ExplainabilitySectionProps) {
  return (
    <section className="section-anchor pt-10" id="explainability">
      <SectionHeader
        eyebrow="Transparencia clinica"
        title="Por que el sistema tomo esta decision"
        description="Explicacion en lenguaje clinico de los factores que determinaron el nivel de riesgo del caso."
      />

      {isLoading ? (
        <GlassPanel className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-cyan-600" />
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Analizando el caso...
            </div>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
              El sistema esta evaluando los indicadores clinicos y determinando las reglas que
              aplican para este paciente.
            </p>
          </div>
        </GlassPanel>
      ) : null}

      {!isLoading && error ? (
        <GlassPanel className="flex items-start gap-3 p-6 text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">No se pudo obtener la explicacion.</div>
            <p className="mt-2 text-sm leading-7">{error}</p>
          </div>
        </GlassPanel>
      ) : null}

      {!isLoading && !error && !result ? (
        <GlassPanel className="p-6">
          <p className="text-sm leading-7 text-slate-600">
            Ingrese los datos del paciente y ejecute el analisis para ver la explicacion clinica
            del resultado.
          </p>
        </GlassPanel>
      ) : null}

      {!isLoading && !error && result ? (
        <ResultContent result={result} />
      ) : null}
    </section>
  );
}

function ResultContent({ result }: { result: ExplicacionResponse }) {
  const narrative = buildClinicalNarrative(result);
  const risk = getRiskUi(result.riesgo);
  const sortedRules = [...result.reglas_activadas].sort((a, b) => b.fuerza - a.fuerza);

  return (
    <div className="space-y-6">
      {/* Narrativa clínica */}
      <GlassPanel className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-3 text-cyan-700 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
              Explicacion clinica
            </div>
            <p className="mt-3 text-base font-semibold leading-relaxed text-slate-900">
              {narrative.intro}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{narrative.details}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{narrative.conclusion}</p>
          </div>
        </div>
      </GlassPanel>

      {/* Resumen de activaciones */}
      <GlassPanel className="p-6 sm:p-8">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-500 mb-5">
          Distribucion de la evidencia por nivel de riesgo
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {activationOrder.map((item) => {
            const itemRisk = getRiskUi(item.key);
            const activation = result.activaciones[item.key] ?? 0;

            return (
              <div
                key={item.key}
                className="rounded-[1.75rem] border border-sky-100 bg-white/82 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassMap[itemRisk.tone]}`}
                  >
                    {getRiskUi(item.key).label}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatPercentage(activation)}
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-full bg-sky-100">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: itemRisk.accent,
                      width: `${Math.max(4, Math.round(activation * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{item.label}</p>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Reglas activadas */}
      <div>
        <div className="mb-4 px-1">
          <div className="text-base font-semibold text-slate-900">
            Reglas que influyeron en la decision
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ordenadas por peso de influencia — de mayor a menor impacto en el resultado final.
          </p>
        </div>

        <div className="space-y-4">
          {sortedRules.map((rule, index) => {
            const ruleRisk = getRiskUi(rule.consecuente);
            const narrative = buildRuleNarrative(rule);

            return (
              <motion.div
                key={rule.numero}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                <GlassPanel className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                        Regla {rule.numero}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassMap[ruleRisk.tone]}`}
                      >
                        Indica {ruleRisk.label.toLowerCase()}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-right shrink-0">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Peso
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        {formatPercentage(rule.fuerza)}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    <span className="font-medium text-slate-500">Se activo porque: </span>
                    {narrative}
                  </p>

                  <div className="mt-4 overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: ruleRisk.accent,
                        width: `${Math.max(4, Math.round(rule.fuerza * 100))}%`,
                      }}
                    />
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Ajustes de entrada (solo si los hay) */}
      {result.ajustes_entrada.length > 0 ? (
        <GlassPanel className="p-5 sm:p-6">
          <div className="text-sm font-semibold text-slate-900">
            Valores ajustados automaticamente
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            El sistema normalizo estos valores para que estuvieran dentro del rango de analisis
            valido antes de procesar el caso.
          </p>
          <div className="mt-4 space-y-2">
            {result.ajustes_entrada.map((adjustment) => (
              <div
                key={`adjustment-${adjustment.variable}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <span className="font-medium">{getFieldLabel(adjustment.variable)}</span>
                <span className="text-slate-500">
                  {formatValue(adjustment.variable, adjustment.valor_original)}
                  <span className="mx-2 text-cyan-500">→</span>
                  <span className="font-semibold text-cyan-700">
                    {formatValue(adjustment.variable, adjustment.valor_ajustado)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
