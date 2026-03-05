'use client';

import { useEffect, useMemo, useState } from 'react';
import { Beam2DViewer } from '@/components/user/molecules/beam-2d-viewer';
import { Beam3DViewer } from '@/components/user/molecules/beam-3d-viewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const pilares = [
  { id: 'P1', width: 20, position: -300 },
  { id: 'P2', width: 20, position: 0 },
  { id: 'P3', width: 20, position: 300 },
];

const vigas = [
  { id: 'V1', width: 20, height: 50, startPosition: -300, endPosition: 0, startPillarId: 'P1', endPillarId: 'P2' },
  { id: 'V2', width: 20, height: 50, startPosition: 0, endPosition: 300, startPillarId: 'P2', endPillarId: 'P3' },
  { id: 'V3', width: 20, height: 50, startPosition: 300, endPosition: 450, startPillarId: 'P3' },
];

const carregamentosPontuais = [
  { id: 'CP1', position: -120, magnitude: -22 },
  { id: 'CP2', position: 120, magnitude: -18 },
  { id: 'CP3', position: 390, magnitude: -14 },
];

const carregamentosDistribuidos = [
  { id: 'CD1', startPosition: -300, endPosition: 0, magnitude: -8, vigaId: 'V1' },
  { id: 'CD2', startPosition: 0, endPosition: 300, magnitude: -10, vigaId: 'V2' },
  { id: 'CD3', startPosition: 300, endPosition: 450, magnitude: -6, vigaId: 'V3' },
];

const resultadoProcessamento = {
  discretizacao: [
    {
      elementLabel: 'HERO_CASE',
      x: [-300, -240, -180, -120, -60, 0, 60, 120, 180, 240, 300, 360, 420, 450],
      shear: [28, 24, 19, 12, 6, -8, -15, -20, -18, -10, 9, 14, 8, 0],
      moment: [0, 28, 46, 38, 16, -24, -42, -50, -38, -16, 20, 34, 18, 0],
    },
  ],
};

export function HeroBeamMoment({ className = '' }: { className?: string }) {
  const [modoVisualizacao, setModoVisualizacao] = useState<'cargas' | 'cortante' | 'momento'>('momento');
  const [tipoVista, setTipoVista] = useState<'3d' | '2d'>('3d');

  useEffect(() => {
    const sequence: Array<'cargas' | 'cortante' | 'momento'> = ['cargas', 'cortante', 'momento'];
    const interval = window.setInterval(() => {
      setModoVisualizacao((prev) => {
        const index = sequence.indexOf(prev);
        const nextIndex = (index + 1) % sequence.length;
        return sequence[nextIndex];
      });
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  const exibirDiagramas = modoVisualizacao !== 'cargas';
  const diagramaAtivo = useMemo(() => {
    return modoVisualizacao === 'cortante' ? 'esforcoCortante' : 'momentoFletor';
  }, [modoVisualizacao]);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="md:flex-1">
          <Select
            value={modoVisualizacao}
            onValueChange={(value: 'cargas' | 'cortante' | 'momento') => setModoVisualizacao(value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cargas">Mostrar Cargas</SelectItem>
              <SelectItem value="cortante">Diagrama de Esforço Cortante</SelectItem>
              <SelectItem value="momento">Diagrama de Momento Fletor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:ml-auto md:w-[180px]">
          <Select
            value={tipoVista}
            onValueChange={(value: '3d' | '2d') => setTipoVista(value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione a vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3d">Vista 3D</SelectItem>
              <SelectItem value="2d">Vista 2D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tipoVista === '3d' ? (
        <Beam3DViewer
          pilares={pilares}
          vigas={vigas}
          carregamentosPontuais={carregamentosPontuais}
          carregamentosDistribuidos={carregamentosDistribuidos}
          exibirDiagramas={exibirDiagramas}
          diagramaAtivo={diagramaAtivo}
          resultadoProcessamento={resultadoProcessamento}
          showResetControl={false}
          autoRotate
          autoRotateSpeed={0.6}
          className="h-[420px] min-h-[420px]"
        />
      ) : (
        <div className="h-[420px] min-h-[420px] rounded-lg border border-border bg-muted/10 p-2 overflow-hidden">
          <Beam2DViewer
            pilares={pilares}
            vigas={vigas}
            carregamentosPontuais={carregamentosPontuais}
            carregamentosDistribuidos={carregamentosDistribuidos}
            exibirDiagramas={exibirDiagramas}
            diagramaAtivo={diagramaAtivo}
            resultadoProcessamento={resultadoProcessamento}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}
