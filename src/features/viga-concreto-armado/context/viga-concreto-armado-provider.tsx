'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  DEFAULT_CRITERIOS_PROJETO_VIGA,
  DEFAULT_PILARES_VIGA,
  DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA,
  DEFAULT_VIGA_CONCRETO_ARMADO_STATE,
  DEFAULT_VIGAS,
  type CarregamentoDistribuido,
  type CarregamentoPontual,
  type CriteriosProjetoViga,
  type Pilar,
  type ResultadosProcessamentoViga,
  type SelecaoDiagramaViga,
  type Viga,
  type VigaConcretoArmadoState,
} from '../types';

const STORAGE_KEY = 'eng-solution:viga-concreto-armado:v1';
const listeners = new Set<() => void>();
let cachedSerializedState: string | null = null;
let cachedSnapshot: VigaConcretoArmadoState = DEFAULT_VIGA_CONCRETO_ARMADO_STATE;

type LegacyStoredState = Partial<VigaConcretoArmadoState> & {
  resultadoProcessamento?: unknown | null;
  diagramaAtivo?: 'esforcoCortante' | 'momentoFletor';
};

interface VigaConcretoArmadoContextValue extends VigaConcretoArmadoState {
  setCriteriosProjeto: Dispatch<SetStateAction<CriteriosProjetoViga>>;
  updateCriteriosProjeto: (patch: Partial<CriteriosProjetoViga>) => void;
  setPilares: Dispatch<SetStateAction<Pilar[]>>;
  setVigas: Dispatch<SetStateAction<Viga[]>>;
  setCarregamentosPontuais: Dispatch<SetStateAction<CarregamentoPontual[]>>;
  setCarregamentosDistribuidos: Dispatch<SetStateAction<CarregamentoDistribuido[]>>;
  setResultadosProcessamento: Dispatch<SetStateAction<ResultadosProcessamentoViga>>;
  setMostrarDiagramas: Dispatch<SetStateAction<boolean>>;
  setSelecaoDiagrama: Dispatch<SetStateAction<SelecaoDiagramaViga>>;
  resetProcessamentoVisualizacao: () => void;
  resetModulo: () => void;
}

