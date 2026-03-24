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
  | 'momento-engastado';

export interface ResultadosProcessamentoViga {
  segundoGenero: unknown | null;
  engastado: unknown | null;
}

export type ClasseAgressividadeAmbiental = 'I' | 'II' | 'III' | 'IV';
export type ClasseConcreto = 'C20' | 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50' | 'C55' | 'C60' | 'C65' | 'C70' | 'C75' | 'C80' | 'C85' | 'C90';
export type TipoVergalhao = 'CA-50';
export type TipoEstribo = 'CA-60';
export type OrigemCobrimento = 'norma' | 'usuario';

export interface CriteriosProjetoViga {
  classeAgressividadeAmbiental: ClasseAgressividadeAmbiental;
  cobrimentoNormativoCm: number;
  cobrimentoAdotadoCm: number;
  origemCobrimento: OrigemCobrimento;
  classeConcreto: ClasseConcreto;
  tipoVergalhao: TipoVergalhao;
  tipoEstribo: TipoEstribo;
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

export const DEFAULT_CRITERIOS_PROJETO_VIGA: CriteriosProjetoViga = {
  classeAgressividadeAmbiental: 'II',
  cobrimentoNormativoCm: COBRIMENTO_NOMINAL_VIGA_POR_CAA.II,
  cobrimentoAdotadoCm: COBRIMENTO_NOMINAL_VIGA_POR_CAA.II,
  origemCobrimento: 'norma',
  classeConcreto: 'C30',
  tipoVergalhao: 'CA-50',
  tipoEstribo: 'CA-60',
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
