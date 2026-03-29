import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Braces, DraftingCompass, Sigma } from 'lucide-react';

import { GridContainer } from '@/components/user/layout/grid-layout';
import { HeroBeamMoment } from '@/components/user/molecules/hero-beam-moment';
import { Button } from '@/components/ui/button';

const heroHighlights = [
  {
    icon: DraftingCompass,
    title: 'Modelagem com leitura objetiva',
    description: 'Organize geometria, apoios e carregamentos com mais clareza desde o início do estudo.',
  },
  {
    icon: Sigma,
    title: 'Resultados técnicos em evidência',
    description: 'Acompanhe diagramas, visualizações e memoriais com foco na interpretação estrutural.',
  },
  {
    icon: BookOpen,
    title: 'Normas e referências por perto',
    description: 'Consulte conteúdos técnicos sem sair do fluxo principal de análise e dimensionamento.',
  },
  {
    icon: Braces,
    title: 'Interface e integração no mesmo ambiente',
    description: 'Use os módulos prontos ou conecte os cálculos aos seus próprios fluxos de trabalho.',
  },
];

const trustPills = ['NBR 6118', 'Visualizações 2D e 3D', 'Memoriais automatizados', 'Fluxo para API'];

type MetaCard = {
  label: string;
  value: string;
  className: string;
  labelClassName: string;
};

type DemoVariant = {
  id: string;
  title: string;
  description: string;
  panelClassName: string;
  topGlowClassName: string;
  bottomGlowClassName: string;
  headerWrapClassName?: string;
  eyebrowClassName: string;
  titleClassName?: string;
  badgeClassName: string;
  viewerShellClassName: string;
  metaCards: MetaCard[];
};

