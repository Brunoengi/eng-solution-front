'use client';

import { useEffect, useMemo, useState } from 'react';
import { useVigaConcretoArmado } from '@/features/viga-concreto-armado/context/viga-concreto-armado-provider';
import { DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA, type CarregamentoDistribuido, type CarregamentoPontual, type CategoriaCarregamentoDistribuido, type EnvelopeDiagramView, type Pilar, type SelecaoDiagramaViga, type TipoDiagrama, type TipoModeloApoioIntermediario, type Viga } from '@/features/viga-concreto-armado/types';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../components/user/molecules/sidebar';
import { Beam3DViewer } from '../../../components/user/molecules/beam-3d-viewer';
import { Beam2DViewer } from '../../../components/user/molecules/beam-2d-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeDistributedLoadQForApi, normalizePointLoadFyForApi } from '@/lib/beam2d-load-convention';
import {
  Layers,
  ArrowUpDown,
  Anchor,
  Square,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit,
  Link,
  Home,
} from 'lucide-react';
import * as styles from '@/styles/fns-styles';

const BEAM2D_SYSTEM_PROXY_PATH = '/api/beam2d/system';
const BEAM2D_ENVELOPE_PROXY_PATH = '/api/beam2d/envelope';

type OpcaoDiagrama = {
  value: SelecaoDiagramaViga;
  label: string;
};

type ClassificacaoApoios = {
  apoiosValidosOrdenados: number[];
  apoioExtremoEsquerdo: number | null;
  apoioExtremoDireito: number | null;
  apoiosIntermediarios: number[];
  estruturaEhVigaContinua: boolean;
};

type EnvelopeApiResponse = {
  modelos: Record<string, unknown>;
  envoltoria: {
    esforcoCortante: EnvelopeDiagramView;
    momentoFletor: EnvelopeDiagramView;
  };
};

const OPCOES_DIAGRAMA_CONTINUO: OpcaoDiagrama[] = [
  { value: 'cortante-segundo-genero', label: 'Esforço Cortante - Apoios de segundo gênero' },
  { value: 'momento-segundo-genero', label: 'Momento Fletor - Apoios de segundo gênero' },
  { value: 'cortante-engastado', label: 'Esforço Cortante - Apoios engastados' },
  { value: 'momento-engastado', label: 'Momento Fletor - Apoios engastados' },
  { value: 'cortante-envoltoria', label: 'Esforço Cortante - Envoltória' },
  { value: 'momento-envoltoria', label: 'Momento Fletor - Envoltória' },
  { value: 'momento-envoltoria-deslocada', label: 'Momento Fletor - Envoltória Deslocada (a_l = 30 cm)' },
];

const OPCOES_DIAGRAMA_SIMPLES: OpcaoDiagrama[] = [
  { value: 'cortante-segundo-genero', label: 'Esforço Cortante' },
  { value: 'momento-segundo-genero', label: 'Momento Fletor' },
];

function getTipoDiagramaFromSelecao(selecao: SelecaoDiagramaViga): TipoDiagrama {
  return selecao.startsWith('momento') ? 'momentoFletor' : 'esforcoCortante';
}

type ModeloDiagramaAtivo = TipoModeloApoioIntermediario | 'envoltoria';

function getModeloFromSelecao(selecao: SelecaoDiagramaViga): ModeloDiagramaAtivo {
  if (selecao.includes('envoltoria')) {
    return 'envoltoria';
  }

  return selecao.endsWith('engastado') ? 'engastado' : 'segundoGenero';
}

function isSelecaoEnvoltoriaDeslocada(selecao: SelecaoDiagramaViga): boolean {
  return selecao === 'momento-envoltoria-deslocada';
}

function getSelecaoSemEngaste(selecao: SelecaoDiagramaViga): SelecaoDiagramaViga {
  return selecao.startsWith('momento') ? 'momento-segundo-genero' : 'cortante-segundo-genero';
}

function getTituloDiagrama(selecao: SelecaoDiagramaViga, estruturaEhVigaContinua: boolean): string {
  const prefixo = getTipoDiagramaFromSelecao(selecao) === 'esforcoCortante'
    ? 'V(x) - Esforço Cortante'
    : 'M(x) - Momento Fletor';

  if (!estruturaEhVigaContinua) {
    return `Diagrama ativo: ${prefixo}`;
  }

  const modelo = getModeloFromSelecao(selecao);
  const sufixo = modelo === 'engastado'
    ? 'Apoios engastados'
    : isSelecaoEnvoltoriaDeslocada(selecao)
      ? 'Envoltória deslocada (a_l = 30 cm)'
      : modelo === 'envoltoria'
        ? 'Envoltória'
        : 'Apoios de segundo gênero';

  return `Diagrama ativo: ${prefixo} - ${sufixo}`;
}


function buildMomentEnvelopeDecalagemFallback(
  baseMomento: EnvelopeDiagramView,
  alCm = 30,
  toleranciaX = 1e-6,
): EnvelopeDiagramView | null {
  const secoesBase = (baseMomento.secoes ?? []).slice().sort((a, b) => a.x - b.x);
  if (secoesBase.length === 0) {
    return null;
  }

  const extremos = secoesBase.map((secao) => {
    const positivos = secao.ramosPositivos.flatMap((branch) => branch.valores);
    const negativos = secao.ramosNegativos.flatMap((branch) => branch.valores);

    return {
      x: secao.x,
      positivo: positivos.length > 0 ? Math.max(...positivos) : null,
      negativo: negativos.length > 0 ? Math.min(...negativos) : null,
      governantePositivo: secao.governantePositivo,
      governanteNegativo: secao.governanteNegativo,
    };
  });

  const envelopePositiva = [] as EnvelopeDiagramView['envelopePositiva'];
  const envelopeNegativa = [] as EnvelopeDiagramView['envelopeNegativa'];
  const secoesDeslocadas = [] as NonNullable<EnvelopeDiagramView['secoes']>;

  for (const alvo of extremos) {
    const janela = extremos.filter((candidato) => Math.abs(candidato.x - alvo.x) <= alCm + toleranciaX);

    const candidatoPositivo = janela
      .filter((candidato) => candidato.positivo !== null)
      .reduce<typeof janela[number] | null>((melhor, atual) => {
        if (!melhor) return atual;
        return (atual.positivo as number) > (melhor.positivo as number) ? atual : melhor;
      }, null);

    const candidatoNegativo = janela
      .filter((candidato) => candidato.negativo !== null)
      .reduce<typeof janela[number] | null>((melhor, atual) => {
        if (!melhor) return atual;
        return (atual.negativo as number) < (melhor.negativo as number) ? atual : melhor;
      }, null);

    if (candidatoPositivo && candidatoPositivo.positivo !== null) {
      envelopePositiva.push({
        x: alvo.x,
        valor: candidatoPositivo.positivo,
        modeloGovernante: candidatoPositivo.governantePositivo ?? '',
      });
    }

    if (candidatoNegativo && candidatoNegativo.negativo !== null) {
      envelopeNegativa.push({
        x: alvo.x,
        valor: candidatoNegativo.negativo,
        modeloGovernante: candidatoNegativo.governanteNegativo ?? '',
      });
    }

    secoesDeslocadas.push({
      x: alvo.x,
      ramosPositivos: candidatoPositivo && candidatoPositivo.positivo !== null
        ? [{ curvaId: 'decalagem', valores: [candidatoPositivo.positivo] }]
        : [],
      ramosNegativos: candidatoNegativo && candidatoNegativo.negativo !== null
        ? [{ curvaId: 'decalagem', valores: [candidatoNegativo.negativo] }]
        : [],
      governantePositivo: candidatoPositivo?.governantePositivo ?? null,
      governanteNegativo: candidatoNegativo?.governanteNegativo ?? null,
    });
  }

  return {
    ...baseMomento,
    envelopePositiva,
    envelopeNegativa,
    secoes: secoesDeslocadas,
  };
}

