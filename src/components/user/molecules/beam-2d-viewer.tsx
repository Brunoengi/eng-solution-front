'use client';

import { useRef, useEffect, useState } from 'react';

interface Pilar {
  id: string;
  width: number;
  position: number;
}

interface Viga {
  id: string;
  width: number;
  height: number;
  startPosition: number;
  endPosition: number;
  startPillarId?: string;
  endPillarId?: string;
}

interface CarregamentoPontual {
  id: string;
  position: number;
  magnitude: number;
}

interface CarregamentoDistribuido {
  id: string;
  startPosition: number;
  endPosition: number;
  magnitude: number;
  vigaId?: string;
}

interface Beam2DViewerProps {
  pilares?: Pilar[];
  vigas?: Viga[];
  carregamentosPontuais?: CarregamentoPontual[];
  carregamentosDistribuidos?: CarregamentoDistribuido[];
  className?: string;
}

export function Beam2DViewer({ 
  pilares = [],
  vigas = [],
  carregamentosPontuais = [],
  carregamentosDistribuidos = [],
  className = '' 
}: Beam2DViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setDimensions({ width, height: 300 });
        }
      }
    };

    // Initial update
    updateDimensions();
    
    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    
    // Use IntersectionObserver to detect when element becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Small delay to ensure container has dimensions
            setTimeout(updateDimensions, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Cálculos para posicionamento
  const padding = 80;
  const beamY = dimensions.height / 2;
  
  // Calcular limites da estrutura
  const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
  const minPos = allPositions.length > 0 ? Math.min(...allPositions) : -200;
  const maxPos = allPositions.length > 0 ? Math.max(...allPositions) : 200;
  const structureSpan = maxPos - minPos;
  
  // Escala para caber no viewport
  const totalSpan = dimensions.width - 2 * padding;
  const scale = structureSpan > 0 ? totalSpan / structureSpan : 1;
  
  // Função para converter posição do mundo para SVG
  const worldToSVG = (worldX: number) => {
    return padding + (worldX - minPos) * scale;
  };

  const supportSize = 30;

  // Paleta de cores distintas para carregamentos
  const colorPalette = [
    '#ff5722', // Vermelho-laranja
    '#2196f3', // Azul
    '#4caf50', // Verde
    '#ff9800', // Laranja
    '#9c27b0', // Roxo
    '#00bcd4', // Ciano
    '#ffeb3b', // Amarelo
    '#e91e63', // Rosa
    '#3f51b5', // Índigo
    '#009688', // Teal
    '#ff5252', // Vermelho
    '#448aff', // Azul claro
  ];

  const getColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
        style={{ minHeight: '300px' }}
      >
        {/* Definições para setas */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#666" />
          </marker>
        </defs>

        {/* Renderizar Vigas */}
        {vigas.map((viga) => {
          const vigaStartX = worldToSVG(viga.startPosition);
          const vigaEndX = worldToSVG(viga.endPosition);
          const vigaLength = Math.abs(vigaEndX - vigaStartX);
          const vigaCenterX = (vigaStartX + vigaEndX) / 2;
          
          return (
            <g key={viga.id}>
              {/* Viga (linha) */}
              <line
                x1={vigaStartX}
                y1={beamY}
                x2={vigaEndX}
                y2={beamY}
                stroke="#666"
                strokeWidth="3"
              />
              
              {/* Label da viga */}
              <text
                x={vigaCenterX}
                y={beamY - 10}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill="#333"
              >
                {viga.id}
              </text>
            </g>
          );
        })}

        {/* Renderizar apoios nos pilares */}
        {pilares.map((pilar) => {
          const pilarX = worldToSVG(pilar.position);
          
          return (
            <g key={`support-${pilar.id}`}>
              {/* Triângulo do apoio */}
              <polygon
                points={`
                  ${pilarX},${beamY}
                  ${pilarX - supportSize / 2},${beamY + supportSize}
                  ${pilarX + supportSize / 2},${beamY + supportSize}
                `}
                fill="#888"
                stroke="#333"
                strokeWidth="2"
              />
              
              {/* Label do pilar */}
              <text
                x={pilarX}
                y={beamY + supportSize + 20}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill="#333"
              >
                {pilar.id}
              </text>
            </g>
          );
        })}

        {/* Dimensões e Anotações - cotas de todas as vigas */}
        {vigas.map((viga, index) => {
          const vigaStartX = worldToSVG(viga.startPosition);
          const vigaEndX = worldToSVG(viga.endPosition);
          const vigaCenterX = (vigaStartX + vigaEndX) / 2;
          const vigaWorldLength = Math.abs(viga.endPosition - viga.startPosition);
          const dimensionY = beamY + 60; // Todas as cotas abaixo da viga
          
          return (
            <g key={`dim-${viga.id}`}>
              {/* Linhas de extensão */}
              <line
                x1={vigaStartX}
                y1={beamY + 5}
                x2={vigaStartX}
                y2={dimensionY}
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={vigaEndX}
                y1={beamY + 5}
                x2={vigaEndX}
                y2={dimensionY}
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              
              {/* Linha de cota com setas */}
              <line
                x1={vigaStartX}
                y1={dimensionY}
                x2={vigaEndX}
                y2={dimensionY}
                stroke="#333"
                strokeWidth="1.5"
              />
              
              {/* Setas nas extremidades */}
              <polygon
                points={`${vigaStartX},${dimensionY} ${vigaStartX + 6},${dimensionY - 3} ${vigaStartX + 6},${dimensionY + 3}`}
                fill="#333"
              />
              <polygon
                points={`${vigaEndX},${dimensionY} ${vigaEndX - 6},${dimensionY - 3} ${vigaEndX - 6},${dimensionY + 3}`}
                fill="#333"
              />
              
              {/* Texto com a distância */}
              <text
                x={vigaCenterX}
                y={dimensionY + 15}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
                fontWeight="600"
              >
                {vigaWorldLength} cm
              </text>
            </g>
          );
        })}

        {/* Renderizar Carregamentos Pontuais */}
        {carregamentosPontuais.map((carga, index) => {
          const cargaX = worldToSVG(carga.position);
          const arrowLength = 50; // Maior que distribuído
          const isDown = carga.magnitude < 0;
          const arrowStartY = isDown ? beamY - arrowLength : beamY + arrowLength;
          const arrowEndY = isDown ? beamY - 5 : beamY + 5;
          const color = getColor(index);
          
          return (
            <g key={carga.id}>
              {/* Seta do carregamento */}
              <line
                x1={cargaX}
                y1={arrowStartY}
                x2={cargaX}
                y2={arrowEndY}
                stroke={color}
                strokeWidth="3"
              />
              {/* Ponta da seta */}
              <polygon
                points={isDown 
                  ? `${cargaX},${arrowEndY} ${cargaX - 5},${arrowEndY - 8} ${cargaX + 5},${arrowEndY - 8}`
                  : `${cargaX},${arrowEndY} ${cargaX - 5},${arrowEndY + 8} ${cargaX + 5},${arrowEndY + 8}`
                }
                fill={color}
              />
              {/* Label */}
              <text
                x={cargaX}
                y={arrowStartY - (isDown ? 12 : -12)}
                textAnchor="middle"
                fontSize="11"
                fill={color}
                fontWeight="700"
              >
                {Math.abs(carga.magnitude)} kN
              </text>
            </g>
          );
        })}

        {/* Renderizar Carregamentos Distribuídos */}
        {carregamentosDistribuidos.map((carga, index) => {
          const cargaStartX = worldToSVG(carga.startPosition);
          const cargaEndX = worldToSVG(carga.endPosition);
          const cargaLength = Math.abs(cargaEndX - cargaStartX);
          const numArrows = Math.max(3, Math.floor(cargaLength / 40));
          const isDown = carga.magnitude < 0;
          const arrowStartY = isDown ? beamY - 25 : beamY + 25;
          const arrowEndY = isDown ? beamY - 5 : beamY + 5;
          const color = getColor(carregamentosPontuais.length + index);
          
          return (
            <g key={carga.id}>
              {/* Linha superior do carregamento distribuído */}
              <line
                x1={cargaStartX}
                y1={arrowStartY}
                x2={cargaEndX}
                y2={arrowStartY}
                stroke={color}
                strokeWidth="2"
              />
              
              {/* Setas distribuídas */}
              {Array.from({ length: numArrows }).map((_, i) => {
                const arrowX = cargaStartX + (cargaLength * i) / (numArrows - 1);
                return (
                  <g key={`arrow-${i}`}>
                    <line
                      x1={arrowX}
                      y1={arrowStartY}
                      x2={arrowX}
                      y2={arrowEndY}
                      stroke={color}
                      strokeWidth="2"
                    />
                    <polygon
                      points={isDown 
                        ? `${arrowX},${arrowEndY} ${arrowX - 3},${arrowEndY - 5} ${arrowX + 3},${arrowEndY - 5}`
                        : `${arrowX},${arrowEndY} ${arrowX - 3},${arrowEndY + 5} ${arrowX + 3},${arrowEndY + 5}`
                      }
                      fill={color}
                    />
                  </g>
                );
              })}
              
              {/* Label */}
              <text
                x={(cargaStartX + cargaEndX) / 2}
                y={arrowStartY - (isDown ? 8 : -8)}
                textAnchor="middle"
                fontSize="10"
                fill={color}
                fontWeight="600"
              >
                {Math.abs(carga.magnitude)} kN/m
              </text>
            </g>
          );
        })}

        {/* Sistema de coordenadas */}
        <g transform={`translate(${padding - 50}, ${beamY - 60})`}>
          {/* Eixo X */}
          <line x1="0" y1="20" x2="30" y2="20" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          <text x="35" y="24" fontSize="11" fill="#999">x</text>
          
          {/* Eixo Y */}
          <line x1="0" y1="20" x2="0" y2="-10" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          <text x="-5" y="-15" fontSize="11" fill="#999">y</text>
        </g>
      </svg>
    </div>
  );
}
