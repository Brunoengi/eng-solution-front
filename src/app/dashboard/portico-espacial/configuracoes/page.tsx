'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Eye,
  Monitor,
  Ruler,
  Settings2,
  SquareStack,
  Waves,
} from 'lucide-react';

import {
  AppSidebar,
  SidebarToggleButton,
  type MenuItem,
} from '@/components/user/molecules/sidebar';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  loadFrame3DVisualizationSettings,
  saveFrame3DVisualizationSettings,
  type Frame3DCameraProjection,
  type Frame3DLoadColorMode,
  type Frame3DVisualizationSize,
  type Frame3DVisualizationSettings,
} from '@/features/portico-espacial/model';
import { cn } from '@/lib/utils';

type ConfigurationSectionId = 'visualizacao' | 'carregamentos' | 'sistema-unidades';

type ConfigurationSection = {
  id: ConfigurationSectionId;
  label: string;
  title: string;
  description: string;
  icon: typeof Eye;
};

type CameraSettingCard = {
  id: 'camera3dProjection' | 'planarProjection';
  title: string;
  description: string;
  icon: typeof Monitor;
};

type SizeSettingCard = {
  id: 'loadSymbolSize' | 'loadLabelSize';
  title: string;
  description: string;
  icon: typeof Monitor;
};

const CONFIGURATION_SECTIONS: ConfigurationSection[] = [
  {
    id: 'visualizacao',
    label: 'Visualizacao',
    title: 'Configuracoes de visualizacao',
    description:
      'Controle aqui como as vistas do modulo devem abrir, incluindo o tipo de camera da cena 3D e das vistas planas.',
    icon: Eye,
  },
  {
    id: 'carregamentos',
    label: 'Carregamentos',
    title: 'Configuracoes de carregamentos',
    description:
      'Controle aqui como as cargas devem ser destacadas na visualizacao, incluindo a regra de cores para valores diferentes.',
    icon: Waves,
  },
  {
    id: 'sistema-unidades',
    label: 'Sistema de unidades',
    title: 'Configuracoes de unidades',
    description:
      'Area reservada para centralizar as unidades de entrada e exibicao do portico espacial, mantendo uma base unica para o modulo.',
    icon: Ruler,
  },
];

const CAMERA_OPTIONS: Array<{
  value: Frame3DCameraProjection;
  label: string;
  description: string;
}> = [
  {
    value: 'perspective',
    label: 'Perspectiva',
    description: 'Mantem ponto de fuga e leitura espacial mais natural.',
  },
  {
    value: 'orthographic',
    label: 'Ortografica',
    description: 'Remove ponto de fuga e preserva paralelismo visual.',
  },
];

const VISUALIZATION_SETTING_CARDS: CameraSettingCard[] = [
  {
    id: 'camera3dProjection',
    title: 'Vista 3D',
    description: 'Define qual camera deve ser usada quando a vista ativa for 3D.',
    icon: Monitor,
  },
  {
    id: 'planarProjection',
    title: 'Planos XY, XZ e YZ',
    description: 'Define qual camera deve ser usada para as vistas alinhadas aos planos principais.',
    icon: SquareStack,
  },
];

const SIZE_OPTIONS: Array<{
  value: Frame3DVisualizationSize;
  label: string;
  description: string;
}> = [
  {
    value: 'small',
    label: 'Pequeno',
    description: 'Ocupa menos area na cena e reduz a interferencia visual.',
  },
  {
    value: 'medium',
    label: 'Medio',
    description: 'Equilibrio entre leitura e limpeza visual. Para carregamentos, equivale a 0,5 m.',
  },
  {
    value: 'large',
    label: 'Grande',
    description: 'Destaca mais cargas e textos em modelos extensos.',
  },
];

const VISUALIZATION_SIZE_CARDS: SizeSettingCard[] = [
  {
    id: 'loadSymbolSize',
    title: 'Simbologia dos carregamentos',
    description: 'Controla o comprimento visual das setas e da representacao das cargas na cena.',
    icon: Eye,
  },
  {
    id: 'loadLabelSize',
    title: 'Texto dos carregamentos',
    description: 'Controla o tamanho dos rotulos como 10 kN e 10 kN/m exibidos sobre a estrutura.',
    icon: SquareStack,
  },
];