const demoVariants: DemoVariant[] = [
  {
    id: '01',
    title: 'Azul técnico equilibrado',
    description: 'Base azul profunda com azul-claro nos brilhos e acentos frios nos metadados.',
    panelClassName:
      'border-[rgba(148,163,184,0.24)] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(16,49,76,0.92)_42%,rgba(14,116,144,0.82)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.26),transparent_58%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_70%)]',
    eyebrowClassName: 'text-[rgba(186,230,253,0.9)]',
    badgeClassName:
      'border-[rgba(186,230,253,0.18)] bg-[rgba(255,255,255,0.08)] text-[rgba(240,249,255,0.92)]',
    viewerShellClassName:
      'border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(239,246,255,0.94))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(96,165,250,0.18)] bg-[linear-gradient(180deg,rgba(37,99,235,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(103,232,249,0.18)] bg-[linear-gradient(180deg,rgba(8,145,178,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(207,250,254,0.92)]',
      },
    ],
  },
  {
    id: '02',
    title: 'Azul petróleo com teal',
    description: 'Mistura mais fechada, puxando o painel para um azul petróleo mais encorpado.',
    panelClassName:
      'border-[rgba(94,234,212,0.16)] bg-[linear-gradient(145deg,rgba(12,24,42,0.98),rgba(13,48,74,0.94)_46%,rgba(15,118,110,0.8)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.2),transparent_55%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(20,184,166,0.16),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(153,246,228,0.92)]',
    badgeClassName:
      'border-[rgba(153,246,228,0.18)] bg-[rgba(255,255,255,0.08)] text-[rgba(240,253,250,0.92)]',
    viewerShellClassName:
      'border-[rgba(204,251,241,0.16)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(236,253,245,0.9))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(45,212,191,0.18)] bg-[linear-gradient(180deg,rgba(15,118,110,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(153,246,228,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(103,232,249,0.18)] bg-[linear-gradient(180deg,rgba(8,145,178,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(207,250,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
    ],
  },
  {
    id: '03',
    title: 'Cobalto com azul gelo',
    description: 'Mais contraste e sensação de produto digital, sem sair da família visual da página.',
    panelClassName:
      'border-[rgba(147,197,253,0.18)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,64,175,0.92)_48%,rgba(29,78,216,0.76)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.24),transparent_40%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_70%)]',
    eyebrowClassName: 'text-[rgba(219,234,254,0.92)]',
    badgeClassName:
      'border-[rgba(191,219,254,0.18)] bg-[rgba(255,255,255,0.08)] text-[rgba(239,246,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(219,234,254,0.18)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(239,246,255,0.95))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(96,165,250,0.18)] bg-[linear-gradient(180deg,rgba(37,99,235,0.24),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.94)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(147,197,253,0.18)] bg-[linear-gradient(180deg,rgba(59,130,246,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(219,234,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,165,233,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(224,242,254,0.94)]',
      },
    ],
  },
  {
    id: '04',
    title: 'Ardósia azulada',
    description: 'Versão mais sóbria, com leitura mais corporativa e menos brilho aparente.',
    panelClassName:
      'border-[rgba(148,163,184,0.2)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96)_48%,rgba(51,65,85,0.9)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_56%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_40%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(71,85,105,0.2),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(226,232,240,0.92)]',
    badgeClassName:
      'border-[rgba(226,232,240,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(241,245,249,0.9)]',
    viewerShellClassName:
      'border-[rgba(226,232,240,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.95))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(148,163,184,0.18)] bg-[linear-gradient(180deg,rgba(51,65,85,0.28),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(226,232,240,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(96,165,250,0.16)] bg-[linear-gradient(180deg,rgba(30,64,175,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(125,211,252,0.14)] bg-[linear-gradient(180deg,rgba(14,116,144,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.9)]',
      },
    ],
  },
  {
    id: '05',
    title: 'Azul com sinal da marca',
    description: 'Mantém a base azul e usa um acento quente discreto para dialogar com o laranja da página.',
    panelClassName:
      'border-[rgba(148,163,184,0.22)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(16,49,76,0.92)_42%,rgba(30,64,175,0.78)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_58%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_70%)]',
    eyebrowClassName: 'text-[rgba(186,230,253,0.92)]',
    badgeClassName:
      'border-[rgba(251,191,36,0.18)] bg-[rgba(255,255,255,0.08)] text-[rgba(255,251,235,0.92)]',
    viewerShellClassName:
      'border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(239,246,255,0.94))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(254,240,138,0.94)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(96,165,250,0.18)] bg-[linear-gradient(180deg,rgba(37,99,235,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.92)]',
      },
    ],
  },
  {
    id: '06',
    title: 'Azul marinho refinado',
    description: 'Uma evolução mais contida do painel atual, com azul marinho dominante e transições mais limpas.',
    panelClassName:
      'border-[rgba(148,163,184,0.22)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(15,40,68,0.94)_44%,rgba(14,86,144,0.82)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(14,165,233,0.16),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(191,219,254,0.92)]',
    badgeClassName:
      'border-[rgba(191,219,254,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(239,246,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(239,246,255,0.95))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(96,165,250,0.18)] bg-[linear-gradient(180deg,rgba(29,78,216,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(103,232,249,0.16)] bg-[linear-gradient(180deg,rgba(6,182,212,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(207,250,254,0.92)]',
      },
    ],
  },
  {
    id: '07',
    title: 'Azul oceano suave',
    description: 'Mais luminosidade no corpo do painel, sem perder a profundidade escura do fundo.',
    panelClassName:
      'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(17,65,96,0.92)_46%,rgba(8,145,178,0.74)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.22),transparent_56%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(207,250,254,0.94)]',
    badgeClassName:
      'border-[rgba(207,250,254,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(236,254,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(207,250,254,0.16)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(236,254,255,0.9))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(103,232,249,0.18)] bg-[linear-gradient(180deg,rgba(8,145,178,0.24),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(207,250,254,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,165,233,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(224,242,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(96,165,250,0.18)] bg-[linear-gradient(180deg,rgba(59,130,246,0.2),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.92)]',
      },
    ],
  },
  {
    id: '08',
    title: 'Azul aço',
    description: 'Uma leitura mais técnica e sóbria, com menos brilho e mais sensação de software de engenharia.',
    panelClassName:
      'border-[rgba(148,163,184,0.2)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,58,86,0.95)_48%,rgba(51,83,114,0.88)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_56%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(100,116,139,0.16),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(226,232,240,0.9)]',
    badgeClassName:
      'border-[rgba(226,232,240,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(241,245,249,0.9)]',
    viewerShellClassName:
      'border-[rgba(226,232,240,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.95))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(71,85,105,0.28),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(226,232,240,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(147,197,253,0.14)] bg-[linear-gradient(180deg,rgba(59,130,246,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(219,234,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(125,211,252,0.14)] bg-[linear-gradient(180deg,rgba(14,116,144,0.16),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.9)]',
      },
    ],
  },
  {
    id: '09',
    title: 'Azul anil luminoso',
    description: 'Traz um azul mais vivo no meio do gradiente, mantendo o restante do painel bastante contido.',
    panelClassName:
      'border-[rgba(147,197,253,0.18)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(23,37,84,0.94)_38%,rgba(37,99,235,0.78)_72%,rgba(56,189,248,0.52)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_40%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(96,165,250,0.18),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(219,234,254,0.94)]',
    badgeClassName:
      'border-[rgba(191,219,254,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(239,246,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(219,234,254,0.16)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(239,246,255,0.94))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(96,165,250,0.18)] bg-[linear-gradient(180deg,rgba(37,99,235,0.24),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(191,219,254,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(56,189,248,0.18)] bg-[linear-gradient(180deg,rgba(14,165,233,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(224,242,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(103,232,249,0.18)] bg-[linear-gradient(180deg,rgba(6,182,212,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(207,250,254,0.92)]',
      },
    ],
  },
  {
    id: '10',
    title: 'Azul profundo com brilho lateral',
    description: 'Quase o mesmo peso do painel atual, mas com brilho concentrado nas laterais e menos mistura entre cores.',
    panelClassName:
      'border-[rgba(148,163,184,0.22)] bg-[linear-gradient(145deg,rgba(15,23,42,0.99),rgba(15,37,63,0.95)_44%,rgba(17,94,164,0.74)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_56%),radial-gradient(circle_at_top_right,rgba(147,197,253,0.2),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(29,78,216,0.16),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(191,219,254,0.92)]',
    badgeClassName:
      'border-[rgba(191,219,254,0.16)] bg-[rgba(255,255,255,0.07)] text-[rgba(239,246,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(239,246,255,0.95))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(147,197,253,0.18)] bg-[linear-gradient(180deg,rgba(59,130,246,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(219,234,254,0.92)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(103,232,249,0.16)] bg-[linear-gradient(180deg,rgba(8,145,178,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(207,250,254,0.9)]',
      },
    ],
  },
  {
    id: '11',
    title: 'Oceano suave com topo claro',
    description: 'Mais luz no topo do painel e transição mais clara no miolo, sem perder a base escura.',
    panelClassName:
      'border-[rgba(125,211,252,0.2)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(19,78,104,0.92)_42%,rgba(14,165,233,0.7)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.24),transparent_56%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(207,250,254,0.94)]',
    badgeClassName:
      'border-[rgba(207,250,254,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(236,254,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(207,250,254,0.16)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(236,254,255,0.92))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(254,240,138,0.94)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(74,222,128,0.2)] bg-[linear-gradient(180deg,rgba(21,128,61,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(187,247,208,0.94)]',
      },
    ],
  },
  {
    id: '12',
    title: 'Oceano suave com centro vívido',
    description: 'Concentra a luminosidade no centro do gradiente para dar mais volume ao corpo do painel.',
    panelClassName:
      'border-[rgba(125,211,252,0.2)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(14,70,104,0.92)_36%,rgba(6,182,212,0.68)_72%,rgba(14,116,144,0.76)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.2),transparent_56%),radial-gradient(circle_at_top_right,rgba(103,232,249,0.22),transparent_40%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(207,250,254,0.94)]',
    badgeClassName:
      'border-[rgba(207,250,254,0.16)] bg-[rgba(255,255,255,0.08)] text-[rgba(236,254,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(207,250,254,0.16)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(236,254,255,0.9))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(254,240,138,0.94)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(74,222,128,0.2)] bg-[linear-gradient(180deg,rgba(21,128,61,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(187,247,208,0.94)]',
      },
    ],
  },
  {
    id: '13',
    title: 'Oceano suave com brilho lateral frio',
    description: 'Mantém o painel luminoso, mas joga o brilho para as laterais para dar mais sensação de profundidade.',
    panelClassName:
      'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(17,59,89,0.92)_46%,rgba(14,165,233,0.62)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(224,242,254,0.18),transparent_56%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_38%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(125,211,252,0.14),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(224,242,254,0.94)]',
    badgeClassName:
      'border-[rgba(224,242,254,0.14)] bg-[rgba(255,255,255,0.08)] text-[rgba(239,246,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(224,242,254,0.16)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(239,246,255,0.92))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(254,240,138,0.94)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(74,222,128,0.2)] bg-[linear-gradient(180deg,rgba(21,128,61,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(187,247,208,0.94)]',
      },
    ],
  },
  {
    id: '14',
    title: 'Oceano suave com teal claro',
    description: 'Puxa um pouco mais para o teal claro no corpo do painel, mas preserva o peso escuro do topo.',
    panelClassName:
      'border-[rgba(153,246,228,0.18)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(14,65,87,0.92)_42%,rgba(45,212,191,0.48)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(204,251,241,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_40%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(45,212,191,0.12),transparent_72%)]',
    eyebrowClassName: 'text-[rgba(204,251,241,0.94)]',
    badgeClassName:
      'border-[rgba(204,251,241,0.14)] bg-[rgba(255,255,255,0.08)] text-[rgba(240,253,250,0.94)]',
    viewerShellClassName:
      'border-[rgba(204,251,241,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(236,253,245,0.9))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(254,240,138,0.94)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(74,222,128,0.2)] bg-[linear-gradient(180deg,rgba(21,128,61,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(187,247,208,0.94)]',
      },
    ],
  },
  {
    id: '15',
    title: 'Oceano suave com névoa azul',
    description: 'Uma variação mais etérea, com brilho azul claro mais espalhado no painel e base ainda técnica.',
    panelClassName:
      'border-[rgba(147,197,253,0.18)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(17,65,96,0.92)_40%,rgba(56,189,248,0.28)_100%)]',
    topGlowClassName:
      'bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.16),transparent_58%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.14),transparent_42%)]',
    bottomGlowClassName:
      'bg-[radial-gradient(circle,rgba(147,197,253,0.14),transparent_72%)]',
    headerWrapClassName:
      'rounded-[1.25rem] border border-[rgba(219,234,254,0.1)] bg-[linear-gradient(180deg,rgba(15,23,42,0.34),rgba(15,23,42,0.16))] px-3 py-3 backdrop-blur-sm',
    eyebrowClassName: 'text-[rgba(219,234,254,0.94)]',
    titleClassName: 'text-[rgba(248,250,252,0.98)]',
    badgeClassName:
      'border-[rgba(219,234,254,0.16)] bg-[rgba(15,23,42,0.22)] text-[rgba(239,246,255,0.94)]',
    viewerShellClassName:
      'border-[rgba(219,234,254,0.14)] bg-[linear-gradient(180deg,rgba(248,250,252,0.99),rgba(239,246,255,0.92))]',
    metaCards: [
      {
        label: 'Módulo',
        value: 'Viga de concreto armado',
        className:
          'border-[rgba(125,211,252,0.18)] bg-[linear-gradient(180deg,rgba(14,116,144,0.22),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(186,230,253,0.92)]',
      },
      {
        label: 'Saída',
        value: 'Diagramas e verificações',
        className:
          'border-[rgba(251,191,36,0.18)] bg-[linear-gradient(180deg,rgba(180,83,9,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(254,240,138,0.94)]',
      },
      {
        label: 'Integração',
        value: 'Interface e serviços internos',
        className:
          'border-[rgba(74,222,128,0.2)] bg-[linear-gradient(180deg,rgba(21,128,61,0.18),rgba(15,23,42,0.08))] text-white/95',
        labelClassName: 'text-[rgba(187,247,208,0.94)]',
      },
    ],
  },
];

