export interface Pilar {
  id: string;
  width: number;
  position: number;
}

export interface Viga {
  id: string;
  width: number;
  height: number;
  startPosition: number;
  endPosition: number;
  startPillarId?: string;
  endPillarId?: string;
}

export interface CarregamentoPontual {
  id: string;
  position: number;
  magnitude: number;
}

export type CategoriaCarregamentoDistribuido = 'g1' | 'g2' | 'q';

export interface CarregamentoDistribuido {
  id: string;
  startPosition: number;
  endPosition: number;
  magnitude: number;
  vigaId?: string;
  categoria: CategoriaCarregamentoDistribuido;
}

export type TipoDiagrama = 'esforcoCortante' | 'momentoFletor';
export type TipoModeloApoioIntermediario = 'segundoGenero' | 'engastado';

export type SelecaoDiagramaViga =
  | 'cortante-segundo-genero'
  | 'momento-segundo-genero'
  | 'cortante-engastado'
  | 'momento-engastado'
  | 'cortante-envoltoria'
  | 'momento-envoltoria'
  | 'momento-envoltoria-deslocada';

export type ModeloGovernante = string;

export interface EnvelopeDiagramPoint {
  x: number;
  valor: number;
  modeloGovernante: ModeloGovernante;
}

export interface EnvelopeSectionBranch {
  curvaId: string;
  valores: number[];
}

export interface EnvelopeSection {
  x: number;
  ramosPositivos: EnvelopeSectionBranch[];
  ramosNegativos: EnvelopeSectionBranch[];
  governantePositivo: ModeloGovernante | null;
  governanteNegativo: ModeloGovernante | null;
}

export interface MomentDecalagemView {
  al: number;
  criterio: "informado" | "simplificado_d" | "calculado_norma";
  envelopePositivaDeslocada: EnvelopeDiagramPoint[];
  envelopeNegativaDeslocada: EnvelopeDiagramPoint[];
  secoesDeslocadas: EnvelopeSection[];
}

export interface EnvelopeDiagramView {
  bases?: Array<{
    id: string;
    label: string;
    points: Array<{ x: number; valor: number }>;
  }>;
  baseSegundoGenero: EnvelopeDiagramPoint[];
  baseEngastado: EnvelopeDiagramPoint[];
  envelopePositiva: EnvelopeDiagramPoint[];
  envelopeNegativa: EnvelopeDiagramPoint[];
  secoes?: EnvelopeSection[];
  pontosDescontinuidade: number[];
  unit: string;
  displayFactor: number;
  decalagem?: MomentDecalagemView;
}

export interface ResultadosProcessamentoViga {
  segundoGenero: unknown | null;
  engastado: unknown | null;
}

export type ClasseAgressividadeAmbiental = 'I' | 'II' | 'III' | 'IV';
export type ClasseConcreto = 'C20' | 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50' | 'C55' | 'C60' | 'C65' | 'C70' | 'C75' | 'C80' | 'C85' | 'C90';
export type TipoVergalhao = 'CA-50';
export type TipoEstribo = 'CA-60';
export type TipoGanchoArmadura = 'semi-circular' | 'angulo-45' | 'angulo-reto';
export type OrigemCobrimento = 'norma' | 'usuario';
export type BeamRebarSelectionMode = 'normative' | 'custom' | 'hybrid';

export interface CriteriosProjetoViga {
  classeAgressividadeAmbiental: ClasseAgressividadeAmbiental;
  cobrimentoNormativoCm: number;
  cobrimentoAdotadoCm: number;
  origemCobrimento: OrigemCobrimento;
  classeConcreto: ClasseConcreto;
  tipoVergalhao: TipoVergalhao;
  tipoEstribo: TipoEstribo;
  tipoGanchoLongitudinalTracao: TipoGanchoArmadura;
  tipoGanchoLongitudinalCompressao: TipoGanchoArmadura;
  tipoGanchoEstribo: TipoGanchoArmadura;
  modoSelecaoBitolas: BeamRebarSelectionMode;
  bitolasLongitudinalTracaoMm: number[];
  bitolasLongitudinalCompressaoMm: number[];
  bitolasEstriboMm: number[];
  gammaC: number;
  gammaS: number;
  gammaF: number;
  pesoEspecificoConcreto: number;
}

export interface VigaConcretoArmadoState {
  criteriosProjeto: CriteriosProjetoViga;
  pilares: Pilar[];
  vigas: Viga[];
  carregamentosPontuais: CarregamentoPontual[];
  carregamentosDistribuidos: CarregamentoDistribuido[];
  resultadosProcessamento: ResultadosProcessamentoViga;
  mostrarDiagramas: boolean;
  selecaoDiagrama: SelecaoDiagramaViga;
}

export const COBRIMENTO_NOMINAL_VIGA_POR_CAA: Record<ClasseAgressividadeAmbiental, number> = {
  I: 2.5,
  II: 3,
  III: 4,
  IV: 5,
};


export const BITOLAS_NORMATIVAS_LONGITUDINAL_MM = [8, 10, 12.5, 16, 20, 22, 25, 32, 40] as const;
export const BITOLAS_NORMATIVAS_ESTRIBO_MM = [5, 6.3, 8, 10, 12.5] as const;
export const DEFAULT_CRITERIOS_PROJETO_VIGA: CriteriosProjetoViga = {
  classeAgressividadeAmbiental: 'II',
  cobrimentoNormativoCm: COBRIMENTO_NOMINAL_VIGA_POR_CAA.II,
  cobrimentoAdotadoCm: COBRIMENTO_NOMINAL_VIGA_POR_CAA.II,
  origemCobrimento: 'norma',
  classeConcreto: 'C30',
  tipoVergalhao: 'CA-50',
  tipoEstribo: 'CA-60',
  tipoGanchoLongitudinalTracao: 'semi-circular',
  tipoGanchoLongitudinalCompressao: 'semi-circular',
  tipoGanchoEstribo: 'angulo-45',
  modoSelecaoBitolas: 'hybrid',
  bitolasLongitudinalTracaoMm: [...BITOLAS_NORMATIVAS_LONGITUDINAL_MM],
  bitolasLongitudinalCompressaoMm: [...BITOLAS_NORMATIVAS_LONGITUDINAL_MM],
  bitolasEstriboMm: [...BITOLAS_NORMATIVAS_ESTRIBO_MM],
  gammaC: 1.4,
  gammaS: 1.15,
  gammaF: 1.4,
  pesoEspecificoConcreto: 25,
};

export const DEFAULT_PILARES_VIGA: Pilar[] = [
  { id: 'P1', width: 20, position: -160 },
  { id: 'P2', width: 20, position: 160 },
];

export const DEFAULT_VIGAS: Viga[] = [
  {
    id: 'V1',
    width: 20,
    height: 40,
    startPosition: -160,
    endPosition: 160,
    startPillarId: 'P1',
    endPillarId: 'P2',
  },
];

export const DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA: ResultadosProcessamentoViga = {
  segundoGenero: null,
  engastado: null,
};

export const DEFAULT_VIGA_CONCRETO_ARMADO_STATE: VigaConcretoArmadoState = {
  criteriosProjeto: DEFAULT_CRITERIOS_PROJETO_VIGA,
  pilares: DEFAULT_PILARES_VIGA,
  vigas: DEFAULT_VIGAS,
  carregamentosPontuais: [],
  carregamentosDistribuidos: [],
  resultadosProcessamento: DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA,
  mostrarDiagramas: false,
  selecaoDiagrama: 'cortante-segundo-genero',
};
