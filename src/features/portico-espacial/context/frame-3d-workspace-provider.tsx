'use client';

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import {
  buildFrame3DPorticoSnapshot,
  createUnlockedSupport,
  loadFrame3DEditorState,
  saveFrame3DEditorState,
  type Frame3DEditorState,
  type Frame3DElementInput,
  type Frame3DLoadInput,
  type Frame3DMaterialInput,
  type Frame3DNodeInput,
  type Frame3DPorticoSnapshot,
  type Frame3DProjectionView,
  type Frame3DSupportMap,
  type Frame3DViewMode,
} from '@/features/portico-espacial/model';
import {
  getOrCreateProcessedAnalysisSessionKey,
  loadProcessedAnalysis,
  saveProcessedAnalysis,
} from '@/lib/client/processed-analysis-cache';

const FRAME3D_SYSTEM_PROXY_PATH = '/api/frame3d/system';
const FRAME3D_MODULE_KEY = 'portico-espacial';

type HeaderMode = 'visualizar' | 'modificar';

interface Frame3DWorkspaceContextValue {
  nodes: Frame3DNodeInput[];
  materials: Frame3DMaterialInput[];
  elements: Frame3DElementInput[];
  supports: Frame3DSupportMap;
  loads: Frame3DLoadInput[];
  activeExampleId: string | null;
  headerMode: HeaderMode;
  projection: Frame3DProjectionView;
  viewMode: Frame3DViewMode;
  responseScale: number;
  draftSnapshot: Frame3DPorticoSnapshot | null;
  draftErrorMessage: string | null;
  processedSnapshot: Frame3DPorticoSnapshot | null;
  processedSignature: string | null;
  processedAt: string | null;
  viewerSnapshot: Frame3DPorticoSnapshot | null;
  processedSnapshotIsCurrent: boolean;
  isProcessingStructure: boolean;
  processingMessage: string | null;
  setNodes: Dispatch<SetStateAction<Frame3DNodeInput[]>>;
  setMaterials: Dispatch<SetStateAction<Frame3DMaterialInput[]>>;
  setElements: Dispatch<SetStateAction<Frame3DElementInput[]>>;
  setSupports: Dispatch<SetStateAction<Frame3DSupportMap>>;
  setLoads: Dispatch<SetStateAction<Frame3DLoadInput[]>>;
  setActiveExampleId: Dispatch<SetStateAction<string | null>>;
  setHeaderMode: Dispatch<SetStateAction<HeaderMode>>;
  setProjection: Dispatch<SetStateAction<Frame3DProjectionView>>;
  setViewMode: Dispatch<SetStateAction<Frame3DViewMode>>;
  setResponseScale: Dispatch<SetStateAction<number>>;
  setProcessingMessage: Dispatch<SetStateAction<string | null>>;
  replaceEditorState: (state: Frame3DEditorState) => void;
  processStructure: () => Promise<Frame3DPorticoSnapshot | null>;
}

const Frame3DWorkspaceContext = createContext<Frame3DWorkspaceContextValue | null>(null);

function createDefaultState(): Frame3DEditorState {
  const n1 = 'default-n1';
  const n2 = 'default-n2';
  const m1 = 'default-m1';
  const e1 = 'default-e1';

  return {
    nodes: [
      { id: n1, x: '0', y: '0', z: '0' },
      { id: n2, x: '6', y: '0', z: '0' },
    ],
    materials: [
      {
        id: m1,
        name: 'Material 1',
        E: '30000',
        G: '12000',
        A: '200',
        Iy: '8000',
        Iz: '12000',
        J: '16000',
      },
    ],
    elements: [
      {
        id: e1,
        nodeI: n1,
        nodeJ: n2,
        materialId: m1,
      },
    ],
    supports: {
      [n1]: createUnlockedSupport(),
      [n2]: createUnlockedSupport(),
    },
    loads: [],
  };
}

