'use client';

import { useEffect, useMemo, useState } from 'react';
import { Beam2DViewer } from '@/components/user/molecules/beam-2d-viewer';
import { Beam3DViewer } from '@/components/user/molecules/beam-3d-viewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const pilares = [
  { id: 'P1', width: 20, position: 0 },
  { id: 'P2', width: 20, position: 300 },
  { id: 'P3', width: 20, position: 600 },
];

const vigas = [
  { id: 'V1', width: 20, height: 50, startPosition: 0, endPosition: 300, startPillarId: 'P1', endPillarId: 'P2' },
  { id: 'V2', width: 20, height: 50, startPosition: 300, endPosition: 600, startPillarId: 'P2', endPillarId: 'P3' },
  { id: 'V3', width: 20, height: 50, startPosition: 600, endPosition: 750, startPillarId: 'P3' },
];

const carregamentosPontuais = [
  { id: 'CP1', position: 180, magnitude: -22 },
  { id: 'CP2', position: 420, magnitude: -18 },
  { id: 'CP3', position: 690, magnitude: -14 },
];

const carregamentosDistribuidos = [
  { id: 'CD1', startPosition: 0, endPosition: 300, magnitude: -8, vigaId: 'V1' },
  { id: 'CD2', startPosition: 300, endPosition: 600, magnitude: -10, vigaId: 'V2' },
  { id: 'CD3', startPosition: 600, endPosition: 750, magnitude: -6, vigaId: 'V3' },
];

const heroPayload = {
  pontosDiscretizacao: 120,
  diagramas: {
    esforcoCortante: true,
    momentoFletor: true,
    deslocamentoTransversal: false,
    rotacao: false,
  },
  elementos: [
    { label: 'E1', E: 210000, A: 30, I: 45000, q: -8, no_i: { label: 'N1', x: 0, y: 0, deslocamentos: { ux: 0, uy: 0 } }, no_j: { label: 'N2', x: 180, y: 0, acoes: { fy: -22 } } },
    { label: 'E2', E: 210000, A: 30, I: 45000, q: -8, no_i: { label: 'N2', x: 180, y: 0 }, no_j: { label: 'N3', x: 300, y: 0, deslocamentos: { uy: 0 } } },
    { label: 'E3', E: 210000, A: 30, I: 45000, q: -10, no_i: { label: 'N3', x: 300, y: 0 }, no_j: { label: 'N4', x: 420, y: 0, acoes: { fy: -18 } } },
    { label: 'E4', E: 210000, A: 30, I: 45000, q: -10, no_i: { label: 'N4', x: 420, y: 0 }, no_j: { label: 'N5', x: 600, y: 0, deslocamentos: { uy: 0 } } },
    { label: 'E5', E: 210000, A: 30, I: 45000, q: -6, no_i: { label: 'N5', x: 600, y: 0 }, no_j: { label: 'N6', x: 690, y: 0, acoes: { fy: -14 } } },
    { label: 'E6', E: 210000, A: 30, I: 45000, q: -6, no_i: { label: 'N6', x: 690, y: 0 }, no_j: { label: 'N7', x: 750, y: 0 } },
  ],
  sistemaDeUnidades: {
    distancia: 'cm',
    forca: 'kN',
    area: 'cm²',
    momentoDeInercia: 'cm^4',
    moduloElasticidade: 'MPa',
    cargaDistribuida: 'kN/m',
    momento: 'kN*m',
  },
};

export function HeroBeamMoment({ className = '' }: { className?: string }) {
  const [modoVisualizacao, setModoVisualizacao] = useState<'cargas' | 'cortante' | 'momento'>('momento');
  const [tipoVista, setTipoVista] = useState<'3d' | '2d'>('3d');
  const [resultadoProcessamento, setResultadoProcessamento] = useState<unknown | null>(null);

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

  useEffect(() => {
    const processarHero = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_ESTRUTURA_API_URL ?? 'http://localhost:3001';
      const apiPath = process.env.NEXT_PUBLIC_ESTRUTURA_API_PATH ?? '/beam2d/system';

      try {
        const response = await fetch(`${apiBaseUrl}${apiPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(heroPayload),
        });

        const responseText = await response.text();
        let responseData: unknown = responseText;

        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch {
          responseData = responseText;
        }

        if (!response.ok) {
          setResultadoProcessamento(null);
          return;
        }

        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
          const responseObject = responseData as Record<string, unknown>;
          const post = responseObject.posProcessamento;

          const enrichedResponse: Record<string, unknown> = {
            ...responseObject,
            elementos: responseObject.elementos ?? heroPayload.elementos,
          };

          if (post && typeof post === 'object' && !Array.isArray(post)) {
            enrichedResponse.posProcessamento = {
              ...(post as Record<string, unknown>),
              elementos: (post as Record<string, unknown>).elementos ?? responseObject.elementos ?? heroPayload.elementos,
            };
          }

          setResultadoProcessamento(enrichedResponse);
          return;
        }

        setResultadoProcessamento(responseData);
      } catch {
        setResultadoProcessamento(null);
      }
    };

    processarHero();
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
