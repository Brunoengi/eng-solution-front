'use client';

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../components/user/molecules/sidebar';
import { GridContainer, GridLayout, GridItem, GridDashboard } from '../../../components/user/layout/grid-layout';
import { ManyNumberInputs, type NumberInputItem } from '../../../components/user/molecules/many-number-inputs';
import { ManySelectInputs, type SelectInputItem } from '../../../components/user/molecules/many-select-inputs';
import { type SelectOption } from '../../../components/user/atoms/oneSelectInput';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';
import * as styles from '@/styles/dashboard-styles';

export default function FnsPage() {
  // Estados
  const [geometry, setGeometry] = useState<Record<string, number | string>>({
    b: 20,
    h: 40,
    d_prime: 4,
  });

  const [materials, setMaterials] = useState<Record<string, string | number>>({
    concrete: 'C30',
    steel: 'CA-50',
  });

  const [efforts, setEfforts] = useState<Record<string, number | string>>({
    Mk: 0,
  });

  const [coefficients, setCoefficients] = useState<Record<string, number | string>>({
    gammac: 1.4,
    gammas: 1.15,
    gammaf: 1.4,
  });

  // Menu items
  const menuItems: MenuItem[] = [
    { label: 'FNS', href: '/dashboard/fns', icon: LayoutDashboard },
    {
      label: 'Relatórios',
      icon: FileText,
      items: [
        { label: 'Relatório 1', href: '/relatorios/1', icon: FileText },
        { label: 'Relatório 2', href: '/relatorios/2', icon: FileText },
      ],
    },
    { label: 'Usuários', href: '/usuarios', icon: Users },
  ];

  const configItems: MenuItem[] = [
    { label: 'Configurações', href: '/settings', icon: Settings },
  ];

  // Dados de entrada - Geometria
  const geometryInputs: NumberInputItem[] = [
    { id: 'b', label: 'b (largura)', value: geometry.b, min: 0, step: 1, inputWidth: 'w-24' },
    { id: 'h', label: 'h (altura)', value: geometry.h, min: 0, step: 1, inputWidth: 'w-24' },
    { id: 'd_prime', label: "d' (cobrimento)", value: geometry.d_prime, min: 0, step: 0.5, inputWidth: 'w-24' },
  ];

  // Opções de concreto
  const concreteOptions: SelectOption[] = [
    { label: 'C20', value: 'C20' },
    { label: 'C25', value: 'C25' },
    { label: 'C30', value: 'C30' },
    { label: 'C35', value: 'C35' },
    { label: 'C40', value: 'C40' },
    { label: 'C45', value: 'C45' },
    { label: 'C50', value: 'C50' },
    { label: 'C55', value: 'C55' },
    { label: 'C60', value: 'C60' },
    { label: 'C65', value: 'C65' },
    { label: 'C70', value: 'C70' },
    { label: 'C75', value: 'C75' },
    { label: 'C80', value: 'C80' },
    { label: 'C85', value: 'C85' },
    { label: 'C90', value: 'C90' },
  ];

  // Opções de aço
  const steelOptions: SelectOption[] = [
    { label: 'CA-50', value: 'CA-50' },
    { label: 'CA-60', value: 'CA-60' },
  ];

  // Materiais
  const materialInputs: SelectInputItem[] = [
    {
      id: 'concrete',
      label: 'Concreto',
      value: materials.concrete,
      options: concreteOptions,
      placeholder: 'Selecione classe',
      inputWidth: 'w-24',
    },
    {
      id: 'steel',
      label: 'Aço',
      value: materials.steel,
      options: steelOptions,
      placeholder: 'Selecione tipo',
      inputWidth: 'w-24',
    },
  ];

  // Esforços
  const effortInputs: NumberInputItem[] = [
    { id: 'Mk', label: <>M<sub>k</sub></>, value: efforts.Mk, placeholder: '0', step: 0.1, inputWidth: 'w-24' },
  ];

  // Coeficientes de segurança
  const coefficientInputs: NumberInputItem[] = [
    { id: 'gammac', label: <>γ<sub>c</sub></>, value: coefficients.gammac, step: 0.01, inputWidth: 'w-24' },
    { id: 'gammas', label: <>γ<sub>s</sub></>, value: coefficients.gammas, step: 0.01, inputWidth: 'w-24' },
    { id: 'gammaf', label: <>γ<sub>f</sub></>, value: coefficients.gammaf, step: 0.01, inputWidth: 'w-24' },
  ];

  const handleGeometryChange = (id: string, value: number | string) => {
    setGeometry((prev) => ({ ...prev, [id]: value }));
  };

  const handleMaterialChange = (id: string, value: string | number) => {
    setMaterials((prev) => ({ ...prev, [id]: value }));
  };

  const handleEffortChange = (id: string, value: number | string) => {
    setEfforts((prev) => ({ ...prev, [id]: value }));
  };

  const handleCoefficientChange = (id: string, value: number | string) => {
    setCoefficients((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex w-full">
        {/* Sidebar */}
        <AppSidebar menuItems={menuItems} configItems={configItems} />

        {/* Conteúdo principal */}
        <div className={styles.mainContentStyles.container}>
          {/* Header */}
          <div className={styles.headerStyles.container}>
            <div className={styles.headerStyles.wrapper}>
              <h1 className={styles.headerStyles.title + ' ' + styles.fontSizesResponsive.pageTitle}>
                Dimensionamento de Vigas (FNS)
              </h1>
              <p className={styles.headerStyles.subtitle + ' ' + styles.fontSizesResponsive.subtitle}>
                Flexão Normal Simples - Cálculo de armadura longitudinal
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <main className={styles.mainContentStyles.container}>
            <GridDashboard className={styles.mainContentStyles.gridContainer}>
              {/* Layout Principal: Entrada (1/4) + Conteúdo (3/4) */}
              <GridLayout>
                {/* Seção de Entrada - 1/4 da largura */}
                <GridItem cols={12} colsMd={3} colsSm={12} className="md:min-w-[20rem] lg:min-w-[24rem]">
                  {/* Container principal com background destacado */}
                  <div className={styles.inputSectionLayoutStyles.container}>
                    {/* Título */}
                    <div className={styles.inputSectionLayoutStyles.header}>
                      <div className={styles.inputSectionLayoutStyles.headerContent}>
                        <h2 className={styles.inputSectionLayoutStyles.headerTitle + ' ' + styles.fontSizesResponsive.sectionTitle}>Dados de Entrada</h2>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className={styles.tooltipStyles.trigger} />
                            </TooltipTrigger>
                            <TooltipContent side="left" className={styles.tooltipStyles.content}>
                              <div className={styles.tooltipStyles.section}>
                                <div>
                                  <p className={styles.tooltipStyles.sectionTitle}>Geometria da Viga:</p>
                                  <p className={styles.tooltipStyles.sectionText}>b - Largura da viga em cm</p>
                                  <p className={styles.tooltipStyles.sectionText}>h - Altura da viga em cm</p>
                                  <p className={styles.tooltipStyles.sectionText}>d&apos; - Cobrimento em cm</p>
                                </div>
                                <div>
                                  <p className={styles.tooltipStyles.sectionTitle}>Material:</p>
                                  <p className={styles.tooltipStyles.sectionText}>Concreto - Classe de resistência (C20-C90)</p>
                                  <p className={styles.tooltipStyles.sectionText}>Aço - Tipo de armadura (CA-50 ou CA-60)</p>
                                </div>
                                <div>
                                  <p className={styles.tooltipStyles.sectionTitle}>Esforços:</p>
                                  <p className={styles.tooltipStyles.sectionText}>M<sub>k</sub> - Momento fletor em kN.m</p>
                                </div>
                                <div>
                                  <p className={styles.tooltipStyles.sectionTitle}>Coeficientes:</p>
                                  <p className={styles.tooltipStyles.sectionText}>γ<sub>c</sub> - Coeficiente de concreto</p>
                                  <p className={styles.tooltipStyles.sectionText}>γ<sub>s</sub> - Coeficiente de aço</p>
                                  <p className={styles.tooltipStyles.sectionText}>γ<sub>f</sub> - Coeficiente de esforços</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Conteúdo com subcards */}
                    <div className={styles.inputSectionLayoutStyles.contentWrapper}>
                      {/* Seção 1: Geometria */}
                      <div className={styles.inputSectionLayoutStyles.geometryGrid}>
                        {/* Card de Inputs */}
                        <div className={styles.cardStyles.subcard}>
                          <ManyNumberInputs
                            title="Geometria da Viga"
                            unit="cm"
                            inputs={geometryInputs}
                            onChange={handleGeometryChange}
                            gridCols={1}
                          />
                        </div>

                        {/* Card da Imagem */}
                        <div className={styles.imageStyles.container}>
                          <img
                            src="/img/fns/fns-geometric.png"
                            alt="Viga"
                            className={styles.imageStyles.image}
                          />
                        </div>
                      </div>

                      {/* Seções 2 e 3: Material e Esforços lado a lado */}
                      <div className={styles.inputSectionLayoutStyles.materialEffortGrid}>
                        {/* Seção 2: Material */}
                        <div className={styles.cardStyles.subcard + ' col-span-2'}>
                          <ManySelectInputs
                            title="Material"
                            unit="tipo"
                            inputs={materialInputs}
                            onChange={handleMaterialChange}
                            gridCols={2}
                          />
                        </div>

                        {/* Seção 3: Esforços */}
                        <div className={styles.cardStyles.subcard + ' col-span-1'}>
                          <ManyNumberInputs
                            title="Esforços"
                            unit="kN.m"
                            inputs={effortInputs}
                            onChange={handleEffortChange}
                            gridCols={1}
                          />
                        </div>
                      </div>

                      {/* Seção 4: Coeficientes de Segurança */}
                      <div className={styles.cardStyles.subcard}>
                        <ManyNumberInputs
                          title="Coeficientes de Segurança"
                          unit="adimensional"
                          inputs={coefficientInputs}
                          onChange={handleCoefficientChange}
                          gridCols={3}
                        />
                      </div>
                    </div>
                  </div>
                </GridItem>

                {/* Seção de Conteúdo - 3/4 da largura */}
                <GridItem cols={12} colsMd={9} colsSm={12}>
                  <div className={styles.contentSectionLayoutStyles.wrapper}>
                    {/* Resumo dos Valores */}
                    <div className={styles.contentSectionLayoutStyles.summaryCard}>
                      <div className={styles.contentSectionLayoutStyles.summaryContent}>
                        <h2 className={styles.contentSectionLayoutStyles.summaryTitle + ' ' + styles.fontSizesResponsive.cardTitle}>
                          Resumo dos Dados de Entrada
                        </h2>
                        <div className={styles.contentSectionLayoutStyles.summaryGrid}>
                          <div className={styles.summaryCardStyles.container}>
                            <p className={styles.summaryCardStyles.label + ' ' + styles.fontSizesResponsive.label}>Geometria</p>
                            <p className={styles.summaryCardStyles.value + ' ' + styles.fontSizes.base}>
                              b = {geometry.b} cm
                              <br />
                              h = {geometry.h} cm
                              <br />
                              d' = {geometry.d_prime} cm
                            </p>
                          </div>
                          <div className={styles.summaryCardStyles.container}>
                            <p className={styles.summaryCardStyles.label + ' ' + styles.fontSizesResponsive.label}>Material</p>
                            <p className={styles.summaryCardStyles.value + ' ' + styles.fontSizes.base}>
                              Concreto: {materials.concrete}
                              <br />
                              Aço: {materials.steel}
                            </p>
                          </div>
                          <div className={styles.summaryCardStyles.container}>
                            <p className={styles.summaryCardStyles.label + ' ' + styles.fontSizesResponsive.label}>Esforços</p>
                            <p className={styles.summaryCardStyles.value + ' ' + styles.fontSizes.base}>
                              Mk = {efforts.Mk} kN.m
                            </p>
                          </div>
                          <div className={styles.summaryCardStyles.container}>
                            <p className={styles.summaryCardStyles.label + ' ' + styles.fontSizesResponsive.label}>Coeficientes</p>
                            <p className={styles.summaryCardStyles.value + ' ' + styles.fontSizes.base}>
                              γc = {coefficients.gammac}
                              <br />
                              γs = {coefficients.gammas}
                              <br />
                              γf = {coefficients.gammaf}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Espaço para Gráficos */}
                    <div className={styles.contentSectionLayoutStyles.resultsCard}>
                      <div className={styles.contentSectionLayoutStyles.resultsContent}>
                        <h2 className={styles.contentSectionLayoutStyles.resultsTitle + ' ' + styles.fontSizesResponsive.cardTitle}>
                          Gráficos e Resultados
                        </h2>
                      </div>
                      <div className={styles.contentSectionLayoutStyles.resultsPlaceholder}>
                        <p className={styles.contentSectionLayoutStyles.resultsPlaceholderText}>
                          Espaço reservado para gráficos e cálculos
                        </p>
                      </div>
                    </div>
                  </div>
                </GridItem>
              </GridLayout>
            </GridDashboard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
