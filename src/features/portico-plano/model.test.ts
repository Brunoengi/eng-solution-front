import { describe, expect, it } from 'vitest';

import {
  buildFramePorticoSnapshot,
  getReplicableNodeIdsForElements,
  replicateFrameGeometry,
  type FrameElementInput,
  type FrameLoadInput,
  type FrameMaterialInput,
  type FrameNodeInput,
  type FrameSupportMap,
} from '@/features/portico-plano/model';

describe('buildFramePorticoSnapshot', () => {
  it('monta payload, apoios e cargas agregadas para o frame2d', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '0', y: '4' },
      { id: 'n3', x: '6', y: '4' },
      { id: 'n4', x: '6', y: '0' },
    ];

    const materials: FrameMaterialInput[] = [
      { id: 'm1', name: 'Concreto', E: '21000', A: '1800', I: '540000' },
    ];

    const elements: FrameElementInput[] = [
      { id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
      { id: 'b2', nodeI: 'n2', nodeJ: 'n3', materialId: 'm1' },
      { id: 'b3', nodeI: 'n3', nodeJ: 'n4', materialId: 'm1' },
    ];

    const supports: FrameSupportMap = {
      n1: 'engaste',
      n2: 'livre',
      n3: 'livre',
      n4: 'articulado',
    };

    const loads: FrameLoadInput[] = [
      { id: 'l1', type: 'nodal', nodeId: 'n2', fx: '30', fy: '0', mz: '0' },
      { id: 'l2', type: 'nodal', nodeId: 'n2', fx: '0', fy: '-10', mz: '3' },
      {
        id: 'l3',
        type: 'distributed',
        elementId: 'b2',
        coordinateSystem: 'global',
        qx: '0',
        qy: '-12',
      },
      {
        id: 'l4',
        type: 'distributed',
        elementId: 'b2',
        coordinateSystem: 'global',
        qx: '',
        qy: '-3',
      },
    ];

    const snapshot = buildFramePorticoSnapshot({
      caseName: 'Teste',
      analysisType: 'static-linear',
      nodes,
      materials,
      elements,
      supports,
      loads,
      nPointsPerElement: 40,
    });

    expect(snapshot.requestBody.nodes).toHaveLength(4);
    expect(snapshot.requestBody.elements).toHaveLength(3);

    const node2 = snapshot.requestBody.nodes.find((node) => node.label === 'N2');
    expect(node2?.actions).toEqual({ fx: 30, fy: -10, mz: 3 });

    const node1 = snapshot.requestBody.nodes.find((node) => node.label === 'N1');
    const node4 = snapshot.requestBody.nodes.find((node) => node.label === 'N4');
    expect(node1?.prescribedDisplacements).toEqual({ ux: 0, uy: 0, rz: 0 });
    expect(node4?.prescribedDisplacements).toEqual({ ux: 0, uy: 0 });

    const bar2 = snapshot.requestBody.elements.find((element) => element.label === 'B2');
    expect(bar2?.distributedLoad).toEqual({
      coordinateSystem: 'global',
      qy: -15,
    });
    expect(bar2?.E).toBe(21000000);
    expect(bar2?.A).toBeCloseTo(0.18);
    expect(bar2?.I).toBeCloseTo(0.0054);

    expect(snapshot.viewerModel.distributedLoads).toEqual([
      expect.objectContaining({
        elementId: 'b2',
        globalQx: 0,
        globalQy: -15,
        localQx: 0,
        localQy: -15,
      }),
    ]);
    expect(snapshot.materials).toEqual(materials);
  });

  it('converte carga distribuida local para global antes de montar o payload', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '4', y: '3' },
    ];

    const materials: FrameMaterialInput[] = [
      { id: 'm1', name: 'Aco', E: '21000', A: '1800', I: '540000' },
    ];

    const elements: FrameElementInput[] = [
      { id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
    ];

    const supports: FrameSupportMap = {
      n1: 'engaste',
      n2: 'livre',
    };

    const loads: FrameLoadInput[] = [
      {
        id: 'l1',
        type: 'distributed',
        elementId: 'b1',
        coordinateSystem: 'local',
        qx: '-6',
        qy: '-8',
      },
    ];

    const snapshot = buildFramePorticoSnapshot({
      caseName: 'Carga local',
      analysisType: 'static-linear',
      nodes,
      materials,
      elements,
      supports,
      loads,
      nPointsPerElement: 24,
    });

    expect(snapshot.requestBody.elements[0]?.distributedLoad?.coordinateSystem).toBe('global');
    expect(snapshot.requestBody.elements[0]?.distributedLoad?.qx ?? 0).toBeCloseTo(0, 10);
    expect(snapshot.requestBody.elements[0]?.distributedLoad?.qy ?? 0).toBeCloseTo(-10, 10);

    const viewerLoad = snapshot.viewerModel.distributedLoads[0];
    expect(viewerLoad?.globalQx ?? 0).toBeCloseTo(0, 10);
    expect(viewerLoad?.globalQy ?? 0).toBeCloseTo(-10, 10);
    expect(viewerLoad?.localQx ?? 0).toBeCloseTo(-6, 10);
    expect(viewerLoad?.localQy ?? 0).toBeCloseTo(-8, 10);
  });

  it('gera erro quando um valor numerico obrigatorio esta invalido', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '4', y: '0' },
    ];

    const materials: FrameMaterialInput[] = [
      { id: 'm1', name: 'Concreto', E: '', A: '1800', I: '540000' },
    ];

    const elements: FrameElementInput[] = [{ id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' }];

    const supports: FrameSupportMap = {
      n1: 'engaste',
      n2: 'livre',
    };

    expect(() =>
      buildFramePorticoSnapshot({
        caseName: 'Teste invalido',
        analysisType: 'static-linear',
        nodes,
        materials,
        elements,
        supports,
        loads: [],
        nPointsPerElement: 40,
      }),
    ).toThrow('E do material Concreto deve ser informado.');
  });

  it('replica um trecho conectado reutilizando material e mesclando com no existente', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '0', y: '4' },
      { id: 'n3', x: '6', y: '0' },
      { id: 'n4', x: '6', y: '4' },
    ];

    const elements: FrameElementInput[] = [{ id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' }];

    const supports: FrameSupportMap = {
      n1: 'engaste',
      n2: 'livre',
      n3: 'livre',
      n4: 'livre',
    };

    let nextId = 1;
    const result = replicateFrameGeometry({
      nodes,
      elements,
      supports,
      selectedElementIds: ['b1'],
      sourceReferenceNodeId: 'n1',
      destinationReferenceNodeId: 'n3',
      createId: () => `new-${nextId++}`,
    });

    expect(result.nodes).toHaveLength(4);
    expect(result.elements).toHaveLength(2);
    expect(result.elements[1]).toEqual({
      id: 'new-1',
      nodeI: 'n3',
      nodeJ: 'n4',
      materialId: 'm1',
    });
    expect(result.supports.n1).toBe('engaste');
    expect(result.supports.n3).toBe('livre');
  });

  it('retorna os nos envolvidos nas barras selecionadas', () => {
    const elements: FrameElementInput[] = [
      { id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
      { id: 'b2', nodeI: 'n2', nodeJ: 'n3', materialId: 'm1' },
      { id: 'b3', nodeI: 'n4', nodeJ: 'n5', materialId: 'm1' },
    ];

    expect(getReplicableNodeIdsForElements(elements, ['b2', 'b1'])).toEqual(['n1', 'n2', 'n3']);
  });

  it('rejeita selecao desconexa na replicacao', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '0', y: '4' },
      { id: 'n3', x: '6', y: '0' },
      { id: 'n4', x: '6', y: '4' },
    ];

    const elements: FrameElementInput[] = [
      { id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
      { id: 'b2', nodeI: 'n3', nodeJ: 'n4', materialId: 'm1' },
    ];

    expect(() =>
      replicateFrameGeometry({
        nodes,
        elements,
        supports: {},
        selectedElementIds: ['b1', 'b2'],
        sourceReferenceNodeId: 'n1',
        destinationReferenceNodeId: 'n3',
      }),
    ).toThrow('A replicacao exige um unico conjunto conectado de barras.');
  });

  it('rejeita no de referencia fora do trecho selecionado', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '0', y: '4' },
      { id: 'n3', x: '6', y: '0' },
    ];

    const elements: FrameElementInput[] = [{ id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' }];

    expect(() =>
      replicateFrameGeometry({
        nodes,
        elements,
        supports: {},
        selectedElementIds: ['b1'],
        sourceReferenceNodeId: 'n3',
        destinationReferenceNodeId: 'n2',
      }),
    ).toThrow('O no de referencia da copia deve pertencer ao trecho selecionado.');
  });

  it('rejeita barra duplicada apos replicacao', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '0', y: '4' },
      { id: 'n3', x: '6', y: '0' },
      { id: 'n4', x: '6', y: '4' },
    ];

    const elements: FrameElementInput[] = [
      { id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
      { id: 'b2', nodeI: 'n3', nodeJ: 'n4', materialId: 'm1' },
    ];

    expect(() =>
      replicateFrameGeometry({
        nodes,
        elements,
        supports: {},
        selectedElementIds: ['b1'],
        sourceReferenceNodeId: 'n1',
        destinationReferenceNodeId: 'n3',
      }),
    ).toThrow('A replicacao geraria uma barra duplicada em relacao a Barra 2.');
  });

  it('rejeita sobreposicao parcial apos replicacao', () => {
    const nodes: FrameNodeInput[] = [
      { id: 'n1', x: '0', y: '0' },
      { id: 'n2', x: '4', y: '0' },
      { id: 'n3', x: '5', y: '0' },
      { id: 'n4', x: '9', y: '0' },
      { id: 'n5', x: '2', y: '0' },
    ];

    const elements: FrameElementInput[] = [
      { id: 'b1', nodeI: 'n1', nodeJ: 'n2', materialId: 'm1' },
      { id: 'b2', nodeI: 'n3', nodeJ: 'n4', materialId: 'm1' },
    ];

    expect(() =>
      replicateFrameGeometry({
        nodes,
        elements,
        supports: {},
        selectedElementIds: ['b1'],
        sourceReferenceNodeId: 'n1',
        destinationReferenceNodeId: 'n5',
      }),
    ).toThrow('A replicacao geraria sobreposicao geometrica com Barra 1.');
  });
});
