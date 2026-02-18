'use client';

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarToggleButton, type MenuItem } from '../../../components/user/molecules/sidebar';
import { Beam3DViewer } from '../../../components/user/molecules/beam-3d-viewer';
import { Beam2DViewer } from '../../../components/user/molecules/beam-2d-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Layers,
  ArrowUpDown,
  Anchor,
  Square,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import * as styles from '@/styles/fns-styles';

interface Pilar {
  id: string;
  width: number; // largura (cm)
  position: number; // posição no eixo X (cm)
}

interface Viga {
  id: string;
  width: number; // largura b (cm)
  height: number; // altura h (cm)
  startPosition: number; // posição inicial X (cm)
  endPosition: number; // posição final X (cm)
  startPillarId?: string; // ID do pilar inicial (undefined se balanço)
  endPillarId?: string; // ID do pilar final (undefined se balanço)
}

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

  // Estado para pilares e vigas
  const [pilares, setPilares] = useState<Pilar[]>([
    { id: 'P1', width: 20, position: -160 },
    { id: 'P2', width: 20, position: 160 },
  ]);

  const [vigas, setVigas] = useState<Viga[]>([
    { 
      id: 'V1', 
      width: 20, 
      height: 40, 
      startPosition: -160, 
      endPosition: 160,
      startPillarId: 'P1',
      endPillarId: 'P2'
    },
  ]);

  // Formulário para novo pilar
  const [newPilar, setNewPilar] = useState({ width: 20, position: 0 });
  const [newViga, setNewViga] = useState({ 
    width: 20, 
    height: 40, 
    length: 100, // comprimento do balanço
    direction: 'right' as 'left' | 'right' 
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  // Função para verificar se há balanço bloqueando posição
  const getPilaresComBalanco = () => {
    const pilaresBloqueados = new Map<string, { direction: 'left' | 'right', vigaId: string }>();
    
    vigas.forEach(viga => {
      if (!viga.endPillarId && viga.startPillarId) {
        const isRight = viga.endPosition > viga.startPosition;
        pilaresBloqueados.set(viga.startPillarId, {
          direction: isRight ? 'right' : 'left',
          vigaId: viga.id
        });
      }
    });
    
    return pilaresBloqueados;
  };

  // Função para adicionar pilar
  const addPilar = () => {
    // Verificar se há vigas em balanço que impedem a adição de pilar nesta posição
    const vigasBalanco = vigas.filter(v => !v.endPillarId);
    
    for (const viga of vigasBalanco) {
      const pilarOrigem = pilares.find(p => p.id === viga.startPillarId);
      if (pilarOrigem) {
        const isBalancoParaDireita = viga.endPosition > viga.startPosition;
        
        // Se o novo pilar está na direção do balanço
        if (isBalancoParaDireita && newPilar.position >= pilarOrigem.position) {
          alert(`Não é possível adicionar pilar à direita de ${pilarOrigem.id}. Existe uma viga em balanço (${viga.id}) partindo deste pilar. Exclua a viga em balanço primeiro.`);
          return;
        }
        if (!isBalancoParaDireita && newPilar.position <= pilarOrigem.position) {
          alert(`Não é possível adicionar pilar à esquerda de ${pilarOrigem.id}. Existe uma viga em balanço (${viga.id}) partindo deste pilar. Exclua a viga em balanço primeiro.`);
          return;
        }
      }
    }
    
    const newId = `P${pilares.length + 1}`;
    const newPilarObj: Pilar = {
      id: newId,
      width: newPilar.width,
      position: newPilar.position,
    };
    
    setPilares([...pilares, newPilarObj]);

    // Criar vigas automaticamente entre pilares adjacentes
    const sortedPilares = [...pilares, newPilarObj].sort((a, b) => a.position - b.position);
    const index = sortedPilares.findIndex(p => p.id === newId);
    
    // Criar viga à esquerda se houver pilar anterior
    if (index > 0) {
      const prevPilar = sortedPilares[index - 1];
      const newVigaId = `V${vigas.length + 1}`;
      const newVigaObj: Viga = {
        id: newVigaId,
        width: 20,
        height: 40,
        startPosition: prevPilar.position,
        endPosition: newPilarObj.position,
        startPillarId: prevPilar.id,
        endPillarId: newPilarObj.id,
      };
      setVigas([...vigas, newVigaObj]);
    }
    
    // Criar viga à direita se houver pilar posterior
    if (index < sortedPilares.length - 1) {
      const nextPilar = sortedPilares[index + 1];
      const newVigaId = `V${vigas.length + (index > 0 ? 2 : 1)}`;
      const newVigaObj: Viga = {
        id: newVigaId,
        width: 20,
        height: 40,
        startPosition: newPilarObj.position,
        endPosition: nextPilar.position,
        startPillarId: newPilarObj.id,
        endPillarId: nextPilar.id,
      };
      setVigas(prev => [...prev, newVigaObj]);
    }

    setNewPilar({ width: 20, position: 0 });
  };

  // Função para adicionar viga em balanço
  const addViga = () => {
    // Encontrar o pilar da extremidade baseado na direção
    const sortedPilares = [...pilares].sort((a, b) => a.position - b.position);
    let pilarBase: Pilar | undefined;
    
    if (newViga.direction === 'left') {
      // Extremidade esquerda = primeiro pilar
      pilarBase = sortedPilares[0];
    } else {
      // Extremidade direita = último pilar
      pilarBase = sortedPilares[sortedPilares.length - 1];
    }
    
    if (!pilarBase) {
      alert('Não há pilares disponíveis. Adicione ao menos um pilar primeiro.');
      return;
    }
    
    // Verificar se já existe uma viga em balanço nesta extremidade
    const balancosExistentes = getPilaresComBalanco();
    const balancoExistente = balancosExistentes.get(pilarBase.id);
    
    if (balancoExistente) {
      alert(`Já existe uma viga em balanço (${balancoExistente.vigaId}) na extremidade ${newViga.direction === 'left' ? 'esquerda' : 'direita'}. Exclua a viga existente antes de adicionar outra.`);
      return;
    }
    
    // Calcular posições
    const startPosition = pilarBase.position;
    const endPosition = newViga.direction === 'left' 
      ? startPosition - newViga.length 
      : startPosition + newViga.length;
    
    const newVigaId = `V${vigas.length + 1}`;
    const newVigaObj: Viga = {
      id: newVigaId,
      width: newViga.width,
      height: newViga.height,
      startPosition: startPosition,
      endPosition: endPosition,
      startPillarId: pilarBase.id,
      // endPillarId fica undefined pois é balanço
    };
    
    setVigas([...vigas, newVigaObj]);
    setNewViga({ width: 20, height: 40, length: 100, direction: 'right' });
  };

  // Função para remover pilar
  const removePilar = (id: string) => {
    setPilares(pilares.filter(p => p.id !== id));
    // Remover vigas conectadas
    setVigas(vigas.filter(v => v.startPillarId !== id && v.endPillarId !== id));
  };

  // Função para remover viga
  const removeViga = (id: string) => {
    setVigas(vigas.filter(v => v.id !== id));
  };

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
              {/* Visualizador da Viga com Abas 2D/3D */}
              <Tabs defaultValue="3d" className="w-full">
                <div className={styles.cardStyles.base}>
                  <div className={`${styles.cardStyles.header} flex items-center justify-between`}>
                    <h3 className={styles.cardStyles.title}>Visualização da Viga</h3>
                    <div className="flex items-center gap-2">
                      <TabsList className="grid grid-cols-2 h-8 w-auto">
                        <TabsTrigger value="3d" className="text-xs px-4">3D</TabsTrigger>
                        <TabsTrigger value="2d" className="text-xs px-4">2D</TabsTrigger>
                      </TabsList>
                      
                      {/* Botão para gerenciar elementos */}
                      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="h-4 w-4 mr-2" />
                            Gerenciar
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Gerenciar Estrutura</SheetTitle>
                            <SheetDescription>
                              Adicione, edite ou remova pilares e vigas da estrutura
                            </SheetDescription>
                          </SheetHeader>
                          
                          <div className="mt-6 space-y-6">
                            {/* Seção Pilares */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Pilares</h4>
                              <div className="space-y-2 mb-4">
                                {pilares.map((pilar) => (
                                  <div key={pilar.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">{pilar.id}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {pilar.width} × {pilar.width} cm | Posição: {pilar.position} cm
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePilar(pilar.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Formulário adicionar pilar */}
                              <div className="border rounded-lg p-4 space-y-3">
                                <h5 className="text-xs font-semibold">Adicionar Pilar (Cria Viga Automaticamente)</h5>
                                <p className="text-xs text-muted-foreground">Ao adicionar um pilar, vigas serão criadas automaticamente entre pilares adjacentes</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor="pilar-width" className="text-xs">Largura (cm)</Label>
                                    <Input
                                      id="pilar-width"
                                      type="number"
                                      value={newPilar.width}
                                      onChange={(e) => setNewPilar({ ...newPilar, width: Number(e.target.value) })}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="pilar-position" className="text-xs">Posição X (cm)</Label>
                                    <Input
                                      id="pilar-position"
                                      type="number"
                                      value={newPilar.position}
                                      onChange={(e) => setNewPilar({ ...newPilar, position: Number(e.target.value) })}
                                      className="h-8 text-xs"
                                      step="any"
                                    />
                                  </div>
                                </div>
                                <Button onClick={addPilar} size="sm" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Pilar
                                </Button>
                              </div>
                            </div>

                            {/* Seção Vigas */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Vigas</h4>
                              <div className="space-y-2 mb-4">
                                {vigas.map((viga) => (
                                  <div key={viga.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">{viga.id}</p>
                                      <p className="text-xs text-muted-foreground">
                                        b: {viga.width} cm, h: {viga.height} cm
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        De {viga.startPosition} até {viga.endPosition} cm
                                        {viga.startPillarId && viga.endPillarId && (
                                          <span> ({viga.startPillarId} → {viga.endPillarId})</span>
                                        )}
                                        {(!viga.startPillarId || !viga.endPillarId) && (
                                          <span className="text-orange-600"> (Balanço)</span>
                                        )}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeViga(viga.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Formulário adicionar viga em balanço */}
                              <div className="border rounded-lg p-4 space-y-3">
                                <h5 className="text-xs font-semibold">Adicionar Viga em Balanço</h5>
                                <p className="text-xs text-muted-foreground">Cria uma viga em balanço na extremidade esquerda ou direita</p>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor="viga-width" className="text-xs">Largura b (cm)</Label>
                                      <Input
                                        id="viga-width"
                                        type="number"
                                        value={newViga.width}
                                        onChange={(e) => setNewViga({ ...newViga, width: Number(e.target.value) })}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="viga-height" className="text-xs">Altura h (cm)</Label>
                                      <Input
                                        id="viga-height"
                                        type="number"
                                        value={newViga.height}
                                        onChange={(e) => setNewViga({ ...newViga, height: Number(e.target.value) })}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="viga-length" className="text-xs">Comprimento do Balanço (cm)</Label>
                                    <Input
                                      id="viga-length"
                                      type="number"
                                      value={newViga.length}
                                      onChange={(e) => setNewViga({ ...newViga, length: Number(e.target.value) })}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="viga-direction" className="text-xs">Extremidade</Label>
                                    <Select
                                      value={newViga.direction}
                                      onValueChange={(value: 'left' | 'right') => setNewViga({ ...newViga, direction: value })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="left" className="text-xs">Esquerda (bloqueará pilares à esquerda)</SelectItem>
                                        <SelectItem value="right" className="text-xs">Direita (bloqueará pilares à direita)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button onClick={addViga} size="sm" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Viga em Balanço
                                </Button>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                  <div className={styles.cardStyles.padding}>
                    <TabsContent value="3d" className="mt-0 data-[state=inactive]:hidden" forceMount>
                      <div className="w-full h-[400px] bg-muted/20 rounded-lg relative">
                        <Beam3DViewer pilares={pilares} vigas={vigas} />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="2d" className="mt-0 data-[state=inactive]:hidden" forceMount>
                      <div className="w-full bg-muted/10 rounded-lg overflow-hidden">
                        <Beam2DViewer pilares={pilares} vigas={vigas} />
                      </div>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>

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
