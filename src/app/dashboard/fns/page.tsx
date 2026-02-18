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
  Link,
  Home,
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

interface CarregamentoPontual {
  id: string;
  position: number; // posição no eixo X (cm)
  magnitude: number; // força (kN) - negativo = para baixo
}

interface CarregamentoDistribuido {
  id: string;
  startPosition: number; // posição inicial X (cm)
  endPosition: number; // posição final X (cm)
  magnitude: number; // carga por unidade de comprimento (kN/m) - negativo = para baixo
  vigaId?: string; // ID da viga (opcional - se aplicado diretamente em uma viga)
}

export default function FnsPage() {
  // Menu items - Seção Principal
  const menuItems: MenuItem[] = [
    {
      label: 'Elementos e Carregamentos',
      href: '/dashboard/fns',
      icon: Home,
    },
    {
      label: 'Dimensionamento',
      icon: Layers,
      items: [
        { label: 'Armadura Longitudinal', href: '/dashboard/fns/longitudinal', icon: ArrowUpDown },
        { label: 'Armadura Transversal', href: '/dashboard/fns/transversal', icon: Square },
        { label: 'Armadura de Suspensão', href: '/dashboard/fns/suspensao', icon: Link },
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
  const [sheetCarregamentosOpen, setSheetCarregamentosOpen] = useState(false);

  // Keys para resetar formulários (force re-render of uncontrolled inputs)
  const [pilarFormKey, setPilarFormKey] = useState(0);
  const [vigaFormKey, setVigaFormKey] = useState(0);
  const [cargaPontualFormKey, setCargaPontualFormKey] = useState(0);
  const [cargaDistFormKey, setCargaDistFormKey] = useState(0);

  // Estado para carregamentos
  const [carregamentosPontuais, setCarregamentosPontuais] = useState<CarregamentoPontual[]>([]);
  const [carregamentosDistribuidos, setCarregamentosDistribuidos] = useState<CarregamentoDistribuido[]>([]);
  
  // Formulários para novos carregamentos
  const [newCarregamentoPontual, setNewCarregamentoPontual] = useState({ position: 0, magnitude: -10 });
  const [newCarregamentoDistribuido, setNewCarregamentoDistribuido] = useState({ 
    startPosition: 0, 
    endPosition: 100, 
    magnitude: -5,
    tipoDefinicao: 'viga' as 'posicao' | 'viga',
    vigaId: ''
  });

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

  // Função para renumerar pilares e vigas da esquerda para a direita
  const renumerarPilares = (pilaresAtuais: Pilar[], vigasAtuais: Viga[]) => {
    // Ordenar pilares por posição (da esquerda para a direita)
    const pilaresOrdenados = [...pilaresAtuais].sort((a, b) => a.position - b.position);
    
    // Criar mapeamento de IDs antigos para novos dos pilares
    const mapeamentoPilaresIds = new Map<string, string>();
    pilaresOrdenados.forEach((pilar, index) => {
      const novoId = `P${index + 1}`;
      mapeamentoPilaresIds.set(pilar.id, novoId);
    });
    
    // Atualizar IDs dos pilares
    const pilaresRenumerados = pilaresOrdenados.map((pilar, index) => ({
      ...pilar,
      id: `P${index + 1}`
    }));
    
    // Atualizar referências dos pilares nas vigas
    const vigasComPilaresAtualizados = vigasAtuais.map(viga => ({
      ...viga,
      startPillarId: viga.startPillarId ? mapeamentoPilaresIds.get(viga.startPillarId) : undefined,
      endPillarId: viga.endPillarId ? mapeamentoPilaresIds.get(viga.endPillarId) : undefined
    }));

    // Ordenar vigas por posição inicial (startPosition) da esquerda para a direita
    const vigasOrdenadas = [...vigasComPilaresAtualizados].sort((a, b) => {
      const posA = Math.min(a.startPosition, a.endPosition);
      const posB = Math.min(b.startPosition, b.endPosition);
      return posA - posB;
    });

    // Criar mapeamento de IDs antigos para novos das vigas
    const mapeamentoVigasIds = new Map<string, string>();
    vigasOrdenadas.forEach((viga, index) => {
      const novoId = `V${index + 1}`;
      mapeamentoVigasIds.set(viga.id, novoId);
    });

    // Renumerar vigas
    const vigasRenumeradas = vigasOrdenadas.map((viga, index) => ({
      ...viga,
      id: `V${index + 1}`
    }));

    // Atualizar referências de vigaId nos carregamentos distribuídos
    setCarregamentosDistribuidos(prev => prev.map(carga => ({
      ...carga,
      vigaId: carga.vigaId && mapeamentoVigasIds.has(carga.vigaId) 
        ? mapeamentoVigasIds.get(carga.vigaId) 
        : carga.vigaId
    })));
    
    return { pilares: pilaresRenumerados, vigas: vigasRenumeradas };
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
    
    const pilaresTemp = [...pilares, newPilarObj];

    // Criar vigas automaticamente entre pilares adjacentes
    const sortedPilares = [...pilaresTemp].sort((a, b) => a.position - b.position);
    const index = sortedPilares.findIndex(p => p.id === newId);
    
    let vigasTemp = [...vigas];
    
    // Criar viga à esquerda se houver pilar anterior
    if (index > 0) {
      const prevPilar = sortedPilares[index - 1];
      const newVigaId = `V${vigasTemp.length + 1}`;
      const newVigaObj: Viga = {
        id: newVigaId,
        width: 20,
        height: 40,
        startPosition: prevPilar.position,
        endPosition: newPilarObj.position,
        startPillarId: prevPilar.id,
        endPillarId: newPilarObj.id,
      };
      vigasTemp = [...vigasTemp, newVigaObj];
    }
    
    // Criar viga à direita se houver pilar posterior
    if (index < sortedPilares.length - 1) {
      const nextPilar = sortedPilares[index + 1];
      const newVigaId = `V${vigasTemp.length + 1}`;
      const newVigaObj: Viga = {
        id: newVigaId,
        width: 20,
        height: 40,
        startPosition: newPilarObj.position,
        endPosition: nextPilar.position,
        startPillarId: newPilarObj.id,
        endPillarId: nextPilar.id,
      };
      vigasTemp = [...vigasTemp, newVigaObj];
    }

    // Renumerar pilares e atualizar vigas
    const { pilares: pilaresRenumerados, vigas: vigasAtualizadas } = renumerarPilares(pilaresTemp, vigasTemp);
    
    setPilares(pilaresRenumerados);
    setVigas(vigasAtualizadas);
    setNewPilar({ width: 20, position: 0 });
    setPilarFormKey(prev => prev + 1); // Reset form
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
    
    const vigasTemp = [...vigas, newVigaObj];

    // Renumerar vigas após adicionar
    const { pilares: pilaresAtualizados, vigas: vigasRenumeradas } = renumerarPilares(pilares, vigasTemp);
    
    setPilares(pilaresAtualizados);
    setVigas(vigasRenumeradas);
    setNewViga({ width: 20, height: 40, length: 100, direction: 'right' });
    setVigaFormKey(prev => prev + 1); // Reset form
  };

  // Função para resetar toda a estrutura
  const resetAll = () => {
    if (window.confirm('Tem certeza que deseja remover tudo? Esta ação não pode ser desfeita.')) {
      setPilares([]);
      setVigas([]);
      setCarregamentosPontuais([]);
      setCarregamentosDistribuidos([]);
    }
  };

  // Função para remover pilar (apenas pilares de canto)
  const removePilar = (id: string) => {
    // Ordenar pilares por posição
    const pilaresOrdenados = [...pilares].sort((a, b) => a.position - b.position);
    
    // Verificar se é pilar de canto (primeiro ou último)
    const isCornerPillar = pilaresOrdenados[0].id === id || pilaresOrdenados[pilaresOrdenados.length - 1].id === id;
    
    if (!isCornerPillar) {
      alert('Apenas pilares de canto (extremidades) podem ser excluídos.');
      return;
    }
    
    // Encontrar vigas conectadas ao pilar
    const vigasParaRemover = vigas.filter(v => v.startPillarId === id || v.endPillarId === id);
    
    // Remover carregamentos das vigas que serão removidas
    vigasParaRemover.forEach(viga => {
      // Remover carregamentos distribuídos associados à viga
      setCarregamentosDistribuidos(prev => prev.filter(c => c.vigaId !== viga.id));
      
      // Remover carregamentos pontuais que estão dentro do intervalo da viga
      setCarregamentosPontuais(prev => prev.filter(c => {
        const vigaMin = Math.min(viga.startPosition, viga.endPosition);
        const vigaMax = Math.max(viga.startPosition, viga.endPosition);
        return c.position < vigaMin || c.position > vigaMax;
      }));
    });
    
    // Remover vigas conectadas
    const vigasRestantes = vigas.filter(v => v.startPillarId !== id && v.endPillarId !== id);
    
    // Remover pilar
    const pilaresRestantes = pilares.filter(p => p.id !== id);
    
    // Renumerar pilares e atualizar vigas
    const { pilares: pilaresRenumerados, vigas: vigasAtualizadas } = renumerarPilares(pilaresRestantes, vigasRestantes);
    
    setPilares(pilaresRenumerados);
    setVigas(vigasAtualizadas);
  };

  // Função para remover viga
  const removeViga = (id: string) => {
    const viga = vigas.find(v => v.id === id);
    if (!viga) return;
    
    // Remover carregamentos distribuídos associados à viga
    setCarregamentosDistribuidos(prev => prev.filter(c => c.vigaId !== id));
    
    // Remover carregamentos pontuais que estão dentro do intervalo da viga
    setCarregamentosPontuais(prev => prev.filter(c => {
      const vigaMin = Math.min(viga.startPosition, viga.endPosition);
      const vigaMax = Math.max(viga.startPosition, viga.endPosition);
      return c.position < vigaMin || c.position > vigaMax;
    }));
    
    // Remover viga
    const vigasRestantes = vigas.filter(v => v.id !== id);

    // Renumerar vigas após remoção
    const { pilares: pilaresAtualizados, vigas: vigasRenumeradas } = renumerarPilares(pilares, vigasRestantes);
    
    setPilares(pilaresAtualizados);
    setVigas(vigasRenumeradas);
  };

  // Funções para gerenciar carregamentos pontuais
  const addCarregamentoPontual = () => {
    // Validar se a posição está dentro da estrutura
    const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
    const minPos = Math.min(...allPositions);
    const maxPos = Math.max(...allPositions);
    
    if (newCarregamentoPontual.position < minPos || newCarregamentoPontual.position > maxPos) {
      alert(`A posição do carregamento deve estar entre ${minPos} cm e ${maxPos} cm`);
      return;
    }
    
    const newId = `CP${carregamentosPontuais.length + 1}`;
    const newCarregamento: CarregamentoPontual = {
      id: newId,
      position: newCarregamentoPontual.position,
      magnitude: newCarregamentoPontual.magnitude,
    };
    
    setCarregamentosPontuais([...carregamentosPontuais, newCarregamento]);
    setNewCarregamentoPontual({ position: 0, magnitude: -10 });
    setCargaPontualFormKey(prev => prev + 1); // Reset form
  };

  const removeCarregamentoPontual = (id: string) => {
    setCarregamentosPontuais(carregamentosPontuais.filter(c => c.id !== id));
  };

  // Funções para gerenciar carregamentos distribuídos
  const addCarregamentoDistribuido = () => {
    let startPos = newCarregamentoDistribuido.startPosition;
    let endPos = newCarregamentoDistribuido.endPosition;
    let vigaId: string | undefined = undefined;
    
    // Se definido por viga, usar posições da viga
    if (newCarregamentoDistribuido.tipoDefinicao === 'viga') {
      const viga = vigas.find(v => v.id === newCarregamentoDistribuido.vigaId);
      if (!viga) {
        alert('Selecione uma viga válida');
        return;
      }
      startPos = viga.startPosition;
      endPos = viga.endPosition;
      vigaId = viga.id;
    } else {
      // Validar se as posições estão dentro da estrutura
      const allPositions = [...pilares.map(p => p.position), ...vigas.flatMap(v => [v.startPosition, v.endPosition])];
      const minPos = Math.min(...allPositions);
      const maxPos = Math.max(...allPositions);
      
      if (startPos < minPos || startPos > maxPos || endPos < minPos || endPos > maxPos) {
        alert(`As posições do carregamento devem estar entre ${minPos} cm e ${maxPos} cm`);
        return;
      }
      
      if (startPos >= endPos) {
        alert('A posição inicial deve ser menor que a posição final');
        return;
      }
    }
    
    const newId = `CD${carregamentosDistribuidos.length + 1}`;
    const newCarregamento: CarregamentoDistribuido = {
      id: newId,
      startPosition: startPos,
      endPosition: endPos,
      magnitude: newCarregamentoDistribuido.magnitude,
      vigaId: vigaId,
    };
    
    setCarregamentosDistribuidos([...carregamentosDistribuidos, newCarregamento]);
    setNewCarregamentoDistribuido({ 
      startPosition: 0, 
      endPosition: 100, 
      magnitude: -5,
      tipoDefinicao: 'viga',
      vigaId: ''
    });
    setCargaDistFormKey(prev => prev + 1); // Reset form
  };

  const removeCarregamentoDistribuido = (id: string) => {
    setCarregamentosDistribuidos(carregamentosDistribuidos.filter(c => c.id !== id));
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
          <main className="container mx-auto px-4 md:px-6 lg:px-8 h-[calc(100vh-120px)] flex items-center justify-center">
            <div className="w-full max-w-7xl">
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
                            Gerenciar elementos
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Gerenciar Estrutura</SheetTitle>
                            <SheetDescription>
                              Adicione, edite ou remova pilares e vigas da estrutura
                            </SheetDescription>
                          </SheetHeader>
                          
                          {/* Botão Reset */}
                          <div className="mt-4">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={resetAll}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Resetar Tudo
                            </Button>
                          </div>
                          
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
                              <div key={pilarFormKey} className="border rounded-lg p-4 space-y-3">
                                <h5 className="text-xs font-semibold">Adicionar Pilar (Cria Viga Automaticamente)</h5>
                                <p className="text-xs text-muted-foreground">Ao adicionar um pilar, vigas serão criadas automaticamente entre pilares adjacentes</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor="pilar-width" className="text-xs">Largura (cm)</Label>
                                    <Input
                                      id="pilar-width"
                                      type="number"
                                      defaultValue={newPilar.width}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewPilar({ ...newPilar, width: val });
                                        }
                                      }}
                                      className="h-8 text-xs"
                                      step="any"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="pilar-position" className="text-xs">Posição X (cm)</Label>
                                    <Input
                                      id="pilar-position"
                                      type="number"
                                      defaultValue={newPilar.position}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewPilar({ ...newPilar, position: val });
                                        }
                                      }}
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
                              <div key={vigaFormKey} className="border rounded-lg p-4 space-y-3">
                                <h5 className="text-xs font-semibold">Adicionar Viga em Balanço</h5>
                                <p className="text-xs text-muted-foreground">Cria uma viga em balanço na extremidade esquerda ou direita</p>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor="viga-width" className="text-xs">Largura b (cm)</Label>
                                      <Input
                                        id="viga-width"
                                        type="number"
                                        defaultValue={newViga.width}
                                        onChange={(e) => {
                                          const val = e.target.valueAsNumber;
                                          if (!isNaN(val)) {
                                            setNewViga({ ...newViga, width: val });
                                          }
                                        }}
                                        className="h-8 text-xs"
                                        step="any"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="viga-height" className="text-xs">Altura h (cm)</Label>
                                      <Input
                                        id="viga-height"
                                        type="number"
                                        defaultValue={newViga.height}
                                        onChange={(e) => {
                                          const val = e.target.valueAsNumber;
                                          if (!isNaN(val)) {
                                            setNewViga({ ...newViga, height: val });
                                          }
                                        }}
                                        className="h-8 text-xs"
                                        step="any"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="viga-length" className="text-xs">Comprimento do Balanço (cm)</Label>
                                    <Input
                                      id="viga-length"
                                      type="number"
                                      defaultValue={newViga.length}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewViga({ ...newViga, length: val });
                                        }
                                      }}
                                      className="h-8 text-xs"
                                      step="any"
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
                      
                      {/* Botão para gerenciar carregamentos */}
                      <Sheet open={sheetCarregamentosOpen} onOpenChange={setSheetCarregamentosOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Layers className="h-4 w-4 mr-2" />
                            Gerenciar carregamentos
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Gerenciar Carregamentos</SheetTitle>
                            <SheetDescription>
                              Adicione, edite ou remova carregamentos aplicados na estrutura
                            </SheetDescription>
                          </SheetHeader>
                          
                          <div className="mt-6 space-y-6">
                            {/* Seção Carregamentos Pontuais */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Carregamentos Pontuais</h4>
                              <div className="space-y-2 mb-4">
                                {carregamentosPontuais.map((carga) => (
                                  <div key={carga.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">{carga.id}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Posição: {carga.position} cm | Magnitude: {carga.magnitude} kN
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCarregamentoPontual(carga.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              <div key={cargaPontualFormKey} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <h5 className="text-xs font-semibold">Adicionar Carregamento Pontual</h5>
                                <div className="space-y-2">
                                  <div>
                                    <Label htmlFor="carga-pontual-position" className="text-xs">Posição X (cm)</Label>
                                    <Input
                                      id="carga-pontual-position"
                                      type="number"
                                      step="any"
                                      defaultValue={newCarregamentoPontual.position}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewCarregamentoPontual({
                                            ...newCarregamentoPontual,
                                            position: val
                                          });
                                        }
                                      }}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="carga-pontual-magnitude" className="text-xs">
                                      Magnitude (kN) - Negativo = ↓
                                    </Label>
                                    <Input
                                      id="carga-pontual-magnitude"
                                      type="number"
                                      step="any"
                                      defaultValue={newCarregamentoPontual.magnitude}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewCarregamentoPontual({
                                            ...newCarregamentoPontual,
                                            magnitude: val
                                          });
                                        }
                                      }}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                <Button onClick={addCarregamentoPontual} size="sm" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Carregamento Pontual
                                </Button>
                              </div>
                            </div>

                            {/* Seção Carregamentos Distribuídos */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Carregamentos Distribuídos</h4>
                              <div className="space-y-2 mb-4">
                                {carregamentosDistribuidos.map((carga) => (
                                  <div key={carga.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">
                                        {carga.id} {carga.vigaId && `(${carga.vigaId})`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        De {carga.startPosition} cm até {carga.endPosition} cm | {carga.magnitude} kN/m
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCarregamentoDistribuido(carga.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              
                              <div key={cargaDistFormKey} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <h5 className="text-xs font-semibold">Adicionar Carregamento Distribuído</h5>
                                <div className="space-y-2">
                                  <div>
                                    <Label htmlFor="carga-dist-tipo" className="text-xs">Definir por</Label>
                                    <Select
                                      value={newCarregamentoDistribuido.tipoDefinicao}
                                      onValueChange={(value: 'posicao' | 'viga') => 
                                        setNewCarregamentoDistribuido({
                                          ...newCarregamentoDistribuido,
                                          tipoDefinicao: value
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="posicao">Posição (X inicial e final)</SelectItem>
                                        <SelectItem value="viga">Viga específica</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {newCarregamentoDistribuido.tipoDefinicao === 'posicao' ? (
                                    <>
                                      <div>
                                        <Label htmlFor="carga-dist-start" className="text-xs">Posição Inicial X (cm)</Label>
                                        <Input
                                          id="carga-dist-start"
                                          type="number"
                                          step="any"
                                          defaultValue={newCarregamentoDistribuido.startPosition}
                                          onChange={(e) => {
                                            const val = e.target.valueAsNumber;
                                            if (!isNaN(val)) {
                                              setNewCarregamentoDistribuido({
                                                ...newCarregamentoDistribuido,
                                                startPosition: val
                                              });
                                            }
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="carga-dist-end" className="text-xs">Posição Final X (cm)</Label>
                                        <Input
                                          id="carga-dist-end"
                                          type="number"
                                          step="any"
                                          defaultValue={newCarregamentoDistribuido.endPosition}
                                          onChange={(e) => {
                                            const val = e.target.valueAsNumber;
                                            if (!isNaN(val)) {
                                              setNewCarregamentoDistribuido({
                                                ...newCarregamentoDistribuido,
                                                endPosition: val
                                              });
                                            }
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <div>
                                      <Label htmlFor="carga-dist-viga" className="text-xs">Selecionar Viga</Label>
                                      <Select
                                        value={newCarregamentoDistribuido.vigaId}
                                        onValueChange={(value) => 
                                          setNewCarregamentoDistribuido({
                                            ...newCarregamentoDistribuido,
                                            vigaId: value
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Selecione uma viga" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {vigas.map((viga) => (
                                            <SelectItem key={viga.id} value={viga.id}>
                                              {viga.id} ({viga.startPosition} cm a {viga.endPosition} cm)
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  <div>
                                    <Label htmlFor="carga-dist-magnitude" className="text-xs">
                                      Magnitude (kN/m) - Negativo = ↓
                                    </Label>
                                    <Input
                                      id="carga-dist-magnitude"
                                      type="number"
                                      step="any"
                                      defaultValue={newCarregamentoDistribuido.magnitude}
                                      onChange={(e) => {
                                        const val = e.target.valueAsNumber;
                                        if (!isNaN(val)) {
                                          setNewCarregamentoDistribuido({
                                            ...newCarregamentoDistribuido,
                                            magnitude: val
                                          });
                                        }
                                      }}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                <Button onClick={addCarregamentoDistribuido} size="sm" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Carregamento Distribuído
                                </Button>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                  <div>
                    <TabsContent value="3d" className="!mt-0 data-[state=inactive]:hidden" forceMount>
                      <div className="w-full h-[60vh] bg-muted/20 rounded-lg relative flex items-center justify-center">
                        <Beam3DViewer 
                          pilares={pilares} 
                          vigas={vigas} 
                          carregamentosPontuais={carregamentosPontuais}
                          carregamentosDistribuidos={carregamentosDistribuidos}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="2d" className="!mt-0 data-[state=inactive]:hidden" forceMount>
                      <div className="w-full h-[60vh] bg-muted/10 rounded-lg overflow-hidden flex items-center justify-center">
                        <Beam2DViewer 
                          pilares={pilares} 
                          vigas={vigas}
                          carregamentosPontuais={carregamentosPontuais}
                          carregamentosDistribuidos={carregamentosDistribuidos}
                        />
                      </div>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      
      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-4 z-40">
        <div className="container mx-auto">
          <p className="text-xs text-center text-muted-foreground">
            Os cálculos seguem as recomendações da NBR 6118:2023
          </p>
        </div>
      </footer>
    </SidebarProvider>
  );
}
