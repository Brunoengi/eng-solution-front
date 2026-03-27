'use client';

import Link from 'next/link';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../../components/user/molecules/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useVigaConcretoArmado } from '@/features/viga-concreto-armado/context/viga-concreto-armado-provider';
import {
  BITOLAS_NORMATIVAS_ESTRIBO_MM,
  BITOLAS_NORMATIVAS_LONGITUDINAL_MM,
  COBRIMENTO_NOMINAL_VIGA_POR_CAA,
  type BeamRebarSelectionMode,
  type ClasseAgressividadeAmbiental,
  type ClasseConcreto,
  type TipoGanchoArmadura,
} from '@/features/viga-concreto-armado/types';
import { Layers, ArrowUpDown, Anchor, Square, Settings, FileText, Link as LinkIcon, Home } from 'lucide-react';

function getStatusVisual(origemCobrimento: 'norma' | 'usuario', cobrimentoAdotadoCm: number, cobrimentoNormativoCm: number) {
  if (origemCobrimento === 'norma') {
    return {
      titulo: 'Conforme a norma',
      descricao: 'O cobrimento nominal adotado está sendo controlado pela tabela 7.2.',
      container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
    };
  }

  if (cobrimentoAdotadoCm >= cobrimentoNormativoCm) {
    return {
      titulo: 'Definido pelo usuário',
      descricao: 'O valor foi sobrescrito manualmente, mas continua em conformidade com a norma.',
      container: 'border-amber-200 bg-amber-50 text-amber-950',
      badge: 'bg-amber-500 text-white',
    };
  }

  return {
    titulo: 'Não conforme à norma',
    descricao: 'O valor foi definido pelo usuário e está abaixo do cobrimento nominal mínimo normativo para a classe selecionada.',
    container: 'border-red-200 bg-red-50 text-red-950',
    badge: 'bg-red-600 text-white',
  };
}

const CLASSES_CONCRETO: ClasseConcreto[] = ['C20', 'C25', 'C30', 'C35', 'C40', 'C45', 'C50', 'C55', 'C60', 'C65', 'C70', 'C75', 'C80', 'C85', 'C90'];
const OPCOES_GAMMA_C = ['1.4', '1.2'] as const;
const OPCOES_GAMMA_S = ['1.15', '1'] as const;
const OPCOES_TIPO_GANCHO: Array<{ value: TipoGanchoArmadura; label: string }> = [
  { value: 'semi-circular', label: 'Semi-circular' },
  { value: 'angulo-45', label: '\u00c2ngulo de 45\u00b0' },
  { value: 'angulo-reto', label: '\u00c2ngulo reto' },
];
type BitolaRoleField = 'bitolasLongitudinalTracaoMm' | 'bitolasLongitudinalCompressaoMm' | 'bitolasEstriboMm';

const OPCOES_MODO_SELECAO_BITOLAS: Array<{ value: BeamRebarSelectionMode; label: string }> = [
  { value: 'normative', label: 'Normativo' },
  { value: 'custom', label: 'Personalizado' },
  { value: 'hybrid', label: 'Hibrido' },
];

const BITOLA_ROLE_CONFIG: Array<{ field: BitolaRoleField; label: string; normative: readonly number[] }> = [
  {
    field: 'bitolasLongitudinalTracaoMm',
    label: 'Longitudinal de tracao',
    normative: BITOLAS_NORMATIVAS_LONGITUDINAL_MM,
  },
  {
    field: 'bitolasLongitudinalCompressaoMm',
    label: 'Longitudinal de compressao',
    normative: BITOLAS_NORMATIVAS_LONGITUDINAL_MM,
  },
  {
    field: 'bitolasEstriboMm',
    label: 'Estribo',
    normative: BITOLAS_NORMATIVAS_ESTRIBO_MM,
  },
];

