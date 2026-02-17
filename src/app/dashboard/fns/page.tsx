'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../components/user/molecules/sidebar';
import { Beam3DViewer } from '../../../components/user/molecules/beam-3d-viewer';
import {
  Layers,
  ArrowUpDown,
  Anchor,
  Square,
  Settings,
  FileText,
} from 'lucide-react';
import * as styles from '@/styles/fns-styles';

export default function FnsPage() {
  // Menu items - Dimensionamento
  const menuItems: MenuItem[] = [
    {
      label: 'Dimensionamento',
      icon: Layers,
      items: [
        { label: 'Armadura Longitudinal', href: '/dashboard/fns/longitudinal', icon: ArrowUpDown },
        { label: 'Armadura Transversal', href: '/dashboard/fns/transversal', icon: Square },
        { label: 'Armadura de Ancoragem', href: '/dashboard/fns/ancoragem', icon: Anchor },
        { label: 'Armadura de Pele', href: '/dashboard/fns/pele', icon: Layers },
      ],
    },
  ];

  const exportItems: MenuItem[] = [
    { label: 'Memorial de Cálculo', href: '/dashboard/fns/memorial-pdf', icon: FileText },
  ];

  const configItems: MenuItem[] = [
    { label: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarToggleButton />
      <div className="flex w-full">
        {/* Sidebar */}
        <AppSidebar 
          menuItems={menuItems}
          exportItems={exportItems}
          configItems={configItems} 
          menuGroupLabel="Seção Principal"
          exportGroupLabel="Exportar"
          configGroupLabel="Configurações"
        />

        {/* Conteúdo principal */}
        <div className={styles.mainContentStyles.container}>
          {/* Header */}
          <div className={styles.headerStyles.container}>
            <div className={styles.headerStyles.wrapper}>
              <h1 className={styles.headerStyles.title + ' ' + styles.fontSizesResponsive.pageTitle}>
                Dimensionamento de Vigas (FNS)
              </h1>
              <p className={styles.headerStyles.subtitle + ' ' + styles.fontSizesResponsive.subtitle}>
                Flexão Normal Simples - Sistema de cálculo estrutural
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <main className="container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
            <div className="flex flex-col gap-6">
              {/* Visualizador 3D da Viga */}
              <div className={styles.cardStyles.base}>
                <div className={styles.cardStyles.header}>
                  <h3 className={styles.cardStyles.title}>Visualização 3D da Viga</h3>
                </div>
                <div className={styles.cardStyles.padding}>
                  <div className="w-full h-[400px] bg-muted/20 rounded-lg overflow-hidden">
                    <Beam3DViewer width={20} height={40} length={300} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Visualização interativa da seção da viga. Use o mouse para rotacionar, aproximar ou afastar a câmera.
                  </p>
                </div>
              </div>

              {/* Grid de Cards de Funcionalidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Armadura Longitudinal */}
                <div className={styles.cardStyles.base + ' hover:shadow-md transition-shadow cursor-pointer'}>
                  <div className={styles.cardStyles.padding}>
                    <div className="flex items-start gap-3">
                      <ArrowUpDown className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Armadura Longitudinal</h3>
                        <p className="text-xs text-muted-foreground">
                          Cálculo da armadura longitudinal necessária para resistir aos momentos fletores.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Armadura Transversal */}
                <div className={styles.cardStyles.base + ' hover:shadow-md transition-shadow cursor-pointer'}>
                  <div className={styles.cardStyles.padding}>
                    <div className="flex items-start gap-3">
                      <Square className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Armadura Transversal</h3>
                        <p className="text-xs text-muted-foreground">
                          Dimensionamento de estribos para resistir aos esforços cortantes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Armadura de Ancoragem */}
                <div className={styles.cardStyles.base + ' hover:shadow-md transition-shadow cursor-pointer'}>
                  <div className={styles.cardStyles.padding}>
                    <div className="flex items-start gap-3">
                      <Anchor className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Armadura de Ancoragem</h3>
                        <p className="text-xs text-muted-foreground">
                          Cálculo dos comprimentos de ancoragem das barras de aço.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Armadura de Pele */}
                <div className={styles.cardStyles.base + ' hover:shadow-md transition-shadow cursor-pointer'}>
                  <div className={styles.cardStyles.padding}>
                    <div className="flex items-start gap-3">
                      <Layers className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Armadura de Pele</h3>
                        <p className="text-xs text-muted-foreground">
                          Armadura complementar para controle de fissuração em vigas altas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Informações */}
              <div className={styles.cardStyles.base}>
                <div className={styles.cardStyles.header}>
                  <h3 className={styles.cardStyles.title}>Informações Importantes</h3>
                </div>
                <div className={styles.cardStyles.padding}>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Os cálculos seguem as recomendações da NBR 6118:2023</li>
                    <li>• Todos os dados de entrada devem estar nas unidades especificadas</li>
                    <li>• Os resultados podem ser exportados em formato PDF através do menu lateral</li>
                    <li>• Salve seus projetos regularmente para não perder os dados</li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