function cloneEditorState(state: Frame3DEditorState): Frame3DEditorState {
  return {
    nodes: state.nodes.map((node) => ({ ...node })),
    materials: state.materials.map((material) => ({ ...material })),
    elements: state.elements.map((element) => ({ ...element })),
    supports: Object.fromEntries(
      Object.entries(state.supports).map(([nodeId, support]) => [nodeId, { ...support }]),
    ),
    loads: state.loads.map((load) => ({ ...load })),
  };
}

export function Frame3DWorkspaceProvider({ children }: { children: ReactNode }) {
  const initialEditorState = useMemo(() => createDefaultState(), []);
  const [nodes, setNodes] = useState<Frame3DNodeInput[]>(initialEditorState.nodes);
  const [materials, setMaterials] = useState<Frame3DMaterialInput[]>(initialEditorState.materials);
  const [elements, setElements] = useState<Frame3DElementInput[]>(initialEditorState.elements);
  const [supports, setSupports] = useState<Frame3DSupportMap>(initialEditorState.supports);
  const [loads, setLoads] = useState<Frame3DLoadInput[]>(initialEditorState.loads);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [headerMode, setHeaderMode] = useState<HeaderMode>('visualizar');
  const [projection, setProjection] = useState<Frame3DProjectionView>('3d');
  const [viewMode, setViewMode] = useState<Frame3DViewMode>('carregamentos');
  const [responseScale, setResponseScale] = useState(1);
  const [processedSnapshot, setProcessedSnapshot] = useState<Frame3DPorticoSnapshot | null>(null);
  const [processedSignature, setProcessedSignature] = useState<string | null>(null);
  const [processedAt, setProcessedAt] = useState<string | null>(null);
  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [hasLoadedPersistedState, setHasLoadedPersistedState] = useState(false);

  const caseName = 'Portico espacial principal';
  const analysisType = 'static-linear' as const;
  const nStations = 50;

  useEffect(() => {
    const storedState = loadFrame3DEditorState();
    if (storedState) {
      const next = cloneEditorState(storedState);
      setNodes(next.nodes);
      setMaterials(next.materials);
      setElements(next.elements);
      setSupports(next.supports);
      setLoads(next.loads);
    }

    setSessionKey(getOrCreateProcessedAnalysisSessionKey(FRAME3D_MODULE_KEY));
    setHasLoadedPersistedState(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPersistedState) {
      return;
    }

    saveFrame3DEditorState({
      nodes,
      materials,
      elements,
      supports,
      loads,
    });
  }, [elements, hasLoadedPersistedState, loads, materials, nodes, supports]);

  const draftState = useMemo(() => {
    try {
      return {
        snapshot: buildFrame3DPorticoSnapshot({
          caseName,
          analysisType,
          nodes,
          materials,
          elements,
          supports,
          loads,
          nStations,
        }),
        errorMessage: null,
      };
    } catch (error) {
      return {
        snapshot: null,
        errorMessage:
          error instanceof Error ? error.message : 'Revise os dados de entrada.',
      };
    }
  }, [analysisType, caseName, elements, loads, materials, nStations, nodes, supports]);

  const draftSnapshot = draftState.snapshot;
  const draftErrorMessage = draftState.errorMessage;

  const processedSnapshotIsCurrent =
    processedSignature !== null &&
    processedSignature === draftSnapshot?.signature &&
    Boolean(processedSnapshot?.result);

  const viewerSnapshot = processedSnapshotIsCurrent ? processedSnapshot : draftSnapshot;

  useEffect(() => {
    if (!draftSnapshot?.signature || !sessionKey) {
      return;
    }

    let cancelled = false;

    void loadProcessedAnalysis<Frame3DPorticoSnapshot['requestBody'], NonNullable<Frame3DPorticoSnapshot['result']>>({
      moduleKey: FRAME3D_MODULE_KEY,
      sessionKey,
      signature: draftSnapshot.signature,
    }).then((cached) => {
      if (cancelled || !cached || draftSnapshot.signature !== cached.signature) {
        return;
      }

      setProcessedSnapshot({
        ...draftSnapshot,
        result: cached.result,
        processedAt: cached.processedAt,
      });
      setProcessedSignature(cached.signature);
      setProcessedAt(cached.processedAt);
    });

    return () => {
      cancelled = true;
    };
  }, [draftSnapshot, sessionKey]);

  useEffect(() => {
    if (processingMessage !== 'Estrutura processada com sucesso.') {
      return;
    }

    if (processedSignature !== draftSnapshot?.signature) {
      setProcessingMessage(null);
    }
  }, [draftSnapshot?.signature, processedSignature, processingMessage]);

  const replaceEditorState = useCallback((state: Frame3DEditorState) => {
    const next = cloneEditorState(state);
    setNodes(next.nodes);
    setMaterials(next.materials);
    setElements(next.elements);
    setSupports(next.supports);
    setLoads(next.loads);
  }, []);

  const processStructure = useCallback(async () => {
    if (!draftSnapshot) {
      setProcessingMessage(
        draftErrorMessage ?? 'Revise os dados de entrada antes de processar.',
      );
      return null;
    }

    setIsProcessingStructure(true);
    setProcessingMessage(null);

    try {
      const response = await fetch(FRAME3D_SYSTEM_PROXY_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftSnapshot.requestBody),
      });

      const raw = await response.text();
      let parsed: unknown = raw;

      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = raw;
      }

      if (!response.ok) {
        const details =
          typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
        throw new Error(`Falha no processamento (HTTP ${response.status}): ${details}`);
      }

      const finalSnapshot: Frame3DPorticoSnapshot = {
        ...draftSnapshot,
        result: parsed as Frame3DPorticoSnapshot['result'],
        processedAt: new Date().toISOString(),
      };

      setProcessedSnapshot(finalSnapshot);
      setProcessedSignature(finalSnapshot.signature);
      setProcessedAt(finalSnapshot.processedAt);
      setProcessingMessage('Estrutura processada com sucesso.');

      if (sessionKey && finalSnapshot.result) {
        void saveProcessedAnalysis({
          moduleKey: FRAME3D_MODULE_KEY,
          sessionKey,
          signature: finalSnapshot.signature,
          requestBody: finalSnapshot.requestBody,
          result: finalSnapshot.result,
          processedAt: finalSnapshot.processedAt ?? new Date().toISOString(),
        });
      }

      return finalSnapshot;
    } catch (error) {
      setProcessingMessage(
        error instanceof Error ? error.message : 'Erro desconhecido ao processar.',
      );
      return null;
    } finally {
      setIsProcessingStructure(false);
    }
  }, [draftErrorMessage, draftSnapshot, sessionKey]);

  const value = useMemo<Frame3DWorkspaceContextValue>(() => ({
    nodes,
    materials,
    elements,
    supports,
    loads,
    activeExampleId,
    headerMode,
    projection,
    viewMode,
    responseScale,
    draftSnapshot,
    draftErrorMessage,
    processedSnapshot,
    processedSignature,
    processedAt,
    viewerSnapshot,
    processedSnapshotIsCurrent,
    isProcessingStructure,
    processingMessage,
    setNodes,
    setMaterials,
    setElements,
    setSupports,
    setLoads,
    setActiveExampleId,
    setHeaderMode,
    setProjection,
    setViewMode,
    setResponseScale,
    setProcessingMessage,
    replaceEditorState,
    processStructure,
  }), [
    activeExampleId,
    draftErrorMessage,
    draftSnapshot,
    elements,
    headerMode,
    isProcessingStructure,
    loads,
    materials,
    nodes,
    processedAt,
    processedSignature,
    processedSnapshot,
    processedSnapshotIsCurrent,
    processingMessage,
    processStructure,
    projection,
    replaceEditorState,
    responseScale,
    supports,
    viewerSnapshot,
    viewMode,
  ]);

  return (
    <Frame3DWorkspaceContext.Provider value={value}>
      {children}
    </Frame3DWorkspaceContext.Provider>
  );
}

export function useFrame3DWorkspace() {
  const context = useContext(Frame3DWorkspaceContext);

  if (!context) {
    throw new Error('useFrame3DWorkspace must be used within Frame3DWorkspaceProvider');
  }

  return context;
}