function classificarApoiosDaEstrutura(pilares: Pilar[], vigas: Viga[]): ClassificacaoApoios {
  const extremidadesVigas = vigas.flatMap((viga) => [viga.startPosition, viga.endPosition]);

  if (extremidadesVigas.length === 0) {
    return {
      apoiosValidosOrdenados: [],
      apoioExtremoEsquerdo: null,
      apoioExtremoDireito: null,
      apoiosIntermediarios: [],
      estruturaEhVigaContinua: false,
    };
  }

  const extremidadesSet = new Set(extremidadesVigas);
  const apoiosValidosOrdenados = Array.from(
    new Set(
      pilares
        .map((pilar) => pilar.position)
        .filter((position) => extremidadesSet.has(position))
    )
  ).sort((a, b) => a - b);

  const extremidadeEsquerda = Math.min(...extremidadesVigas);
  const extremidadeDireita = Math.max(...extremidadesVigas);
  const apoioExtremoEsquerdo = apoiosValidosOrdenados.includes(extremidadeEsquerda) ? extremidadeEsquerda : null;
  const apoioExtremoDireito = apoiosValidosOrdenados.includes(extremidadeDireita) ? extremidadeDireita : null;
  const apoiosIntermediarios = apoiosValidosOrdenados.filter(
    (position) => position > extremidadeEsquerda && position < extremidadeDireita
  );

  return {
    apoiosValidosOrdenados,
    apoioExtremoEsquerdo,
    apoioExtremoDireito,
    apoiosIntermediarios,
    estruturaEhVigaContinua: apoiosValidosOrdenados.length >= 3 && apoiosIntermediarios.length > 0,
  };
}

