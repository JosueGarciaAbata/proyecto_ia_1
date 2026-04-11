import { ArrowRight } from "lucide-react";
import { architectureSteps } from "../../data/mockData";
import { GlassPanel } from "../ui/GlassPanel";
import { SectionHeader } from "../ui/SectionHeader";

export function ArchitectureSection() {
  return (
    <section className="section-anchor pt-10" id="architecture">
      <SectionHeader
        eyebrow="Resumen tecnico"
        title="Arquitectura del sistema"
        description="Flujo general del sistema."
      />

      <GlassPanel className="p-6 sm:p-8">
        <div className="grid gap-4 xl:grid-cols-6">
          {architectureSteps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="h-full rounded-[1.75rem] border border-sky-100 bg-white/82 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-700/80">
                  Paso {index + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
              {index < architectureSteps.length - 1 ? (
                <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 xl:block">
                  <ArrowRight className="h-5 w-5 text-cyan-600/60" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
