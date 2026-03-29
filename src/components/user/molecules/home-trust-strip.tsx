import { BookOpen, Braces, DraftingCompass, ShieldCheck } from 'lucide-react';

const trustItems = [
  {
    icon: DraftingCompass,
    label: 'Modelagem',
    value: 'Geometria, vigas, pórticos e fluxos de análise em destaque.',
  },
  {
    icon: ShieldCheck,
    label: 'Confiança',
    value: 'Interface com mais hierarquia visual e leitura profissional.',
  },
  {
    icon: BookOpen,
    label: 'Biblioteca técnica',
    value: 'Consulta de normas e referências conectadas ao produto.',
  },
  {
    icon: Braces,
    label: 'Integração',
    value: 'Base pronta para fluxos via API e automações futuras.',
  },
];

export function HomeTrustStrip() {
  return (
    <section
      aria-label="Pilares da plataforma"
      className="grid gap-4 rounded-[1.75rem] border border-white/60 bg-white/78 p-4 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.35)] md:grid-cols-2 lg:grid-cols-4"
    >
      {trustItems.map(({ icon: Icon, label, value }) => (
        <article
          key={label}
          className="rounded-[1.4rem] border border-[rgba(148,163,184,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.9))] p-4"
        >
          <div className="mb-3 inline-flex rounded-2xl bg-[rgba(15,23,42,0.06)] p-2 text-[rgb(14,116,144)]">
            <Icon className="size-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">{label}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(51,65,85)]">{value}</p>
        </article>
      ))}
    </section>
  );
}