export default function FnsPage() {
  // Menu items - Seção Principal
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
        { label: 'Armadura de Suspensão', href: '/dashboard/viga-concreto-armado/suspensao', icon: Link },
        { label: 'Armadura de Ancoragem', href: '/dashboard/viga-concreto-armado/ancoragem', icon: Anchor },
        { label: 'Armadura de Pele', href: '/dashboard/viga-concreto-armado/pele', icon: Layers },
      ],
    },
  ];

  const exportItems: MenuItem[] = [
    { label: 'Memorial de Cálculo', href: '/dashboard/viga-concreto-armado/memorial-pdf', icon: FileText },
  ];

  const configItems: MenuItem[] = [
    { label: 'Critérios de Projeto', href: '/dashboard/viga-concreto-armado/criterios-projeto', icon: Settings },
  ];

  const {
    criteriosProjeto,
    pilares,
    setPilares,
    vigas,
    setVigas,
    carregamentosPontuais,
    setCarregamentosPontuais,
    carregamentosDistribuidos,
    setCarregamentosDistribuidos,
    resultadosProcessamento,
    setResultadosProcessamento,
    mostrarDiagramas,
    resetProcessamentoVisualizacao,
    setMostrarDiagramas,
    selecaoDiagrama,
    setSelecaoDiagrama,
    resetModulo,
  } = useVigaConcretoArmado();

  // Formulário para novo pilar
  const [newPilar, setNewPilar] = useState({ width: 20, position: 0 });
  const [newViga, setNewViga] = useState({ 
    width: 20, 
    height: 40, 
    length: 100, // comprimento do balanço
    direction: 'right' as 'left' | 'right' 
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCarregamentosOpen, setSheetCarregamentosOpen] = useState(false);
  const [carregamentoView, setCarregamentoView] = useState<'pontual' | 'distribuido'>('pontual');

  // Keys para resetar formulários (force re-render of uncontrolled inputs)
  const [pilarFormKey, setPilarFormKey] = useState(0);
  const [vigaFormKey, setVigaFormKey] = useState(0);
  const [cargaPontualFormKey, setCargaPontualFormKey] = useState(0);

  const [newCarregamentoPontual, setNewCarregamentoPontual] = useState({ position: 0, magnitude: -10 });
  const [newCarregamentoDistribuido, setNewCarregamentoDistribuido] = useState({
    vigaId: '',
    categoria: 'g1' as CategoriaCarregamentoDistribuido,
    magnitude: '-5',
  });

  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [processingStructureMessage, setProcessingStructureMessage] = useState<string | null>(null);
  const [successPopupMessage, setSuccessPopupMessage] = useState<string | null>(null);
  const [envelopeFromApi, setEnvelopeFromApi] = useState<EnvelopeApiResponse['envoltoria'] | null>(null);
  const [escalaYDiagrama, setEscalaYDiagrama] = useState(1);

  const categoriasCarregamentoDistribuido: CategoriaCarregamentoDistribuido[] = ['g1', 'g2', 'q'];

  const resumoCarregamentosDistribuidosPorViga = vigas.map((viga) => ({
    viga,
    valores: categoriasCarregamentoDistribuido.reduce((acc, categoria) => {
      acc[categoria] = carregamentosDistribuidos
        .filter((carga) => carga.vigaId === viga.id && carga.categoria === categoria)
        .reduce((total, carga) => total + carga.magnitude, 0);
      return acc;
    }, { g1: 0, g2: 0, q: 0 } as Record<CategoriaCarregamentoDistribuido, number>),
  }));

  const carregamentosDistribuidosVisualizacao = useMemo<CarregamentoDistribuido[]>(
    () =>
      vigas.flatMap((viga) => {
        const magnitude = carregamentosDistribuidos
          .filter((carga) => carga.vigaId === viga.id)
          .reduce((total, carga) => total + carga.magnitude, 0);

        if (magnitude === 0) {
          return [];
        }

        return [{
          id: `visualizacao-${viga.id}`,
          startPosition: viga.startPosition,
          endPosition: viga.endPosition,
          magnitude,
          vigaId: viga.id,
          categoria: 'q',
        }];
      }),
    [carregamentosDistribuidos, vigas]
  );

  const classificacaoApoios = useMemo(
    () => classificarApoiosDaEstrutura(pilares, vigas),
    [pilares, vigas]
  );
  const estruturaEhVigaContinua = classificacaoApoios.estruturaEhVigaContinua;
  const opcoesDiagrama = estruturaEhVigaContinua ? OPCOES_DIAGRAMA_CONTINUO : OPCOES_DIAGRAMA_SIMPLES;
  const selecaoDiagramaEfetiva = estruturaEhVigaContinua
    ? selecaoDiagrama
    : getSelecaoSemEngaste(selecaoDiagrama);
  const diagramaAtivo = getTipoDiagramaFromSelecao(selecaoDiagramaEfetiva);
  const modeloDiagramaAtivo = getModeloFromSelecao(selecaoDiagramaEfetiva);
  const envoltoriaDeslocadaAtiva = isSelecaoEnvoltoriaDeslocada(selecaoDiagramaEfetiva);
  const envelopeResult = useMemo(() => {
    if (!estruturaEhVigaContinua || modeloDiagramaAtivo !== 'envoltoria') {
      return { data: null, error: null as string | null };
    }

    if (envelopeFromApi) {
      if (diagramaAtivo === 'momentoFletor' && envoltoriaDeslocadaAtiva) {
        const baseMomento = envelopeFromApi.momentoFletor;
        const decalagem = baseMomento.decalagem;

        if (!decalagem) {
          const fallback = buildMomentEnvelopeDecalagemFallback(baseMomento, 30, 1e-6);
          if (fallback) {
            return { data: fallback, error: null as string | null };
          }

          return { data: null, error: 'Envoltoria deslocada indisponivel na resposta da API.' };
        }

        return {
          data: {
            ...baseMomento,
            envelopePositiva: decalagem.envelopePositivaDeslocada,
            envelopeNegativa: decalagem.envelopeNegativaDeslocada,
            secoes: decalagem.secoesDeslocadas,
          },
          error: null as string | null,
        };
      }

      return {
        data: diagramaAtivo === 'esforcoCortante'
          ? envelopeFromApi.esforcoCortante
          : envelopeFromApi.momentoFletor,
        error: null as string | null,
      };
    }

    if (!resultadosProcessamento.segundoGenero || !resultadosProcessamento.engastado) {
      return { data: null, error: 'Processe a estrutura para os dois modelos antes de usar a envoltória.' };
    }

    return { data: null, error: 'Envoltória da API indisponível para esta configuração.' };
  }, [diagramaAtivo, envelopeFromApi, envoltoriaDeslocadaAtiva, estruturaEhVigaContinua, modeloDiagramaAtivo, resultadosProcessamento.engastado, resultadosProcessamento.segundoGenero]);

  const resultadoProcessamentoAtivo = estruturaEhVigaContinua
    ? (modeloDiagramaAtivo === 'envoltoria' ? null : resultadosProcessamento[modeloDiagramaAtivo])
    : resultadosProcessamento.segundoGenero;
  const estruturaProcessada = estruturaEhVigaContinua
    ? Boolean(envelopeFromApi && resultadosProcessamento.segundoGenero && resultadosProcessamento.engastado)
    : Boolean(resultadosProcessamento.segundoGenero);
  const podeMostrarDiagramas = estruturaProcessada && !isProcessingStructure;

  // Função para verificar se há balanço bloqueando posição
  const getPilaresComBalanco = () => {
    const pilaresBloqueados = new Map<string, { direction: 'left' | 'right', vigaId: string }>();
    
    vigas.forEach(viga => {
      if (!viga.endPillarId && viga.startPillarId) {
        const isRight = viga.endPosition > viga.startPosition;
        pilaresBloqueados.set(viga.startPillarId, {
          direction: isRight ? 'right' : 'left',
          vigaId: viga.id
        });
      }
    });
    
    return pilaresBloqueados;
  };

  // Função para renumerar pilares e vigas da esquerda para a direita
  const renumerarPilares = (pilaresAtuais: Pilar[], vigasAtuais: Viga[]) => {
    // Ordenar pilares por posição (da esquerda para a direita)
    const pilaresOrdenados = [...pilaresAtuais].sort((a, b) => a.position - b.position);
    
    // Criar mapeamento de IDs antigos para novos dos pilares
    const mapeamentoPilaresIds = new Map<string, string>();
    pilaresOrdenados.forEach((pilar, index) => {
      const novoId = `P${index + 1}`;
      mapeamentoPilaresIds.set(pilar.id, novoId);
    });
    
    // Atualizar IDs dos pilares
    const pilaresRenumerados = pilaresOrdenados.map((pilar, index) => ({
      ...pilar,
      id: `P${index + 1}`
    }));
    
    // Atualizar referências dos pilares nas vigas
    const vigasComPilaresAtualizados = vigasAtuais.map(viga => ({
      ...viga,
      startPillarId: viga.startPillarId ? mapeamentoPilaresIds.get(viga.startPillarId) : undefined,
      endPillarId: viga.endPillarId ? mapeamentoPilaresIds.get(viga.endPillarId) : undefined
    }));

    // Ordenar vigas por posição inicial (startPosition) da esquerda para a direita
    const vigasOrdenadas = [...vigasComPilaresAtualizados].sort((a, b) => {
      const posA = Math.min(a.startPosition, a.endPosition);
      const posB = Math.min(b.startPosition, b.endPosition);
      return posA - posB;
    });

    // Criar mapeamento de IDs antigos para novos das vigas
    const mapeamentoVigasIds = new Map<string, string>();
    vigasOrdenadas.forEach((viga, index) => {
      const novoId = `V${index + 1}`;
      mapeamentoVigasIds.set(viga.id, novoId);
    });

    // Renumerar vigas
    const vigasRenumeradas = vigasOrdenadas.map((viga, index) => ({
      ...viga,
      id: `V${index + 1}`
    }));

    // Atualizar referências de vigaId nos carregamentos distribuídos
    setCarregamentosDistribuidos(prev => prev.map(carga => ({
      ...carga,
      vigaId: carga.vigaId && mapeamentoVigasIds.has(carga.vigaId) 
        ? mapeamentoVigasIds.get(carga.vigaId) 
        : carga.vigaId
    })));
    
    return { pilares: pilaresRenumerados, vigas: vigasRenumeradas };
  };

  // Função para adicionar pilar
  const addPilar = () => {
    // Verificar se há vigas em balanço que impedem a adição de pilar nesta posição
    const vigasBalanco = vigas.filter(v => !v.endPillarId);
    
    for (const viga of vigasBalanco) {
      const pilarOrigem = pilares.find(p => p.id === viga.startPillarId);
      if (pilarOrigem) {
        const isBalancoParaDireita = viga.endPosition > viga.startPosition;
        
        // Se o novo pilar está na direção do balanço
        if (isBalancoParaDireita && newPilar.position >= pilarOrigem.position) {
          alert(`Não é possível adicionar pilar à direita de ${pilarOrigem.id}. Existe uma viga em balanço (${viga.id}) partindo deste pilar. Exclua a viga em balanço primeiro.`);
          return;
        }
        if (!isBalancoParaDireita && newPilar.position <= pilarOrigem.position) {
          alert(`Não é possível adicionar pilar à esquerda de ${pilarOrigem.id}. Existe uma viga em balanço (${viga.id}) partindo deste pilar. Exclua a viga em balanço primeiro.`);
          return;
        }
      }
    }
    
    const newId = `P${pilares.length + 1}`;
    const newPilarObj: Pilar = {
      id: newId,
      width: newPilar.width,
      position: newPilar.position,
    };
    
    const pilaresTemp = [...pilares, newPilarObj];

    // Criar vigas automaticamente entre pilares adjacentes
    const sortedPilares = [...pilaresTemp].sort((a, b) => a.position - b.position);
    const index = sortedPilares.findIndex(p => p.id === newId);
    
    let vigasTemp = [...vigas];
    
    // Criar viga à esquerda se houver pilar anterior
    if (index > 0) {
      const prevPilar = sortedPilares[index - 1];
      const newVigaId = `V${vigasTemp.length + 1}`;
      const newVigaObj: Viga = {
        id: newVigaId,
        width: 20,
        height: 40,
        startPosition: prevPilar.position,
        endPosition: newPilarObj.position,
        startPillarId: prevPilar.id,
        endPillarId: newPilarObj.id,
      };
      vigasTemp = [...vigasTemp, newVigaObj];
    }
    
    // Criar viga à direita se houver pilar posterior
    if (index < sortedPilares.length - 1) {
      const nextPilar = sortedPilares[index + 1];
      const newVigaId = `V${vigasTemp.length + 1}`;
      const newVigaObj: Viga = {
        id: newVigaId,
        width: 20,
        height: 40,
        startPosition: newPilarObj.position,
        endPosition: nextPilar.position,
        startPillarId: newPilarObj.id,
        endPillarId: nextPilar.id,
      };
      vigasTemp = [...vigasTemp, newVigaObj];
    }

    // Renumerar pilares e atualizar vigas
    const { pilares: pilaresRenumerados, vigas: vigasAtualizadas } = renumerarPilares(pilaresTemp, vigasTemp);
    
    setPilares(pilaresRenumerados);
    setVigas(vigasAtualizadas);
    setNewPilar({ width: 20, position: 0 });
    setPilarFormKey(prev => prev + 1); // Reset form
  };

  // Função para adicionar viga em balanço
  const addViga = () => {
    // Encontrar o pilar da extremidade baseado na direção
    const sortedPilares = [...pilares].sort((a, b) => a.position - b.position);
    let pilarBase: Pilar | undefined;
    
    if (newViga.direction === 'left') {
      // Extremidade esquerda = primeiro pilar
      pilarBase = sortedPilares[0];
    } else {
      // Extremidade direita = último pilar
      pilarBase = sortedPilares[sortedPilares.length - 1];
    }
    
    if (!pilarBase) {
      alert('Não há pilares disponíveis. Adicione ao menos um pilar primeiro.');
      return;
    }
    
    // Verificar se já existe uma viga em balanço nesta extremidade
    const balancosExistentes = getPilaresComBalanco();
    const balancoExistente = balancosExistentes.get(pilarBase.id);
    
    if (balancoExistente) {
      alert(`Já existe uma viga em balanço (${balancoExistente.vigaId}) na extremidade ${newViga.direction === 'left' ? 'esquerda' : 'direita'}. Exclua a viga existente antes de adicionar outra.`);
      return;
    }
    
    // Calcular posições
    const startPosition = pilarBase.position;
    const endPosition = newViga.direction === 'left' 
      ? startPosition - newViga.length 
      : startPosition + newViga.length;
    
    const newVigaId = `V${vigas.length + 1}`;
    const newVigaObj: Viga = {
      id: newVigaId,
      width: newViga.width,
      height: newViga.height,
      startPosition: startPosition,
      endPosition: endPosition,
      startPillarId: pilarBase.id,
      // endPillarId fica undefined pois é balanço
    };
    
    const vigasTemp = [...vigas, newVigaObj];

    // Renumerar vigas após adicionar
    const { pilares: pilaresAtualizados, vigas: vigasRenumeradas } = renumerarPilares(pilares, vigasTemp);
    
    setPilares(pilaresAtualizados);
    setVigas(vigasRenumeradas);
    setNewViga({ width: 20, height: 40, length: 100, direction: 'right' });
    setVigaFormKey(prev => prev + 1); // Reset form
  };

  // Função para resetar toda a estrutura
  const resetAll = () => {
    if (window.confirm('Tem certeza que deseja remover tudo? Esta ação não pode ser desfeita.')) {
      resetModulo();
    }
  };

  // Função para remover pilar (apenas pilares de canto)
  const removePilar = (id: string) => {
    // Ordenar pilares por posição
    const pilaresOrdenados = [...pilares].sort((a, b) => a.position - b.position);
    
    // Verificar se é pilar de canto (primeiro ou último)
    const isCornerPillar = pilaresOrdenados[0].id === id || pilaresOrdenados[pilaresOrdenados.length - 1].id === id;
    
    if (!isCornerPillar) {
      alert('Apenas pilares de canto (extremidades) podem ser excluídos.');
      return;
    }
    
    // Encontrar vigas conectadas ao pilar
    const vigasParaRemover = vigas.filter(v => v.startPillarId === id || v.endPillarId === id);
    
    // Remover carregamentos das vigas que serão removidas
    vigasParaRemover.forEach(viga => {
      // Remover carregamentos distribuídos associados à viga
      setCarregamentosDistribuidos(prev => prev.filter(c => c.vigaId !== viga.id));
      
      // Remover carregamentos pontuais que estão dentro do intervalo da viga
      setCarregamentosPontuais(prev => prev.filter(c => {
        const vigaMin = Math.min(viga.startPosition, viga.endPosition);
        const vigaMax = Math.max(viga.startPosition, viga.endPosition);
        return c.position < vigaMin || c.position > vigaMax;
      }));
    });
    
    // Remover vigas conectadas
    const vigasRestantes = vigas.filter(v => v.startPillarId !== id && v.endPillarId !== id);
    
    // Remover pilar
    const pilaresRestantes = pilares.filter(p => p.id !== id);
    
    // Renumerar pilares e atualizar vigas
    const { pilares: pilaresRenumerados, vigas: vigasAtualizadas } = renumerarPilares(pilaresRestantes, vigasRestantes);
    
    setPilares(pilaresRenumerados);
    setVigas(vigasAtualizadas);
  };

  // Função para remover viga
  const removeViga = (id: string) => {
    const viga = vigas.find(v => v.id === id);
    if (!viga) return;
    
    // Remover carregamentos distribuídos associados à viga
    setCarregamentosDistribuidos(prev => prev.filter(c => c.vigaId !== id));
    
    // Remover carregamentos pontuais que estão dentro do intervalo da viga
    setCarregamentosPontuais(prev => prev.filter(c => {
      const vigaMin = Math.min(viga.startPosition, viga.endPosition);
      const vigaMax = Math.max(viga.startPosition, viga.endPosition);
      return c.position < vigaMin || c.position > vigaMax;
    }));
    
    // Remover viga
    const vigasRestantes = vigas.filter(v => v.id !== id);

    // Renumerar vigas após remoção
    const { pilares: pilaresAtualizados, vigas: vigasRenumeradas } = renumerarPilares(pilares, vigasRestantes);
    
    setPilares(pilaresAtualizados);
    setVigas(vigasRenumeradas);
  };

  // Funções para gerenciar carregamentos pontuais
  const addCarregamentoPontual = () => {
    // Validar se a posição está dentro da estrutura
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = Math.min(...allPositions);
    const maxPos = Math.max(...allPositions);
    
    if (newCarregamentoPontual.position < minPos || newCarregamentoPontual.position > maxPos) {
      alert(`A posição do carregamento deve estar entre ${minPos} cm e ${maxPos} cm`);
      return;
    }
    
    const newId = `CP${carregamentosPontuais.length + 1}`;
    const newCarregamento: CarregamentoPontual = {
      id: newId,
      position: newCarregamentoPontual.position,
      magnitude: newCarregamentoPontual.magnitude,
    };
    
    setCarregamentosPontuais([...carregamentosPontuais, newCarregamento]);
    setNewCarregamentoPontual({ position: 0, magnitude: -10 });
    setCargaPontualFormKey(prev => prev + 1); // Reset form
  };

  const removeCarregamentoPontual = (id: string) => {
    setCarregamentosPontuais(carregamentosPontuais.filter(c => c.id !== id));
  };

  // Funções para gerenciar carregamentos distribuídos
  const addCarregamentoDistribuido = () => {
    const viga = vigas.find((item) => item.id === newCarregamentoDistribuido.vigaId);

    if (!viga) {
      alert('Selecione uma viga válida');
      return;
    }

    const cargaExistente = carregamentosDistribuidos.find((carga) =>
      carga.vigaId === viga.id && carga.categoria === newCarregamentoDistribuido.categoria
    );

    const magnitude = Number(newCarregamentoDistribuido.magnitude);

    if (Number.isNaN(magnitude)) {
      alert('Informe uma magnitude válida');
      return;
    }

    if (magnitude === 0) {
      setCarregamentosDistribuidos(
        carregamentosDistribuidos.filter((carga) =>
          !(carga.vigaId === viga.id && carga.categoria === newCarregamentoDistribuido.categoria)
        )
      );
      return;
    }

    const newCarregamento: CarregamentoDistribuido = {
      id: cargaExistente?.id ?? `CD${carregamentosDistribuidos.length + 1}` ,
      startPosition: viga.startPosition,
      endPosition: viga.endPosition,
      magnitude,
      vigaId: viga.id,
      categoria: newCarregamentoDistribuido.categoria,
    };

    if (cargaExistente) {
      setCarregamentosDistribuidos(
        carregamentosDistribuidos.map((carga) =>
          carga.id === cargaExistente.id ? newCarregamento : carga
        )
      );
    } else {
      setCarregamentosDistribuidos([...carregamentosDistribuidos, newCarregamento]);
    }

    setNewCarregamentoDistribuido({
      vigaId: '',
      categoria: 'g1',
      magnitude: '-5',
    });
  };

  const processarEstrutura = async () => {
    setIsProcessingStructure(true);
    setProcessingStructureMessage(null);
    setResultadosProcessamento(DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA);
    setEnvelopeFromApi(null);

    const eModulo = Number(process.env.NEXT_PUBLIC_BEAM_E ?? 210_000);
    const nodePositions = Array.from(
      new Set(vigas.flatMap((viga) => [viga.startPosition, viga.endPosition]))
    ).sort((a, b) => a - b);

    const supportPositions = classificacaoApoios.apoiosValidosOrdenados;
    const supportPositionSet = new Set(supportPositions);
    const intermediateSupportSet = new Set(classificacaoApoios.apoiosIntermediarios);
    const firstSupportPosition = supportPositions[0];

    const buildNodeDataByPosition = (modelo: TipoModeloApoioIntermediario) => {
      const nodeDataByPosition = new Map<number, {
        label: string;
        acoes: { fx?: number; fy?: number; mz?: number };
        deslocamentos: { ux?: number; uy?: number; rz?: number };
      }>();

      nodePositions.forEach((position, index) => {
        const fy = carregamentosPontuais
          .filter((carga) => carga.position === position)
          .reduce((acc, carga) => acc + normalizePointLoadFyForApi(carga.magnitude), 0);

        const deslocamentos: { ux?: number; uy?: number; rz?: number } = {};
        if (supportPositionSet.has(position)) {
          deslocamentos.uy = 0;
        }
        if (position === firstSupportPosition) {
          deslocamentos.ux = 0;
        }
        if (modelo === 'engastado' && intermediateSupportSet.has(position)) {
          deslocamentos.rz = 0;
        }

        nodeDataByPosition.set(position, {
          label: 'N' + (index + 1),
          acoes: { fx: 0, fy, mz: 0 },
          deslocamentos,
        });
      });

      return nodeDataByPosition;
    };

    const buildElementosPayload = (nodeDataByPosition: Map<number, {
      label: string;
      acoes: { fx?: number; fy?: number; mz?: number };
      deslocamentos: { ux?: number; uy?: number; rz?: number };
    }>) => {
      return vigas
        .filter((viga) => viga.startPosition !== viga.endPosition)
        .map((viga) => {
          const b = viga.width;
          const h = viga.height;

          const cargasDistribuidasDaViga = carregamentosDistribuidos.filter((carga) =>
            carga.vigaId === viga.id
            || (
              carga.startPosition >= Math.min(viga.startPosition, viga.endPosition)
              && carga.endPosition <= Math.max(viga.startPosition, viga.endPosition)
            )
          );

          const q = cargasDistribuidasDaViga.reduce((acc, carga) => acc + normalizeDistributedLoadQForApi(carga.magnitude), 0);

          return {
            label: viga.id,
            E: eModulo,
            A: b * h,
            I: (b * Math.pow(h, 3)) / 12,
            q,
            no_i: {
              y: 0,
              x: viga.startPosition,
              label: nodeDataByPosition.get(viga.startPosition)?.label ?? 'Ni',
              acoes: nodeDataByPosition.get(viga.startPosition)?.acoes ?? {},
              deslocamentos: nodeDataByPosition.get(viga.startPosition)?.deslocamentos ?? {},
            },
            no_j: {
              y: 0,
              x: viga.endPosition,
              label: nodeDataByPosition.get(viga.endPosition)?.label ?? 'Nj',
              acoes: nodeDataByPosition.get(viga.endPosition)?.acoes ?? {},
              deslocamentos: nodeDataByPosition.get(viga.endPosition)?.deslocamentos ?? {},
            },
          };
        });
    };

    const diagramas = {
      esforcoCortante: true,
      momentoFletor: true,
      deslocamentoTransversal: false,
      rotacao: false,
    };

    const processarModelo = async (modelo: TipoModeloApoioIntermediario) => {
      const elementosPayload = buildElementosPayload(buildNodeDataByPosition(modelo));

      if (elementosPayload.length === 0) {
        throw new Error('Nenhuma viga válida para processar (comprimento zero).');
      }

      const response = await fetch(BEAM2D_SYSTEM_PROXY_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elementos: elementosPayload,
          passoDiscretizacao: 1,
          diagramas,
          sistemaDeUnidades: {
            distancia: 'cm',
            forca: 'kN',
            area: 'cm²',
            momentoDeInercia: 'cm^4',
            moduloElasticidade: 'MPa',
            cargaDistribuida: 'kN/m',
            momento: 'kN*m',
          },
        }),
      });

      const responseText = await response.text();
      let responseData: unknown = responseText;

      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        const errorDetails = typeof responseData === 'string'
          ? responseData
          : JSON.stringify(responseData);

        throw new Error('Falha ao processar estrutura (' + modelo + ') (HTTP ' + response.status + '): ' + errorDetails);
      }

      return responseData;
    };

    try {
      if (estruturaEhVigaContinua) {
        const response = await fetch(BEAM2D_ENVELOPE_PROXY_PATH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            curvas: [
              {
                id: 'segundoGenero',
                label: 'Apoios de segundo gênero',
                sistema: {
                  elementos: buildElementosPayload(buildNodeDataByPosition('segundoGenero')),
                  passoDiscretizacao: 1,
                  diagramas,
                  sistemaDeUnidades: {
                    distancia: 'cm',
                    forca: 'kN',
                    area: 'cm²',
                    momentoDeInercia: 'cm^4',
                    moduloElasticidade: 'MPa',
                    cargaDistribuida: 'kN/m',
                    momento: 'kN*m',
                  },
                },
              },
              {
                id: 'engastado',
                label: 'Apoios engastados',
                sistema: {
                  elementos: buildElementosPayload(buildNodeDataByPosition('engastado')),
                  passoDiscretizacao: 1,
                  diagramas,
                  sistemaDeUnidades: {
                    distancia: 'cm',
                    forca: 'kN',
                    area: 'cm²',
                    momentoDeInercia: 'cm^4',
                    moduloElasticidade: 'MPa',
                    cargaDistribuida: 'kN/m',
                    momento: 'kN*m',
                  },
                },
              },
            ],
            criteriosBitolas: {
              mode: criteriosProjeto.modoSelecaoBitolas,
              longitudinalTension: criteriosProjeto.bitolasLongitudinalTracaoMm,
              longitudinalCompression: criteriosProjeto.bitolasLongitudinalCompressaoMm,
              stirrup: criteriosProjeto.bitolasEstriboMm,
            },
          }),
        });

        const responseText = await response.text();
        let responseData: EnvelopeApiResponse | Record<string, unknown> | string | null = responseText;

        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch {
          responseData = responseText;
        }

        if (!response.ok) {
          const errorDetails = typeof responseData === 'string'
            ? responseData
            : JSON.stringify(responseData);

          throw new Error(`Falha ao processar envoltoria (HTTP ${response.status}): ${errorDetails}`);
        }

        if (!responseData || typeof responseData !== 'object' || !('modelos' in responseData) || !('envoltoria' in responseData)) {
          throw new Error('Falha ao processar envoltória no backend.');
        }

        const envelopeResponse = responseData as EnvelopeApiResponse;

        setResultadosProcessamento({
          ...DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA,
          segundoGenero: envelopeResponse.modelos.segundoGenero ?? null,
          engastado: envelopeResponse.modelos.engastado ?? null,
        });
        setEnvelopeFromApi(envelopeResponse.envoltoria);
      } else {
        const resultadoSegundoGenero = await processarModelo('segundoGenero');
        setResultadosProcessamento({
          ...DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA,
          segundoGenero: resultadoSegundoGenero,
        });
      }

      setProcessingStructureMessage(null);
      setSuccessPopupMessage(
        estruturaEhVigaContinua
          ? 'Sucesso: Estrutura e envoltória processadas, clique em mostrar diagramas para ver o DEC e DMF.'
          : 'Sucesso: Estrutura processada, clique em mostrar diagramas para ver o DEC e DMF.'
      );
    } catch (error) {
      setSuccessPopupMessage(null);
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao processar estrutura.';
      setProcessingStructureMessage(message);
    } finally {
      setIsProcessingStructure(false);
    }
  };

  const exibirDiagramas = mostrarDiagramas;
  const tituloVisualizacao = exibirDiagramas
    ? getTituloDiagrama(selecaoDiagramaEfetiva, estruturaEhVigaContinua)
    : 'Visualização da Viga';

  useEffect(() => {
    if (!estruturaEhVigaContinua) {
      const selecaoCompativel = getSelecaoSemEngaste(selecaoDiagrama);
      if (selecaoCompativel !== selecaoDiagrama) {
        setSelecaoDiagrama(selecaoCompativel);
      }
    }
  }, [estruturaEhVigaContinua, selecaoDiagrama, setSelecaoDiagrama]);

  useEffect(() => {
    resetProcessamentoVisualizacao();
    setEnvelopeFromApi(null);
  }, [carregamentosDistribuidos, carregamentosPontuais, pilares, resetProcessamentoVisualizacao, vigas]);

  useEffect(() => {
    if (!successPopupMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessPopupMessage(null);
    }, 3800);

    return () => window.clearTimeout(timer);
  }, [successPopupMessage]);

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex w-full">
        {/* Sidebar */}
        <AppSidebar 
          menuItems={menuItems}
          exportItems={exportItems}
          configItems={configItems} 
          menuGroupLabel="Seção Principal"
          exportGroupLabel="Exportar"
          configGroupLabel="Configurações"
        />

        {/* Conteúdo principal */}
        <div className={styles.mainContentStyles.container}>
          {/* Header */}
          <div className={styles.headerStyles.container}>
            <div className={styles.headerStyles.wrapper}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className={styles.headerStyles.title + ' ' + styles.fontSizesResponsive.pageTitle}>
                  Dimensionamento de Vigas (FNS)
                </h1>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button onClick={processarEstrutura} disabled={isProcessingStructure}>
                      {isProcessingStructure ? 'Processando...' : 'Processar estrutura'}
                    </Button>
                    <Button
                      variant={mostrarDiagramas ? 'default' : 'outline'}
                      disabled={!podeMostrarDiagramas}
                      onClick={() => setMostrarDiagramas((prev) => !prev)}
                    >
                      {mostrarDiagramas ? 'Mostrar cargas' : 'Mostrar diagramas'}
                    </Button>
                  </div>
                </div>
              </div>
              {processingStructureMessage && (
                <p className="mt-2 text-sm text-red-700">{processingStructureMessage}</p>
              )}
              {envelopeResult.error && mostrarDiagramas && modeloDiagramaAtivo === 'envoltoria' && (
                <p className="mt-2 text-sm text-amber-700">{envelopeResult.error}</p>
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <main className="container mx-auto px-4 md:px-6 lg:px-8 h-[calc(100vh-120px)] flex items-center justify-center">
            <div className="w-full max-w-7xl">
              {/* Visualizador da Viga com Abas 2D/3D */}
              <Tabs defaultValue="3d" className="w-full">
                <div className={styles.cardStyles.base}>
                  <div className={`${styles.cardStyles.header} flex items-center justify-between`}>
                    <h3 className={styles.cardStyles.title}>{tituloVisualizacao}</h3>
                    <div className="flex items-center gap-2">
                      <TabsList className="grid grid-cols-2 h-8 w-auto">
                        <TabsTrigger value="3d" className="text-xs px-4">3D</TabsTrigger>
                        <TabsTrigger value="2d" className="text-xs px-4">2D</TabsTrigger>
                      </TabsList>
                      
                      {/* Botão para gerenciar elementos */}
                      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="h-4 w-4 mr-2" />
                            Gerenciar elementos
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Gerenciar Estrutura</SheetTitle>
                            <SheetDescription>
                              Adicione, edite ou remova pilares e vigas da estrutura
                            </SheetDescription>
                          </SheetHeader>
                          
                          {/* Botão Reset */}
                          <div className="mt-4">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={resetAll}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Resetar Tudo
                            </Button>
                          </div>
                          
                          <div className="mt-6 space-y-6">
                            {/* Seção Pilares */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Pilares</h4>
                              <div className="space-y-2 mb-4">
                                {pilares.map((pilar) => (
                                  <div key={pilar.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">{pilar.id}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {pilar.width} × {pilar.width} cm | Posição: {pilar.position} cm
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePilar(pilar.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Formulário adicionar pilar */}
                              <div key={pilarFormKey} className="border rounded-lg p-4 space-y-3">
                                <h5 className="text-xs font-semibold">Adicionar Pilar (Cria Viga Automaticamente)</h5>
                                <p className="text-xs text-muted-foreground">Ao adicionar um pilar, vigas serão criadas automaticamente entre pilares adjacentes</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor="pilar-width" className="text-xs">Largura (cm)</Label>
                                    <Input
                                      id="pilar-width"
                                      type="number"
                                      defaultValue={newPilar.width}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewPilar({ ...newPilar, width: val });
                                        }
                                      }}
                                      className="h-8 text-xs"
                                      step="any"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="pilar-position" className="text-xs">Posição X (cm)</Label>
                                    <Input
                                      id="pilar-position"
                                      type="number"
                                      defaultValue={newPilar.position}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewPilar({ ...newPilar, position: val });
                                        }
                                      }}
                                      className="h-8 text-xs"
                                      step="any"
                                    />
                                  </div>
                                </div>
                                <Button onClick={addPilar} size="sm" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Pilar
                                </Button>
                              </div>
                            </div>

                            {/* Seção Vigas */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Vigas</h4>
                              <div className="space-y-2 mb-4">
                                {vigas.map((viga) => (
                                  <div key={viga.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">{viga.id}</p>
                                      <p className="text-xs text-muted-foreground">
                                        b: {viga.width} cm, h: {viga.height} cm
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        De {viga.startPosition} até {viga.endPosition} cm
                                        {viga.startPillarId && viga.endPillarId && (
                                          <span> ({viga.startPillarId} → {viga.endPillarId})</span>
                                        )}
                                        {(!viga.startPillarId || !viga.endPillarId) && (
                                          <span className="text-orange-600"> (Balanço)</span>
                                        )}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeViga(viga.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Formulário adicionar viga em balanço */}
                              <div key={vigaFormKey} className="border rounded-lg p-4 space-y-3">
                                <h5 className="text-xs font-semibold">Adicionar Viga em Balanço</h5>
                                <p className="text-xs text-muted-foreground">Cria uma viga em balanço na extremidade esquerda ou direita</p>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor="viga-width" className="text-xs">Largura b (cm)</Label>
                                      <Input
                                        id="viga-width"
                                        type="number"
                                        defaultValue={newViga.width}
                                        onChange={(e) => {
                                          const val = e.target.valueAsNumber;
                                          if (!isNaN(val)) {
                                            setNewViga({ ...newViga, width: val });
                                          }
                                        }}
                                        className="h-8 text-xs"
                                        step="any"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="viga-height" className="text-xs">Altura h (cm)</Label>
                                      <Input
                                        id="viga-height"
                                        type="number"
                                        defaultValue={newViga.height}
                                        onChange={(e) => {
                                          const val = e.target.valueAsNumber;
                                          if (!isNaN(val)) {
                                            setNewViga({ ...newViga, height: val });
                                          }
                                        }}
                                        className="h-8 text-xs"
                                        step="any"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="viga-length" className="text-xs">Comprimento do Balanço (cm)</Label>
                                    <Input
                                      id="viga-length"
                                      type="number"
                                      defaultValue={newViga.length}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewViga({ ...newViga, length: val });
                                        }
                                      }}
                                      className="h-8 text-xs"
                                      step="any"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="viga-direction" className="text-xs">Extremidade</Label>
                                    <Select
                                      value={newViga.direction}
                                      onValueChange={(value: 'left' | 'right') => setNewViga({ ...newViga, direction: value })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="left" className="text-xs">Esquerda (bloqueará pilares à esquerda)</SelectItem>
                                        <SelectItem value="right" className="text-xs">Direita (bloqueará pilares à direita)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button onClick={addViga} size="sm" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Viga em Balanço
                                </Button>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                      
                      {/* Botão para gerenciar carregamentos */}
                      <Sheet open={sheetCarregamentosOpen} onOpenChange={setSheetCarregamentosOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Layers className="h-4 w-4 mr-2" />
                            Gerenciar carregamentos
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Gerenciar Carregamentos</SheetTitle>
                            <SheetDescription>
                              Adicione, edite ou remova carregamentos aplicados na estrutura
                            </SheetDescription>
                          </SheetHeader>

                          <div className="mt-6 space-y-6">
                            <div className="inline-flex w-fit rounded-md border border-border bg-muted/50 p-1">
                              <Button
                                type="button"
                                variant={carregamentoView === 'pontual' ? 'default' : 'ghost'}
                                className="h-7 px-3 text-xs"
                                onClick={() => setCarregamentoView('pontual')}
                              >
                                Carregamento Pontual
                              </Button>
                              <Button
                                type="button"
                                variant={carregamentoView === 'distribuido' ? 'default' : 'ghost'}
                                className="h-7 px-3 text-xs"
                                onClick={() => setCarregamentoView('distribuido')}
                              >
                                Carregamento Distribuído
                              </Button>
                            </div>

                            {carregamentoView === 'pontual' ? (
                              <div>
                                <div key={cargaPontualFormKey} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                  <h5 className="text-sm font-semibold text-slate-900">Adicionar Carregamento Pontual (kN)</h5>
                                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <div>
                                      <Label htmlFor="carga-pontual-position" className="text-xs">Posição X (cm)</Label>
                                      <Input
                                        id="carga-pontual-position"
                                        type="number"
                                        step="any"
                                        defaultValue={newCarregamentoPontual.position}
                                        onChange={(e) => {
                                          const val = e.target.valueAsNumber;
                                          if (!isNaN(val)) {
                                            setNewCarregamentoPontual({
                                              ...newCarregamentoPontual,
                                              position: val
                                            });
                                          }
                                        }}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="carga-pontual-magnitude" className="text-xs">Magnitude</Label>
                                      <Input
                                        id="carga-pontual-magnitude"
                                        type="number"
                                        step="any"
                                        defaultValue={newCarregamentoPontual.magnitude}
                                        onChange={(e) => {
                                          const val = e.target.valueAsNumber;
                                          if (!isNaN(val)) {
                                            setNewCarregamentoPontual({
                                              ...newCarregamentoPontual,
                                              magnitude: val
                                            });
                                          }
                                        }}
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                  <Button onClick={addCarregamentoPontual} size="sm" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Carregamento Pontual
                                  </Button>
                                </div>

                                <div className="mt-4 space-y-2">
                                  {carregamentosPontuais.map((carga) => (
                                    <div key={carga.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                      <div>
                                        <p className="text-sm font-medium">{carga.id}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Posição: {carga.position} cm | Magnitude: {carga.magnitude} kN
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeCarregamentoPontual(carga.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="overflow-hidden rounded-lg border border-border">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                      <tr className="border-b border-border">
                                        <th className="px-3 py-2 text-left font-semibold">Nome</th>
                                        <th className="px-3 py-2 text-left font-semibold">g1</th>
                                        <th className="px-3 py-2 text-left font-semibold">g2</th>
                                        <th className="px-3 py-2 text-left font-semibold">q</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {resumoCarregamentosDistribuidosPorViga.map(({ viga, valores }) => (
                                        <tr key={viga.id} className="border-b border-border last:border-b-0">
                                          <td className="px-3 py-2 font-medium">{viga.id}</td>
                                          <td className="px-3 py-2 text-muted-foreground">
                                            {valores.g1 !== 0 ? valores.g1 : '-'}
                                          </td>
                                          <td className="px-3 py-2 text-muted-foreground">
                                            {valores.g2 !== 0 ? valores.g2 : '-'}
                                          </td>
                                          <td className="px-3 py-2 text-muted-foreground">
                                            {valores.q !== 0 ? valores.q : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                  <h5 className="text-sm font-semibold text-slate-900">Adicionar Carregamento Distribuído</h5>
                                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                                    <div>
                                      <Label htmlFor="carga-dist-viga" className="text-xs">Selecionar Viga</Label>
                                      <Select
                                        value={newCarregamentoDistribuido.vigaId}
                                        onValueChange={(value) =>
                                          setNewCarregamentoDistribuido({
                                            ...newCarregamentoDistribuido,
                                            vigaId: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-8 w-full">
                                          <SelectValue placeholder="Selecione uma viga" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {vigas.map((viga) => (
                                            <SelectItem key={viga.id} value={viga.id}>
                                              {viga.id} ({viga.startPosition} cm a {viga.endPosition} cm)
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label htmlFor="carga-dist-categoria" className="text-xs">Carregamento</Label>
                                      <Select
                                        value={newCarregamentoDistribuido.categoria}
                                        onValueChange={(value: CategoriaCarregamentoDistribuido) =>
                                          setNewCarregamentoDistribuido({
                                            ...newCarregamentoDistribuido,
                                            categoria: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-8 w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="g1">g1</SelectItem>
                                          <SelectItem value="g2">g2</SelectItem>
                                          <SelectItem value="q">q</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label htmlFor="carga-dist-magnitude" className="text-xs">Magnitude</Label>
                                      <Input
                                        id="carga-dist-magnitude"
                                        type="number"
                                        step="any"
                                        value={newCarregamentoDistribuido.magnitude}
                                        onChange={(e) => {
                                          setNewCarregamentoDistribuido({
                                            ...newCarregamentoDistribuido,
                                            magnitude: e.target.value,
                                          });
                                        }}
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                  <Button onClick={addCarregamentoDistribuido} size="sm" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Salvar Carregamento Distribuído
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                  <div>
                    <TabsContent value="3d" className="!mt-0 data-[state=inactive]:hidden" forceMount>
                      <div className="w-full h-[60vh] bg-muted/20 rounded-lg relative flex items-center justify-center">
                        <Beam3DViewer 
                          pilares={pilares} 
                          vigas={vigas} 
                          carregamentosPontuais={exibirDiagramas ? [] : carregamentosPontuais}
                          carregamentosDistribuidos={exibirDiagramas ? [] : carregamentosDistribuidosVisualizacao}
                          exibirDiagramas={exibirDiagramas}
                          diagramaAtivo={diagramaAtivo}
                          escalaYDiagrama={escalaYDiagrama}
                          resultadoProcessamento={resultadoProcessamentoAtivo}
                          modoEnvoltoria={modeloDiagramaAtivo === 'envoltoria'}
                          envelopeView={envelopeResult.data}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="2d" className="!mt-0 data-[state=inactive]:hidden" forceMount>
                      <div className="w-full h-[60vh] bg-muted/10 rounded-lg overflow-hidden flex items-center justify-center">
                        <Beam2DViewer 
                          pilares={pilares} 
                          vigas={vigas}
                          carregamentosPontuais={exibirDiagramas ? [] : carregamentosPontuais}
                          carregamentosDistribuidos={exibirDiagramas ? [] : carregamentosDistribuidosVisualizacao}
                          exibirDiagramas={exibirDiagramas}
                          diagramaAtivo={diagramaAtivo}
                          escalaYDiagrama={escalaYDiagrama}
                          resultadoProcessamento={resultadoProcessamentoAtivo}
                          modoEnvoltoria={modeloDiagramaAtivo === 'envoltoria'}
                          envelopeView={envelopeResult.data}
                        />
                      </div>
                    </TabsContent>
                  </div>

                  <div className="border-t border-border bg-slate-100 dark:bg-slate-800 px-3 md:px-4 py-2 md:py-3 flex items-center">
                    <div className="flex w-full items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">Controles da visualização</span>
                      {mostrarDiagramas ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={selecaoDiagramaEfetiva}
                            onValueChange={(value) => setSelecaoDiagrama(value as SelecaoDiagramaViga)}
                          >
                            <SelectTrigger className="h-8 w-[320px] text-xs">
                              <SelectValue placeholder="Selecione o diagrama" />
                            </SelectTrigger>
                            <SelectContent>
                              {opcoesDiagrama.map((opcao) => (
                                <SelectItem key={opcao.value} value={opcao.value} className="text-xs">
                                  {opcao.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
                            <span className="text-xs text-muted-foreground">Escala Y</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => setEscalaYDiagrama((prev) => Math.max(0.2, Number((prev - 0.2).toFixed(2))))}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min={0.2}
                              max={8}
                              step={0.1}
                              value={escalaYDiagrama}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!Number.isFinite(val)) return;
                                setEscalaYDiagrama(Math.min(8, Math.max(0.2, val)));
                              }}
                              className="h-8 w-20 text-center text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => setEscalaYDiagrama((prev) => Math.min(8, Number((prev + 0.2).toFixed(2))))}
                            >
                              +
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => setEscalaYDiagrama(1)}
                            >
                              1x
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ative &quot;Mostrar diagramas&quot; para configurar diagrama e escala.</span>
                      )}
                    </div>
                  </div>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      
      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-4 z-40">
        <div className="container mx-auto">
          <p className="text-xs text-center text-muted-foreground">
            Os cálculos seguem as recomendações da NBR 6118:2023
          </p>
        </div>
      </footer>

      {successPopupMessage && (
        <div className="fixed bottom-16 right-4 z-50 max-w-md rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-md">
          <p className="text-sm font-medium text-emerald-900">{successPopupMessage}</p>
        </div>
      )}
    </SidebarProvider>
  );
}
