import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_FRAME3D_VISUALIZATION_SETTINGS,
  auditFrame3DEditorState,
  auditFrame3DPorticoSnapshot,
  buildFrame3DPorticoSnapshot,
  loadFrame3DEditorState,
  loadFrame3DPorticoSnapshot,
  loadFrame3DVisualizationSettings,
  saveFrame3DEditorState,
  saveFrame3DPorticoSnapshot,
  saveFrame3DVisualizationSettings,
  type Frame3DElementInput,
  type Frame3DLoadInput,
  type Frame3DMaterialInput,
  type Frame3DNodeInput,
  type Frame3DSupportMap,
} from '@/features/portico-espacial/model';

describe('buildFrame3DPorticoSnapshot', () => {
  it('monta payload Frame3D com vinculos e cargas', () => {
    const nodes: Frame3DNodeInput[] = [
      { id: 'n1', x: '0', y: '0', z: '0' },
      { id: 'n2', x: '6', y: '0', z: '0' },
    ];

    const materials: Frame3DMaterialInput[] = [
      {
        id: 'm1',
        name: 'Concreto',
        E: '30000',
        G: '12000',
        A: '200',
        Iy: '8000',
        Iz: '12000',
        J: '16000',
      },
    ];

    const elements: Frame3DElementInput[] = [
      {
        id: 'e1',
        nodeI: 'n1',
        nodeJ: 'n2',
        materialId: 'm1',
      },
    ];

    const supports: Frame3DSupportMap = {
      n1: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
      n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
    };

    const loads: Frame3DLoadInput[] = [
      {
        id: 'ln1',
        type: 'nodal',
        nodeId: 'n2',
        fx: '0',
        fy: '-10',
        fz: '0',
        mx: '0',
        my: '0',
        mz: '0',
      },
      {
        id: 'ld1',
        type: 'distributed',
        elementId: 'e1',
        qy: '0',
        qz: '-5',
      },
    ];

    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Teste 3D',
      analysisType: 'static-linear',
      nodes,
      materials,
      elements,
      supports,
      loads,
      nStations: 50,
    });

    expect(snapshot.requestBody.nodes).toHaveLength(2);
    expect(snapshot.requestBody.elements).toHaveLength(1);
    expect(snapshot.requestBody.postProcessing.nStations).toBe(50);

    expect(snapshot.requestBody.nodes[0]?.prescribedDisplacements).toEqual({
      ux: 0,
      uy: 0,
      uz: 0,
      rx: 0,
      ry: 0,
      rz: 0,
    });

    expect(snapshot.requestBody.nodes[1]?.actions).toEqual({
      fy: -10000,
    });

    expect(snapshot.requestBody.elements[0]).toEqual(
      expect.objectContaining({
        E: 30000000000,
        G: 12000000000,
        A: 0.02,
        Iy: 0.00008,
        Iz: 0.00012,
        J: 0.00016,
        qz: -5000,
      }),
    );

    expect(snapshot.viewerModel.nodes).toHaveLength(2);
    expect(snapshot.viewerModel.elements).toHaveLength(1);
    expect(snapshot.viewerModel.nodalLoads).toEqual([
      expect.objectContaining({
        nodeId: 'n2',
        fy: -10,
      }),
    ]);
    expect(snapshot.viewerModel.distributedLoads).toEqual([
      expect.objectContaining({
        elementId: 'e1',
        qz: -5,
      }),
    ]);
  });

  it('audita resumo e consistencia entre input, viewer e solver', () => {
    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Auditoria 3D',
      analysisType: 'static-linear',
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '6', y: '0', z: '0' },
        { id: 'n3', x: '6', y: '0', z: '3' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
        {
          id: 'e2',
          nodeI: 'n2',
          nodeJ: 'n3',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        n3: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [
        {
          id: 'ln1',
          type: 'nodal',
          nodeId: 'n3',
          fx: '0',
          fy: '-10',
          fz: '0',
          mx: '0',
          my: '0',
          mz: '0',
        },
        {
          id: 'ld1',
          type: 'distributed',
          elementId: 'e1',
          qy: '0',
          qz: '-5',
        },
      ],
      nStations: 50,
    });

    expect(auditFrame3DPorticoSnapshot(snapshot)).toEqual({
      summary: {
        nodeCount: 3,
        elementCount: 2,
        materialCount: 1,
        supportedNodeCount: 1,
        restrainedDofCount: 3,
        nodalLoadEntryCount: 1,
        distributedLoadEntryCount: 1,
        activeNodalLoadNodeCount: 1,
        activeDistributedLoadElementCount: 1,
      },
      errors: [],
      warnings: [],
    });
  });

  it('sinaliza cargas nulas e entidades soltas na auditoria do editor', () => {
    const audit = auditFrame3DEditorState({
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '2', y: '0', z: '0' },
        { id: 'n3', x: '4', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
          E: '30000',
          G: '12000',
          A: '200',
          Iy: '8000',
          Iz: '12000',
          J: '16000',
        },
        {
          id: 'm2',
          name: 'Aco',
          E: '200000',
          G: '77000',
          A: '150',
          Iy: '5000',
          Iz: '5000',
          J: '8000',
        },
      ],
      elements: [
        {
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: false, ry: false, rz: false },
      },
      loads: [
        {
          id: 'ln1',
          type: 'nodal',
          nodeId: 'n2',
          fx: '0',
          fy: '0',
          fz: '0',
          mx: '0',
          my: '0',
          mz: '0',
        },
        {
          id: 'ld1',
          type: 'distributed',
          elementId: 'e1',
          qy: '0',
          qz: '0',
        },
      ],
    });

    expect(audit.summary).toEqual({
      nodeCount: 3,
      elementCount: 1,
      materialCount: 2,
      supportedNodeCount: 1,
      restrainedDofCount: 3,
      nodalLoadEntryCount: 1,
      distributedLoadEntryCount: 1,
      activeNodalLoadNodeCount: 0,
      activeDistributedLoadElementCount: 0,
    });
    expect(audit.errors).toEqual([]);
    expect(audit.warnings).toEqual([
      '1 material(is) ainda nao estao associados a nenhuma barra.',
      '1 no(s) ainda nao estao conectados a nenhuma barra.',
      'A carga nodal 1 tem intensidade nula e nao aparecera no desenho.',
      'A carga distribuida 2 tem intensidade nula e nao aparecera no desenho.',
    ]);
  });

  it('forca minimo de 20 estacoes', () => {
    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Min stations',
      analysisType: 'static-linear',
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
      nStations: 3,
    });

    expect(snapshot.nStations).toBe(20);
    expect(snapshot.requestBody.postProcessing.nStations).toBe(20);
  });

  it('normaliza restricoes rotacionais para rx, ry e rz juntos', () => {
    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Rotacoes normalizadas',
      analysisType: 'static-linear',
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: false, uz: true, rx: true, ry: false, rz: false },
      },
      loads: [],
      nStations: 20,
    });

    expect(snapshot.supports.n1).toEqual({
      ux: true,
      uy: false,
      uz: true,
      rx: true,
      ry: true,
      rz: true,
    });
    expect(snapshot.viewerModel.nodes[0]?.support).toEqual({
      ux: true,
      uy: false,
      uz: true,
      rx: true,
      ry: true,
      rz: true,
    });
  });

  it('falha quando nao houver nenhum apoio informado', () => {
    expect(() =>
      buildFrame3DPorticoSnapshot({
        caseName: 'Sem apoios',
        analysisType: 'static-linear',
        nodes: [
          { id: 'n1', x: '0', y: '0', z: '0' },
          { id: 'n2', x: '1', y: '0', z: '0' },
        ],
        materials: [
          {
            id: 'm1',
            name: 'Concreto',
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
            id: 'e1',
            nodeI: 'n1',
            nodeJ: 'n2',
            materialId: 'm1',
          },
        ],
        supports: {
          n1: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
          n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        },
        loads: [],
        nStations: 20,
      }),
    ).toThrow('Informe ao menos um apoio antes de processar o portico espacial.');
  });

  it('infere referenceVz compativel com LESM para barras horizontais e verticais', () => {
    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Reference Vz',
      analysisType: 'static-linear',
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '0', y: '0', z: '3' },
        { id: 'n3', x: '4', y: '0', z: '3' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
        {
          id: 'e2',
          nodeI: 'n2',
          nodeJ: 'n3',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        n3: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
      nStations: 20,
    });

    expect(snapshot.requestBody.elements[0]?.referenceVz).toEqual({ x: 0, y: -1, z: 0 });
    expect(snapshot.requestBody.elements[1]?.referenceVz).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('usa configuracao padrao de visualizacao quando nao houver preferencia salva', () => {
    window.localStorage.clear();

    expect(loadFrame3DVisualizationSettings()).toEqual(
      DEFAULT_FRAME3D_VISUALIZATION_SETTINGS,
    );
  });

  it('salva configuracao de visualizacao separando camera 3D e camera dos planos', () => {
    window.localStorage.clear();

    saveFrame3DVisualizationSettings({
      camera3dProjection: 'orthographic',
      planarProjection: 'perspective',
      loadSymbolSize: 'large',
      loadLabelSize: 'medium',
      loadColorMode: 'uniform',
    });

    expect(loadFrame3DVisualizationSettings()).toEqual({
      camera3dProjection: 'orthographic',
      planarProjection: 'perspective',
      loadSymbolSize: 'large',
      loadLabelSize: 'medium',
      loadColorMode: 'uniform',
    });
  });

  it('completa novos tamanhos de visualizacao ao ler configuracao antiga', () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'eng-solution:portico-espacial:visualizacao:v1',
      JSON.stringify({
        camera3dProjection: 'orthographic',
        planarProjection: 'perspective',
      }),
    );

    expect(loadFrame3DVisualizationSettings()).toEqual({
      camera3dProjection: 'orthographic',
      planarProjection: 'perspective',
      loadSymbolSize: 'medium',
      loadLabelSize: 'small',
      loadColorMode: 'by-value',
    });
  });

  it('salva o estado bruto do editor mesmo sem apoios', () => {
    window.localStorage.clear();

    saveFrame3DEditorState({
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
    });

    expect(loadFrame3DEditorState()).toEqual({
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
    });
  });

  it('reaproveita o ultimo snapshot valido como fallback do editor', () => {
    window.localStorage.clear();

    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Snapshot salvo',
      analysisType: 'static-linear',
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
      nStations: 20,
    });

    saveFrame3DPorticoSnapshot(snapshot);

    expect(loadFrame3DPorticoSnapshot()?.supports.n1).toEqual({
      ux: true,
      uy: true,
      uz: true,
      rx: true,
      ry: true,
      rz: true,
    });
    expect(loadFrame3DEditorState()?.supports.n1).toEqual({
      ux: true,
      uy: true,
      uz: true,
      rx: true,
      ry: true,
      rz: true,
    });
  });

  it('remove o snapshot antigo quando a quota impede salvar o estado do editor', () => {
    window.localStorage.clear();

    const snapshot = buildFrame3DPorticoSnapshot({
      caseName: 'Snapshot grande',
      analysisType: 'static-linear',
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
      nStations: 20,
    });

    saveFrame3DPorticoSnapshot(snapshot);

    const originalSetItem = Storage.prototype.setItem;
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    let failOnce = true;

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === 'eng-solution:portico-espacial:editor:v1' && failOnce) {
        failOnce = false;
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }

      return originalSetItem.call(this, key, value);
    });

    saveFrame3DEditorState({
      nodes: [
        { id: 'n1', x: '0', y: '0', z: '0' },
        { id: 'n2', x: '1', y: '0', z: '0' },
      ],
      materials: [
        {
          id: 'm1',
          name: 'Concreto',
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
          id: 'e1',
          nodeI: 'n1',
          nodeJ: 'n2',
          materialId: 'm1',
        },
      ],
      supports: {
        n1: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
        n2: { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false },
      },
      loads: [],
    });

    expect(removeItemSpy).toHaveBeenCalledWith('eng-solution:portico-espacial:v1');
    expect(loadFrame3DEditorState()?.supports.n1).toEqual({
      ux: false,
      uy: false,
      uz: false,
      rx: false,
      ry: false,
      rz: false,
    });

    setItemSpy.mockRestore();
    removeItemSpy.mockRestore();
  });
});
