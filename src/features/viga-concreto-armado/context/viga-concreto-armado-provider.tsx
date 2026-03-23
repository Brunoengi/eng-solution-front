'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  DEFAULT_CRITERIOS_PROJETO_VIGA,
  DEFAULT_PILARES_VIGA,
  DEFAULT_VIGA_CONCRETO_ARMADO_STATE,
  DEFAULT_VIGAS,
  type CarregamentoDistribuido,
  type CarregamentoPontual,
  type CriteriosProjetoViga,
  type Pilar,
  type TipoDiagrama,
  type Viga,
  type VigaConcretoArmadoState,
} from '../types';

const STORAGE_KEY = 'eng-solution:viga-concreto-armado:v1';
const listeners = new Set<() => void>();
let cachedSerializedState: string | null = null;
let cachedSnapshot: VigaConcretoArmadoState = DEFAULT_VIGA_CONCRETO_ARMADO_STATE;

interface VigaConcretoArmadoContextValue extends VigaConcretoArmadoState {
  setCriteriosProjeto: Dispatch<SetStateAction<CriteriosProjetoViga>>;
  updateCriteriosProjeto: (patch: Partial<CriteriosProjetoViga>) => void;
  setPilares: Dispatch<SetStateAction<Pilar[]>>;
  setVigas: Dispatch<SetStateAction<Viga[]>>;
  setCarregamentosPontuais: Dispatch<SetStateAction<CarregamentoPontual[]>>;
  setCarregamentosDistribuidos: Dispatch<SetStateAction<CarregamentoDistribuido[]>>;
  setResultadoProcessamento: Dispatch<SetStateAction<unknown | null>>;
  setMostrarDiagramas: Dispatch<SetStateAction<boolean>>;
  setDiagramaAtivo: Dispatch<SetStateAction<TipoDiagrama>>;
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
  const parsed = JSON.parse(serialized) as Partial<VigaConcretoArmadoState>;
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
    resultadoProcessamento: parsed.resultadoProcessamento ?? null,
    mostrarDiagramas: parsed.mostrarDiagramas ?? false,
    diagramaAtivo: parsed.diagramaAtivo ?? 'esforcoCortante',
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

export function VigaConcretoArmadoProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<VigaConcretoArmadoContextValue>(() => ({
    ...snapshot,
    setCriteriosProjeto: (value) => {
      writeState({
        ...snapshot,
        criteriosProjeto: resolveSetStateAction(value, snapshot.criteriosProjeto),
      });
    },
    updateCriteriosProjeto: (patch) => {
      writeState({
        ...snapshot,
        criteriosProjeto: {
          ...snapshot.criteriosProjeto,
          ...patch,
        },
      });
    },
    setPilares: (value) => {
      writeState({
        ...snapshot,
        pilares: resolveSetStateAction(value, snapshot.pilares),
      });
    },
    setVigas: (value) => {
      writeState({
        ...snapshot,
        vigas: resolveSetStateAction(value, snapshot.vigas),
      });
    },
    setCarregamentosPontuais: (value) => {
      writeState({
        ...snapshot,
        carregamentosPontuais: resolveSetStateAction(value, snapshot.carregamentosPontuais),
      });
    },
    setCarregamentosDistribuidos: (value) => {
      writeState({
        ...snapshot,
        carregamentosDistribuidos: resolveSetStateAction(value, snapshot.carregamentosDistribuidos),
      });
    },
    setResultadoProcessamento: (value) => {
      writeState({
        ...snapshot,
        resultadoProcessamento: resolveSetStateAction(value, snapshot.resultadoProcessamento),
      });
    },
    setMostrarDiagramas: (value) => {
      writeState({
        ...snapshot,
        mostrarDiagramas: resolveSetStateAction(value, snapshot.mostrarDiagramas),
      });
    },
    setDiagramaAtivo: (value) => {
      writeState({
        ...snapshot,
        diagramaAtivo: resolveSetStateAction(value, snapshot.diagramaAtivo),
      });
    },
    resetModulo: () => {
      writeState(DEFAULT_VIGA_CONCRETO_ARMADO_STATE);
    },
  }), [snapshot]);

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