const VigaConcretoArmadoContext = createContext<VigaConcretoArmadoContextValue | null>(null);

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window === 'undefined') {
    return () => {
      listeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedSerializedState = null;
      listener();
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function parseStoredState(serialized: string): VigaConcretoArmadoState {
  const parsed = JSON.parse(serialized) as LegacyStoredState;
  const vigas = parsed.vigas ?? DEFAULT_VIGAS;
  const carregamentosDistribuidos = (parsed.carregamentosDistribuidos ?? []).map((carga) => {
    const vigaId = carga.vigaId ?? vigas.find((viga) =>
      Math.min(viga.startPosition, viga.endPosition) === Math.min(carga.startPosition, carga.endPosition)
      && Math.max(viga.startPosition, viga.endPosition) === Math.max(carga.startPosition, carga.endPosition)
    )?.id;

    return {
      ...carga,
      vigaId,
      categoria: carga.categoria ?? 'q',
    };
  });

  const resultadosProcessamento = {
    ...DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA,
    ...(parsed.resultadosProcessamento ?? {}),
    segundoGenero: parsed.resultadosProcessamento?.segundoGenero ?? parsed.resultadoProcessamento ?? null,
    engastado: parsed.resultadosProcessamento?.engastado ?? null,
  };

  const selecaoDiagrama = parsed.selecaoDiagrama
    ?? (parsed.diagramaAtivo === 'momentoFletor' ? 'momento-segundo-genero' : 'cortante-segundo-genero');

  return {
    ...DEFAULT_VIGA_CONCRETO_ARMADO_STATE,
    ...parsed,
    criteriosProjeto: {
      ...DEFAULT_CRITERIOS_PROJETO_VIGA,
      ...parsed.criteriosProjeto,
    },
    pilares: parsed.pilares ?? DEFAULT_PILARES_VIGA,
    vigas,
    carregamentosPontuais: parsed.carregamentosPontuais ?? [],
    carregamentosDistribuidos,
    resultadosProcessamento,
    mostrarDiagramas: parsed.mostrarDiagramas ?? false,
    selecaoDiagrama,
  };
}

function getSnapshot() {
  if (typeof window === 'undefined') {
    return DEFAULT_VIGA_CONCRETO_ARMADO_STATE;
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY);

  if (!serialized) {
    cachedSerializedState = null;
    cachedSnapshot = DEFAULT_VIGA_CONCRETO_ARMADO_STATE;
    return cachedSnapshot;
  }

  if (serialized === cachedSerializedState) {
    return cachedSnapshot;
  }

  try {
    cachedSnapshot = parseStoredState(serialized);
    cachedSerializedState = serialized;
    return cachedSnapshot;
  } catch {
    cachedSerializedState = null;
    cachedSnapshot = DEFAULT_VIGA_CONCRETO_ARMADO_STATE;
    return cachedSnapshot;
  }
}

function getServerSnapshot() {
  return DEFAULT_VIGA_CONCRETO_ARMADO_STATE;
}

function writeState(nextState: VigaConcretoArmadoState) {
  if (typeof window === 'undefined') {
    return;
  }

  const serialized = JSON.stringify({
    version: 1,
    ...nextState,
  });

  if (serialized === cachedSerializedState) {
    return;
  }

  cachedSerializedState = serialized;
  cachedSnapshot = nextState;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  emitChange();
}

function resolveSetStateAction<T>(value: SetStateAction<T>, previous: T): T {
  return typeof value === 'function'
    ? (value as (prevState: T) => T)(previous)
    : value;
}

function updateState(updater: (currentState: VigaConcretoArmadoState) => VigaConcretoArmadoState) {
  const currentState = cachedSerializedState === null
    ? getSnapshot()
    : cachedSnapshot;

  writeState(updater(currentState));
}

export function VigaConcretoArmadoProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const actions = useMemo<Pick<VigaConcretoArmadoContextValue,
    | 'setCriteriosProjeto'
    | 'updateCriteriosProjeto'
    | 'setPilares'
    | 'setVigas'
    | 'setCarregamentosPontuais'
    | 'setCarregamentosDistribuidos'
    | 'setResultadosProcessamento'
    | 'setMostrarDiagramas'
    | 'setSelecaoDiagrama'
    | 'resetProcessamentoVisualizacao'
    | 'resetModulo'
  >>(() => ({
    setCriteriosProjeto: (value) => {
      updateState((currentState) => ({
        ...currentState,
        criteriosProjeto: resolveSetStateAction(value, currentState.criteriosProjeto),
      }));
    },
    updateCriteriosProjeto: (patch) => {
      updateState((currentState) => ({
        ...currentState,
        criteriosProjeto: {
          ...currentState.criteriosProjeto,
          ...patch,
        },
      }));
    },
    setPilares: (value) => {
      updateState((currentState) => ({
        ...currentState,
        pilares: resolveSetStateAction(value, currentState.pilares),
      }));
    },
    setVigas: (value) => {
      updateState((currentState) => ({
        ...currentState,
        vigas: resolveSetStateAction(value, currentState.vigas),
      }));
    },
    setCarregamentosPontuais: (value) => {
      updateState((currentState) => ({
        ...currentState,
        carregamentosPontuais: resolveSetStateAction(value, currentState.carregamentosPontuais),
      }));
    },
    setCarregamentosDistribuidos: (value) => {
      updateState((currentState) => ({
        ...currentState,
        carregamentosDistribuidos: resolveSetStateAction(value, currentState.carregamentosDistribuidos),
      }));
    },
    setResultadosProcessamento: (value) => {
      updateState((currentState) => ({
        ...currentState,
        resultadosProcessamento: resolveSetStateAction(value, currentState.resultadosProcessamento),
      }));
    },
    setMostrarDiagramas: (value) => {
      updateState((currentState) => ({
        ...currentState,
        mostrarDiagramas: resolveSetStateAction(value, currentState.mostrarDiagramas),
      }));
    },
    setSelecaoDiagrama: (value) => {
      updateState((currentState) => ({
        ...currentState,
        selecaoDiagrama: resolveSetStateAction(value, currentState.selecaoDiagrama),
      }));
    },
    resetProcessamentoVisualizacao: () => {
      updateState((currentState) => ({
        ...currentState,
        resultadosProcessamento: DEFAULT_RESULTADOS_PROCESSAMENTO_VIGA,
        mostrarDiagramas: false,
      }));
    },
    resetModulo: () => {
      writeState(DEFAULT_VIGA_CONCRETO_ARMADO_STATE);
    },
  }), []);

  const value = useMemo<VigaConcretoArmadoContextValue>(() => ({
    ...snapshot,
    ...actions,
  }), [actions, snapshot]);

  return (
    <VigaConcretoArmadoContext.Provider value={value}>
      {children}
    </VigaConcretoArmadoContext.Provider>
  );
}

export function useVigaConcretoArmado() {
  const context = useContext(VigaConcretoArmadoContext);

  if (!context) {
    throw new Error('useVigaConcretoArmado must be used within VigaConcretoArmadoProvider');
  }

  return context;
}
