import { DraftingCompass, FileText, Sigma } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Defina geometria e carregamentos',
    description: 'Estruture o problema com dados geométricos, vínculos e ações aplicadas ao modelo.',
    icon: DraftingCompass,
  },
  {
    step: '02',
    title: 'Processe o modelo estrutural',
    description: 'Execute a análise ou o dimensionamento com apoio visual e organização mais consistente.',
    icon: Sigma,
  },
  {
    step: '03',
    title: 'Interprete resultados e documente',
    description: 'Use diagramas, verificações, normas e memoriais para apoiar a tomada de decisão.',
    icon: FileText,
  },
];

export function HomeWorkflow() {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden rounded-[2rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(226,232,240,0.66))] p-6 shadow-[0_28px_65px_-50px_rgba(15,23,42,0.45)] md:p-8"
    >
      <div className="max-w-2xl space-y-3">
        <span className="home-eyebrow">Fluxo de uso</span>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[rgb(15,23,42)] md:text-4xl">
          Do lançamento dos dados à interpretação dos resultados.
        </h2>
        <p className="text-base leading-7 text-[rgb(71,85,105)]">
          A plataforma foi pensada para conectar entrada de dados, processamento e leitura técnica em uma sequência
          natural de trabalho.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {steps.map(({ step, title, description, icon: Icon }) => (
          <article
            key={step}
            className="relative rounded-[1.6rem] border border-white/70 bg-white/85 p-5 shadow-[0_22px_50px_-44px_rgba(15,23,42,0.42)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(14,116,144)]">Etapa {step}</span>
              <div className="rounded-2xl bg-[rgba(15,23,42,0.06)] p-3 text-[rgb(15,23,42)]">
                <Icon className="size-5" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[rgb(15,23,42)]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