export default function CriteriosProjetoVigaPage() {
  const { criteriosProjeto, updateCriteriosProjeto } = useVigaConcretoArmado();

  const menuItems: MenuItem[] = [
    {
      label: 'Elementos e Carregamentos',
      href: '/dashboard/viga-concreto-armado',
      icon: Home,
    },
    {
      label: 'Dimensionamento',
      icon: Layers,
      items: [
        { label: 'Armadura Longitudinal', href: '/dashboard/viga-concreto-armado/longitudinal', icon: ArrowUpDown },
        { label: 'Armadura Transversal', href: '/dashboard/viga-concreto-armado/transversal', icon: Square },
        { label: 'Armadura de Suspensão', href: '/dashboard/viga-concreto-armado/suspensao', icon: LinkIcon },
        { label: 'Armadura de Ancoragem', href: '/dashboard/viga-concreto-armado/ancoragem', icon: Anchor },
        { label: 'Armadura de Pele', href: '/dashboard/viga-concreto-armado/pele', icon: Layers },
      ],
    },
  ];

  const exportItems: MenuItem[] = [
    { label: 'Memorial de Cálculo', href: '/dashboard/viga-concreto-armado/memorial-pdf', icon: FileText },
  ];

  const configItems: MenuItem[] = [
    { label: 'Critérios de Projeto', href: '/dashboard/viga-concreto-armado/criterios-projeto', icon: Settings, isActive: true },
  ];


  const statusVisual = getStatusVisual(
    criteriosProjeto.origemCobrimento,
    criteriosProjeto.cobrimentoAdotadoCm,
    criteriosProjeto.cobrimentoNormativoCm,
  );

  const handleClasseAgressividadeChange = (value: ClasseAgressividadeAmbiental) => {
    const cobrimentoNormativoCm = COBRIMENTO_NOMINAL_VIGA_POR_CAA[value];

    updateCriteriosProjeto({
      classeAgressividadeAmbiental: value,
      cobrimentoNormativoCm,
      cobrimentoAdotadoCm: criteriosProjeto.origemCobrimento === 'norma'
        ? cobrimentoNormativoCm
        : criteriosProjeto.cobrimentoAdotadoCm,
    });
  };

  const handleOrigemCobrimentoChange = (origem: 'norma' | 'usuario') => {
    updateCriteriosProjeto({
      origemCobrimento: origem,
      cobrimentoAdotadoCm: origem === 'norma'
        ? criteriosProjeto.cobrimentoNormativoCm
        : criteriosProjeto.cobrimentoAdotadoCm,
    });
  };

  const handleCobrimentoAdotadoChange = (value: number) => {
    if (Number.isNaN(value)) {
      return;
    }

    updateCriteriosProjeto({
      origemCobrimento: 'usuario',
      cobrimentoAdotadoCm: value,
    });
  };
  const getSelectedBitolasByField = (field: BitolaRoleField): number[] => {
    if (field === 'bitolasLongitudinalTracaoMm') {
      return criteriosProjeto.bitolasLongitudinalTracaoMm;
    }

    if (field === 'bitolasLongitudinalCompressaoMm') {
      return criteriosProjeto.bitolasLongitudinalCompressaoMm;
    }

    return criteriosProjeto.bitolasEstriboMm;
  };

  const updateBitolasByField = (field: BitolaRoleField, values: number[]) => {
    const uniqueSorted = Array.from(new Set(values)).sort((left, right) => left - right);

    if (field === 'bitolasLongitudinalTracaoMm') {
      updateCriteriosProjeto({ bitolasLongitudinalTracaoMm: uniqueSorted });
      return;
    }

    if (field === 'bitolasLongitudinalCompressaoMm') {
      updateCriteriosProjeto({ bitolasLongitudinalCompressaoMm: uniqueSorted });
      return;
    }

    updateCriteriosProjeto({ bitolasEstriboMm: uniqueSorted });
  };

  const handleModoSelecaoBitolasChange = (mode: BeamRebarSelectionMode) => {
    updateCriteriosProjeto({ modoSelecaoBitolas: mode });
  };

  const handleToggleBitola = (field: BitolaRoleField, bitola: number) => {
    if (criteriosProjeto.modoSelecaoBitolas === 'normative') {
      return;
    }

    const selected = getSelectedBitolasByField(field);
    const next = selected.includes(bitola)
      ? selected.filter((value) => value !== bitola)
      : [...selected, bitola];

    updateBitolasByField(field, next);
  };

  const handleSelecionarTodasBitolasNormativas = (field: BitolaRoleField, normative: readonly number[]) => {
    if (criteriosProjeto.modoSelecaoBitolas === 'normative') {
      return;
    }

    updateBitolasByField(field, [...normative]);
  };

  const handleLimparBitolas = (field: BitolaRoleField) => {
    if (criteriosProjeto.modoSelecaoBitolas === 'normative') {
      return;
    }

    updateBitolasByField(field, []);
  };

  const handleRestaurarBitolasPadrao = (field: BitolaRoleField, normative: readonly number[]) => {
    updateBitolasByField(field, [...normative]);
  };

  const resumoBitolas = [
    ...criteriosProjeto.bitolasLongitudinalTracaoMm,
    ...criteriosProjeto.bitolasLongitudinalCompressaoMm,
    ...criteriosProjeto.bitolasEstriboMm,
  ];
  const totalBitolasUnicas = new Set(resumoBitolas).size;

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#fffaf0_0%,_#f8fafc_100%)]">
        <AppSidebar
          menuItems={menuItems}
          exportItems={exportItems}
          configItems={configItems}
          menuGroupLabel="Menu Principal"
          configGroupLabel="Configurações"
          exportGroupLabel="Exportar"
        />

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <section className="rounded-3xl border border-amber-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Critérios de Projeto
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                Critérios compartilhados do módulo de vigas
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Organizamos os critérios por conjunto para facilitar a leitura e a tomada de decisão.
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col gap-4">
                <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Durabilidade e cobrimento nominal</h2>
                    </div>
                    <Link
                      href="/dashboard/normas/nbr6118/tabelas/7.2"
                      className="inline-flex min-w-[18rem] justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      Abrir NBR6118/2023 - tabela 7.2
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="classe-agressividade">Classe de agressividade ambiental</Label>
                      <Select
                        value={criteriosProjeto.classeAgressividadeAmbiental}
                        onValueChange={(value: ClasseAgressividadeAmbiental) => handleClasseAgressividadeChange(value)}
                      >
                        <SelectTrigger id="classe-agressividade" className="h-10 w-full [&>span]:truncate">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I">Classe I</SelectItem>
                          <SelectItem value="II">Classe II</SelectItem>
                          <SelectItem value="III">Classe III</SelectItem>
                          <SelectItem value="IV">Classe IV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cobrimento-normativo">Cobrimento normativo da viga (cm)</Label>
                      <Input
                        id="cobrimento-normativo"
                        type="number"
                        value={criteriosProjeto.cobrimentoNormativoCm}
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="origem-cobrimento">Origem do cobrimento nominal adotado</Label>
                      <Select
                        value={criteriosProjeto.origemCobrimento}
                        onValueChange={(value: 'norma' | 'usuario') => handleOrigemCobrimentoChange(value)}
                      >
                        <SelectTrigger id="origem-cobrimento" className="h-10 w-full [&>span]:truncate">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="norma">Seguir norma</SelectItem>
                          <SelectItem value="usuario">Definir manualmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cobrimento-adotado">Cobrimento nominal adotado (cm)</Label>
                      <Input
                        id="cobrimento-adotado"
                        type="number"
                        step="any"
                        value={criteriosProjeto.cobrimentoAdotadoCm}
                        disabled={criteriosProjeto.origemCobrimento === 'norma'}
                        onChange={(e) => handleCobrimentoAdotadoChange(e.target.valueAsNumber)}
                      />
                    </div>
                  </div>

                  <div className={`mt-5 rounded-2xl border p-4 ${statusVisual.container}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{statusVisual.titulo}</p>
                        <p className="mt-1 text-sm opacity-90">{statusVisual.descricao}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusVisual.badge}`}>
                        {criteriosProjeto.origemCobrimento === 'norma'
                          ? 'Verde'
                          : criteriosProjeto.cobrimentoAdotadoCm >= criteriosProjeto.cobrimentoNormativoCm
                            ? 'Amarelo'
                            : 'Vermelho'}
                      </span>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Materiais</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="classe-concreto">Tipo de concreto</Label>
                      <Select
                        value={criteriosProjeto.classeConcreto}
                        onValueChange={(value: ClasseConcreto) => updateCriteriosProjeto({ classeConcreto: value })}
                      >
                        <SelectTrigger id="classe-concreto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES_CONCRETO.map((classe) => (
                            <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="peso-concreto">Peso específico do concreto (kN/m³)</Label>
                      <Input
                        id="peso-concreto"
                        type="number"
                        step="any"
                        value={criteriosProjeto.pesoEspecificoConcreto}
                        onChange={(e) => !Number.isNaN(e.target.valueAsNumber) && updateCriteriosProjeto({ pesoEspecificoConcreto: e.target.valueAsNumber })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tipo-vergalhao">Vergalhão</Label>
                      <Select value={criteriosProjeto.tipoVergalhao} onValueChange={() => updateCriteriosProjeto({ tipoVergalhao: 'CA-50' })}>
                        <SelectTrigger id="tipo-vergalhao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA-50">CA-50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tipo-estribo">Estribo</Label>
                      <Select value={criteriosProjeto.tipoEstribo} onValueChange={() => updateCriteriosProjeto({ tipoEstribo: 'CA-60' })}>
                        <SelectTrigger id="tipo-estribo">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA-60">CA-60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </article>

                <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Dobramento dos ganchos longitudinais</h2>
                    </div>
                    <Link
                      href="/dashboard/normas/nbr6118/tabelas/9.1"
                      className="inline-flex min-w-[18rem] justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      Abrir NBR6118/2023 - tabela 9.1
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="tipo-gancho-longitudinal-tracao">{"Longitudinal de tra\u00e7\u00e3o"}</Label>
                      <Select
                        value={criteriosProjeto.tipoGanchoLongitudinalTracao}
                        onValueChange={(value: TipoGanchoArmadura) => updateCriteriosProjeto({ tipoGanchoLongitudinalTracao: value })}
                      >
                        <SelectTrigger id="tipo-gancho-longitudinal-tracao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPCOES_TIPO_GANCHO.map((opcao) => (
                            <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tipo-gancho-longitudinal-compressao">{"Longitudinal de compress\u00e3o"}</Label>
                      <Select
                        value={criteriosProjeto.tipoGanchoLongitudinalCompressao}
                        onValueChange={(value: TipoGanchoArmadura) => updateCriteriosProjeto({ tipoGanchoLongitudinalCompressao: value })}
                      >
                        <SelectTrigger id="tipo-gancho-longitudinal-compressao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPCOES_TIPO_GANCHO.map((opcao) => (
                            <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Dobramento dos ganchos dos estribos</h2>
                    </div>
                    <Link
                      href="/dashboard/normas/nbr6118/tabelas/9.2"
                      className="inline-flex min-w-[18rem] justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      Abrir NBR6118/2023 - tabela 9.2
                    </Link>
                  </div>

                  <div className="mt-5">
                    <Label htmlFor="tipo-gancho-estribo">Estribo</Label>
                    <Select
                      value={criteriosProjeto.tipoGanchoEstribo}
                      onValueChange={(value: TipoGanchoArmadura) => updateCriteriosProjeto({ tipoGanchoEstribo: value })}
                    >
                      <SelectTrigger id="tipo-gancho-estribo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_TIPO_GANCHO.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </article>
                <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Faixa de bitolas das armaduras</h2>
                      <p className="mt-1 text-sm text-slate-600">Selecione conjuntos de bitolas por papel da armadura para o dimensionamento.</p>
                    </div>
                    <Link
                      href="/dashboard/normas/nbr6118/tabelas/9.2"
                      className="inline-flex min-w-[18rem] justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      Referencias normativas
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="modo-selecao-bitolas">Modo de selecao das bitolas</Label>
                      <Select
                        value={criteriosProjeto.modoSelecaoBitolas}
                        onValueChange={(value: BeamRebarSelectionMode) => handleModoSelecaoBitolasChange(value)}
                      >
                        <SelectTrigger id="modo-selecao-bitolas">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPCOES_MODO_SELECAO_BITOLAS.map((opcao) => (
                            <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Resumo de selecao</p>
                      <p className="mt-2 text-sm text-slate-700">Bitolas unicas selecionadas: <span className="font-semibold text-slate-900">{totalBitolasUnicas}</span></p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    {BITOLA_ROLE_CONFIG.map((config) => {
                      const selected = getSelectedBitolasByField(config.field);

                      return (
                        <div key={config.field} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{config.label}</p>
                              <p className="mt-1 text-xs text-slate-600">
                                Selecionadas: {selected.length > 0 ? selected.join(', ') + ' mm' : 'Nenhuma'}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={criteriosProjeto.modoSelecaoBitolas === 'normative'}
                                onClick={() => handleSelecionarTodasBitolasNormativas(config.field, config.normative)}
                              >
                                Selecionar todas
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={criteriosProjeto.modoSelecaoBitolas === 'normative'}
                                onClick={() => handleLimparBitolas(config.field)}
                              >
                                Limpar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestaurarBitolasPadrao(config.field, config.normative)}
                              >
                                Restaurar padrao
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {config.normative.map((bitola) => {
                              const ativo = selected.includes(bitola);

                              return (
                                <Button
                                  key={`${config.field}-${bitola}`}
                                  type="button"
                                  size="sm"
                                  variant={ativo ? 'default' : 'outline'}
                                  disabled={criteriosProjeto.modoSelecaoBitolas === 'normative'}
                                  onClick={() => handleToggleBitola(config.field, bitola)}
                                  className="min-w-[6.5rem]"
                                >
                                  {bitola} mm
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
                <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Coeficientes parciais</h2>
                    </div>
                    <Link
                      href="/dashboard/normas/nbr6118/tabelas/12.1"
                      className="inline-flex min-w-[18rem] justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      Abrir NBR6118/2023 - tabela 12.1
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="gamma-c">γ<sub>c</sub></Label>
                      <Select
                        value={String(criteriosProjeto.gammaC)}
                        onValueChange={(value) => updateCriteriosProjeto({ gammaC: Number(value) })}
                      >
                        <SelectTrigger id="gamma-c">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPCOES_GAMMA_C.map((opcao) => (
                            <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gamma-s">γ<sub>s</sub></Label>
                      <Select
                        value={String(criteriosProjeto.gammaS)}
                        onValueChange={(value) => updateCriteriosProjeto({ gammaS: Number(value) })}
                      >
                        <SelectTrigger id="gamma-s">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPCOES_GAMMA_S.map((opcao) => (
                            <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gamma-f">γ<sub>f</sub></Label>
                      <Input
                        id="gamma-f"
                        type="number"
                        step="any"
                        value={criteriosProjeto.gammaF}
                        onChange={(e) => !Number.isNaN(e.target.valueAsNumber) && updateCriteriosProjeto({ gammaF: e.target.valueAsNumber })}
                      />
                    </div>
                  </div>
                </article>
              </div>

              <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Resumo dos critérios</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Critérios verdes</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-900">
                      {statusVisual.titulo === 'Conforme a norma' ? 1 : 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-amber-700">Critérios amarelos</p>
                    <p className="mt-2 text-3xl font-semibold text-amber-900">
                      {statusVisual.titulo === 'Definido pelo usuário' ? 1 : 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-red-700">Critérios vermelhos</p>
                    <p className="mt-2 text-3xl font-semibold text-red-900">
                      {statusVisual.titulo === 'Não conforme à norma' ? 1 : 0}
                    </p>
                  </div>
                </div>

                <div className={`mt-5 rounded-2xl border p-4 ${statusVisual.container}`}>
                  <p className="text-xs uppercase tracking-[0.14em] opacity-80">Situação atual</p>
                  <p className="mt-2 text-lg font-semibold">{statusVisual.titulo}</p>
                  <p className="mt-1 text-sm opacity-90">{statusVisual.descricao}</p>
                </div>

              </article>
            </section>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
