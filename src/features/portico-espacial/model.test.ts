import { describe, expect, it } from 'vitest';

import {
  buildFrame3DPorticoSnapshot,
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
});