const LOAD_COLOR_MODE_OPTIONS: Array<{
  value: Frame3DLoadColorMode;
  label: string;
  description: string;
}> = [
  {
    value: 'by-value',
    label: 'Por valor',
    description: 'Carregamentos com intensidades diferentes recebem cores diferentes. Este e o default.',
  },
  {
    value: 'uniform',
    label: 'Todos da mesma cor',
    description: 'Mantem todas as cargas com a mesma cor, independentemente do valor.',
  },
];

function buildScenarioSummary(settings: Frame3DVisualizationSettings) {
  return `${settings.camera3dProjection === 'perspective' ? '3D em perspectiva' : '3D em ortografica'} + ${
    settings.planarProjection === 'perspective' ? 'planos em perspectiva' : 'planos em ortografica'
  } + cargas em ${
    settings.loadSymbolSize === 'small'
      ? 'tamanho pequeno'
      : settings.loadSymbolSize === 'large'
        ? 'tamanho grande'
        : 'tamanho medio'
  } + cores ${
    settings.loadColorMode === 'uniform' ? 'uniformes' : 'por valor'
  }`;
}

export default function PorticoEspacialConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState<ConfigurationSectionId>('visualizacao');
  const [visualizationSettings, setVisualizationSettings] = useState<Frame3DVisualizationSettings>(
    loadFrame3DVisualizationSettings(),
  );

  const menuItems: MenuItem[] = [
    {
      label: 'Portico espacial',
      href: '/dashboard/portico-espacial',
      icon: Building2,
      isActive: false,
    },
  ];

  const configurationItems: MenuItem[] = [
    {
      label: 'Configuracoes',
      href: '/dashboard/portico-espacial/configuracoes',
      icon: Settings2,
      isActive: true,
    },
  ];

  const selectedSection =
    CONFIGURATION_SECTIONS.find((section) => section.id === activeSection) ?? CONFIGURATION_SECTIONS[0];

  const updateVisualizationSetting = <K extends keyof Frame3DVisualizationSettings>(
    field: K,
    value: Frame3DVisualizationSettings[K],
  ) => {
    const next = {
      ...visualizationSettings,
      [field]: value,
    } satisfies Frame3DVisualizationSettings;

    setVisualizationSettings(next);
    saveFrame3DVisualizationSettings(next);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex w-full">
        <AppSidebar
          menuItems={menuItems}
          configItems={configurationItems}
          menuGroupLabel="Secao Principal"
          configGroupLabel="Configuracoes"
          exitHref="/"
        />

        <div className="min-h-screen flex-1 bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_45%,#ffffff_100%)] text-slate-900">
          <section className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
            <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portico espacial</p>
                  <h1 className="text-2xl font-semibold text-slate-900">Configuracoes</h1>
                  <p className="max-w-3xl text-sm text-slate-600">
                    Escolha abaixo qual grupo de configuracoes voce quer editar. A estrutura ja foi preparada para receber
                    novas secoes no futuro sem depender de um toggle fixo.
                  </p>
                </div>

                <Button asChild variant="outline">
                  <Link href="/dashboard/portico-espacial">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao editor
                  </Link>
                </Button>
              </div>
            </header>

            <main className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Controle da pagina</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">O que voce quer configurar?</h2>
                    </div>

                    <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-slate-100 p-1">
                      {CONFIGURATION_SECTIONS.map((section) => {
                        const Icon = section.icon;

                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                              activeSection === section.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900',
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {section.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                        <selectedSection.icon className="h-5 w-5" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-slate-900">{selectedSection.title}</h3>
                        <p className="text-sm leading-6 text-slate-600">{selectedSection.description}</p>
                      </div>
                    </div>
                  </div>

                  {activeSection === 'visualizacao' ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Regra atual</p>
                        <h3 className="mt-2 text-base font-semibold text-slate-900">Combinacao ativa</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {buildScenarioSummary(visualizationSettings)}. Isso gera as 4 combinacoes possiveis a partir de
                          duas decisoes independentes: camera da vista 3D e camera das vistas planas.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {VISUALIZATION_SETTING_CARDS.map((card) => {
                          const Icon = card.icon;
                          const currentValue = visualizationSettings[card.id];

                          return (
                            <section key={card.id} className="rounded-2xl border border-slate-200 p-5">
                              <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                  <Icon className="h-5 w-5" />
                                </div>

                                <div>
                                  <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                                </div>
                              </div>

                              <div className="mt-5 inline-flex w-full rounded-full border border-slate-200 bg-slate-100 p-1">
                                {CAMERA_OPTIONS.map((option) => (
                                  <button
                                    key={`${card.id}-${option.value}`}
                                    type="button"
                                    onClick={() => updateVisualizationSetting(card.id, option.value)}
                                    className={cn(
                                      'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                      currentValue === option.value
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900',
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>

                              <div className="mt-4 space-y-2">
                                {CAMERA_OPTIONS.map((option) => (
                                  <div
                                    key={`${card.id}-${option.value}-info`}
                                    className={cn(
                                      'rounded-xl border px-3 py-2 text-sm',
                                      currentValue === option.value
                                        ? 'border-sky-200 bg-sky-50 text-sky-900'
                                        : 'border-slate-200 bg-slate-50 text-slate-600',
                                    )}
                                  >
                                    <p className="font-medium">{option.label}</p>
                                    <p className="mt-1 text-xs leading-5">{option.description}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          );
                        })}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {VISUALIZATION_SIZE_CARDS.map((card) => {
                          const Icon = card.icon;
                          const currentValue = visualizationSettings[card.id];

                          return (
                            <section key={card.id} className="rounded-2xl border border-slate-200 p-5">
                              <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                  <Icon className="h-5 w-5" />
                                </div>

                                <div>
                                  <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-3">
                                {SIZE_OPTIONS.map((option) => (
                                  <button
                                    key={`${card.id}-${option.value}`}
                                    type="button"
                                    onClick={() => updateVisualizationSetting(card.id, option.value)}
                                    className={cn(
                                      'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                                      currentValue === option.value
                                        ? 'border-sky-200 bg-sky-50 text-sky-900'
                                        : 'border-slate-200 bg-slate-50 text-slate-600',
                                    )}
                                  >
                                    <span className="font-medium">{option.label}</span>
                                    <p className="mt-1 text-xs leading-5">{option.description}</p>
                                  </button>
                                ))}
                              </div>
                            </section>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Default do modulo</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          O comportamento inicial ficou como voce pediu: vista `3D` em `Perspectiva`, planos `XY`, `XZ` e
                          `YZ` em `Ortografica`, simbologia dos carregamentos em `Medio` (0,5 m) e textos em `Pequeno`.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {activeSection === 'carregamentos' ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Coloracao ativa</p>
                        <h3 className="mt-2 text-base font-semibold text-slate-900">Modo atual dos carregamentos</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {visualizationSettings.loadColorMode === 'uniform'
                            ? 'Todos os carregamentos usam a mesma cor.'
                            : 'Carregamentos com valores diferentes recebem cores diferentes.'}
                        </p>
                      </div>

                      <section className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <Waves className="h-5 w-5" />
                          </div>

                          <div>
                            <h3 className="text-base font-semibold text-slate-900">Cores dos carregamentos</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Escolha se as cargas devem manter uma cor unica ou se cada valor deve ganhar uma cor propria na visualizacao.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3">
                          {LOAD_COLOR_MODE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateVisualizationSetting('loadColorMode', option.value)}
                              className={cn(
                                'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                                visualizationSettings.loadColorMode === option.value
                                  ? 'border-sky-200 bg-sky-50 text-sky-900'
                                  : 'border-slate-200 bg-slate-50 text-slate-600',
                              )}
                            >
                              <span className="font-medium">{option.label}</span>
                              <p className="mt-1 text-xs leading-5">{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </section>

                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Default do modulo</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          O comportamento inicial dos carregamentos agora e `Por valor`, para destacar automaticamente diferencas como `12 kN/m` e `16 kN/m`.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {activeSection === 'sistema-unidades' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Segunda etapa</p>
                        <h3 className="mt-2 text-base font-semibold text-slate-900">Sistema de unidades</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Esta secao vai servir como base para definir unidades de entrada e exibicao, evitando ajustes
                          espalhados por varias partes da tela.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Planejado</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Podemos tratar aqui forca, momento, comprimento, carga distribuida e eventuais conversoes
                          padrao do viewer e dos formularios.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estrutura</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">Preparada para crescer</h2>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    O seletor foi montado como uma lista de secoes, no mesmo estilo visual do bloco `Visualizar / Modificar`,
                    mas sem limitar a pagina a apenas duas opcoes.
                  </p>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Secoes atuais</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {CONFIGURATION_SECTIONS.map((section, index) => (
                        <li
                          key={section.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <span>{index + 1}. {section.label}</span>
                          <span className="text-xs text-slate-500">{section.id}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </aside>
            </main>
          </section>
        </div>
      </div>
    </SidebarProvider>
  );
}
