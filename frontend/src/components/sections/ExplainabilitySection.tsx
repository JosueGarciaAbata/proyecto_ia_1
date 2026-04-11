import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import type { ActivatedRule } from "../../data/mockData";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

interface ExplainabilitySectionProps {
  rules: ActivatedRule[];
}

const toneClassMap = {
  low: "text-emerald-700 border-emerald-200 bg-emerald-50",
  mid: "text-amber-700 border-amber-200 bg-amber-50",
  high: "text-rose-700 border-rose-200 bg-rose-50",
};

const toneLabelMap = {
  low: "aporte bajo",
  mid: "aporte medio",
  high: "aporte alto",
};

export function ExplainabilitySection({ rules }: ExplainabilitySectionProps) {
  return (
    <section className="section-anchor pt-10" id="explainability">
      <SectionHeader
        eyebrow="Razonamiento interpretable"
        title="Activacion de reglas"
        description="Reglas activadas y antecedentes."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {rules.map((rule, index) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <GlassPanel className="h-full p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      {rule.id}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassMap[rule.tone]}`}
                    >
                      {toneLabelMap[rule.tone]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{rule.title}</h3>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-right">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Activacion
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {Math.round(rule.activation * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
                  style={{ width: `${Math.max(6, Math.round(rule.activation * 100))}%` }}
                />
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">{rule.rationale}</p>

              <details className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-cyan-300/30 bg-cyan-50 p-2.5 text-cyan-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Antecedentes activados
                      </div>
                      <div className="text-xs text-slate-500">
                        Expandir para revisar la ruta linguistica
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </summary>
                <div className="mt-4 flex flex-wrap gap-2">
                  {rule.antecedents.map((antecedent) => (
                    <span
                      key={antecedent}
                      className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {antecedent}
                    </span>
                  ))}
                </div>
              </details>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