function HeroTextBlock() {
  return (
    <div className="relative z-10 flex flex-col gap-6 xl:justify-center">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="home-eyebrow">Soluções para engenharia estrutural</span>
          <span className="rounded-full border border-[rgba(14,116,144,0.22)] bg-[rgba(14,116,144,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(14,116,144)]">
            Plataforma técnica
          </span>
        </div>

        <div className="space-y-3 xl:max-w-none">
          <h2 className="max-w-none text-[clamp(2.45rem,4.4vw,4.3rem)] font-semibold leading-[1] tracking-[-0.04em] text-[rgb(15,23,42)] xl:max-w-[50rem] xl:text-[3.1rem] xl:leading-[1.02] 2xl:max-w-[52rem] 2xl:text-[3.2rem]">
            Cálculo, dimensionamento e consulta técnica em um fluxo contínuo de trabalho.
          </h2>
          <p className="max-w-none text-base leading-7 text-[rgb(71,85,105)] lg:max-w-3xl xl:max-w-[46rem] 2xl:max-w-[48rem]">
            Reúna modelagem, visualização estrutural, verificações e acesso a normas em um ambiente pensado para
            apoiar decisões de projeto com mais agilidade.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-[rgb(15,23,42)] px-6 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] hover:bg-[rgb(30,41,59)]"
          >
            <Link href="/dashboard/viga-concreto-armado">
              Explorar dimensionamento
              <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-[rgba(15,23,42,0.14)] bg-white/70 px-6 text-[rgb(15,23,42)] hover:bg-white"
          >
            <Link href="/dashboard/geometria">Abrir módulo de geometria</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-full px-5 text-[rgb(15,23,42)] hover:bg-[rgba(15,23,42,0.05)]"
          >
            <a href="#variacoes">Ver variações</a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {trustPills.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-[rgba(148,163,184,0.3)] bg-white/72 px-3 py-1.5 text-xs font-medium text-[rgb(51,65,85)] shadow-[0_10px_28px_-24px_rgba(15,23,42,0.4)]"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {heroHighlights.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-3xl border border-white/70 bg-white/72 p-3.5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] backdrop-blur"
          >
            <div className="mb-3 inline-flex rounded-2xl bg-[rgba(14,116,144,0.12)] p-2 text-[rgb(14,116,144)]">
              <Icon className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(15,23,42)]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AnalysisCard({ variant }: { variant: DemoVariant }) {
  return (
    <div className="relative z-10">
      <div
        className={`relative overflow-hidden rounded-[2rem] border p-4 shadow-[0_45px_90px_-52px_rgba(15,23,42,0.82)] md:p-5 ${variant.panelClassName}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 ${variant.topGlowClassName}`} />
        <div
          className={`pointer-events-none absolute -bottom-8 left-10 h-28 w-28 rounded-full blur-2xl ${variant.bottomGlowClassName}`}
        />

        <div className="relative">
          <div
            className={`mb-4 flex flex-wrap items-center justify-between gap-3 ${variant.headerWrapClassName ?? ''}`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${variant.eyebrowClassName}`}>
                Análise em destaque
              </p>
              <h3 className={`mt-1 text-lg font-semibold ${variant.titleClassName ?? 'text-white'}`}>
                Visualização estrutural aplicada
              </h3>
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs ${variant.badgeClassName}`}>Ambiente interativo</div>
          </div>

          <div
            className={`rounded-[1.35rem] border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_40px_-28px_rgba(15,23,42,0.65)] ${variant.viewerShellClassName}`}
          >
            <HeroBeamMoment viewerHeightClassName="h-[300px] min-h-[300px] lg:h-[345px] lg:min-h-[345px] 2xl:h-[385px] 2xl:min-h-[385px]" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {variant.metaCards.map((item) => (
              <div key={item.label} className={`rounded-2xl border p-3 ${item.className}`}>
                <p className={`text-[11px] uppercase tracking-[0.24em] ${item.labelClassName}`}>{item.label}</p>
                <p className="mt-1 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVariantSection({ variant }: { variant: DemoVariant }) {
  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border-x border-t border-x-[rgba(203,213,225,0.24)] border-t-[rgba(203,213,225,0.28)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(243,247,250,0.94)_62%,rgba(232,239,245,0.98))] px-5 py-6 shadow-[0_32px_84px_-50px_rgba(15,23,42,0.42),0_28px_36px_-30px_rgba(148,163,184,0.42),inset_0_1px_0_rgba(255,255,255,0.24)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-12 after:bg-[linear-gradient(180deg,rgba(241,245,249,0),rgba(226,232,240,0.86))] md:px-8 md:py-8"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.16),transparent_58%)]" />
      <div className="pointer-events-none absolute right-[-6rem] top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16),transparent_70%)] blur-2xl" />

      <div className="relative z-20 mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(14,116,144)]">Variação {variant.id}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[rgb(15,23,42)]">{variant.title}</h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[rgb(71,85,105)]">{variant.description}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(460px,1.06fr)] xl:items-center">
        <HeroTextBlock />
        <AnalysisCard variant={variant} />
      </div>
    </section>
  );
}

export default function HeroSectionDemoPage() {
  return (
    <div className="min-h-screen bg-[rgb(246,247,251)]">
      <div className="border-b border-[rgba(226,232,240,0.74)] bg-[rgba(246,247,251,0.86)] backdrop-blur">
        <GridContainer className="max-w-[1440px] py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[rgb(14,116,144)]">Demo</p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[rgb(15,23,42)]">
                Laboratório de cor da hero
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[rgb(71,85,105)]">
                Quinze variações da seção de Análise em destaque para testar apenas a paleta desse painel.
              </p>
            </div>

            <Button asChild variant="outline" className="w-fit rounded-full bg-white/75">
              <Link href="/">
                <ArrowLeft />
                Voltar para a home
              </Link>
            </Button>
          </div>
        </GridContainer>
      </div>

      <main id="variacoes">
        <GridContainer className="max-w-[1440px] space-y-8 py-8 md:space-y-10 md:py-10">
          {demoVariants.map((variant) => (
            <HeroVariantSection key={variant.id} variant={variant} />
          ))}
        </GridContainer>
      </main>
    </div>
  );
}
