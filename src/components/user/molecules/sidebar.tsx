'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  items?: MenuItem[];
  onClick?: () => void;
  isActive?: boolean;
}

interface AppSidebarProps {
  menuItems?: MenuItem[];
  configItems?: MenuItem[];
  exportItems?: MenuItem[];
  menuGroupLabel?: string;
  configGroupLabel?: string;
  exportGroupLabel?: string;
  centerConfigOnly?: boolean;
  headerClassName?: string;
}

function SidebarToggle() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={`inline-flex items-center justify-center rounded-xl border p-2 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow ${
        state === 'collapsed'
          ? 'border-black bg-black text-white hover:bg-black/90'
          : 'border-border/70 bg-background/90 text-foreground hover:bg-accent/80'
      }`}
      title={state === 'expanded' ? 'Minimizar' : 'Expandir'}
    >
      {state === 'expanded' ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

function SidebarToggleButton() {
  const { state } = useSidebar();

  // Se o sidebar está expandido, não mostra o botão flutuante
  if (state === 'expanded') {
    return null;
  }

  return (
    <div className="fixed left-0 top-4 z-[60] p-2">
      <div className="rounded-md border border-border bg-background">
        <SidebarToggle />
      </div>
    </div>
  );
}

function MenuItemComponent({
  item,
  itemKey,
  openItemKey,
  setOpenItemKey,
}: {
  item: MenuItem;
  itemKey: string;
  openItemKey: string | null;
  setOpenItemKey: (key: string | null) => void;
}) {
  const Icon = item.icon;
  const hasActiveChild = useMemo(
    () => Boolean(item.items?.some((subItem) => subItem.isActive)),
    [item.items],
  );
  const isItemActive = Boolean(item.isActive || hasActiveChild);
  const isOpen = openItemKey === itemKey || (hasActiveChild && openItemKey === null);

  // Se tem subitens, renderiza como collapsible
  if (item.items && item.items.length > 0) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpenItemKey(itemKey);
            return;
          }

          if (openItemKey === itemKey) {
            setOpenItemKey(null);
          }
        }}
        asChild
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className={`rounded-xl border border-transparent transition-all duration-200 hover:border-border/70 hover:bg-accent/80 hover:shadow-sm ${isItemActive ? 'border-border/60 bg-accent/90 font-medium text-accent-foreground shadow-sm' : ''}`}>
              <Icon className="mr-2 h-4 w-4" />
              <span className="text-sm">{item.label}</span>
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu className="ml-2 mt-1 space-y-1 border-l border-border/60 pl-4">
              {item.items.map((subItem, subIndex) => (
                <MenuItemComponent
                  key={`${itemKey}-${subItem.label}-${subIndex}`}
                  item={subItem}
                  itemKey={`${itemKey}-${subItem.label}-${subIndex}`}
                  openItemKey={openItemKey}
                  setOpenItemKey={setOpenItemKey}
                />
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Se não tem subitens, renderiza como link ou button
  return (
    <SidebarMenuItem>
      {item.onClick ? (
        <SidebarMenuButton asChild className={`cursor-pointer rounded-xl border border-transparent transition-all duration-200 hover:border-border/70 hover:bg-accent/80 hover:shadow-sm ${isItemActive ? 'border-border/60 bg-accent/90 font-medium text-accent-foreground shadow-sm' : ''}`}>
          <button type="button" onClick={item.onClick} className="flex w-full items-center">
            <Icon className="mr-2 h-4 w-4" />
            <span className="text-sm">{item.label}</span>
          </button>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton asChild className={`rounded-xl border border-transparent transition-all duration-200 hover:border-border/70 hover:bg-accent/80 hover:shadow-sm ${isItemActive ? 'border-border/60 bg-accent/90 font-medium text-accent-foreground shadow-sm' : ''}`}>
          <Link href={item.href || '#'}>
            <Icon className="mr-2 h-4 w-4" />
            <span className="text-sm">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar({ menuItems = [], configItems = [], exportItems = [], menuGroupLabel = 'Menu Principal', configGroupLabel = 'Configurações', exportGroupLabel = 'Exportar', centerConfigOnly = false, headerClassName = '' }: AppSidebarProps) {
  const defaultMenuItems: MenuItem[] = menuItems.length > 0 ? menuItems : [];
  const defaultConfigItems: MenuItem[] = configItems.length > 0 ? configItems : [];
  const defaultExportItems: MenuItem[] = exportItems.length > 0 ? exportItems : [];
  const isConfigOnly = centerConfigOnly && defaultMenuItems.length === 0 && defaultExportItems.length === 0 && defaultConfigItems.length > 0;
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);

  return (
    <Sidebar className="border-r border-border/60 bg-gradient-to-b from-card via-card to-card/95 shadow-2xl backdrop-blur-sm">
      <SidebarHeader className={`border-b border-border/70 bg-card/90 p-6 backdrop-blur ${headerClassName}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-lg font-bold text-transparent">Eng Solution</h1>
            <SidebarToggle />
          </div>
          <p className="text-xs tracking-wide text-muted-foreground">Sistema de cálculo estrutural</p>
        </div>
      </SidebarHeader>

      <SidebarContent className={`overflow-y-auto p-5 ${isConfigOnly ? 'flex items-center justify-center' : ''}`}>
        <div className={`space-y-6 ${isConfigOnly ? 'w-full' : ''}`}>
          {defaultMenuItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">{menuGroupLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {defaultMenuItems.map((item, index) => (
                    <MenuItemComponent
                      key={`menu-${item.label}-${index}`}
                      item={item}
                      itemKey={`menu-${item.label}-${index}`}
                      openItemKey={openItemKey}
                      setOpenItemKey={setOpenItemKey}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {defaultConfigItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">{configGroupLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {defaultConfigItems.map((item, index) => (
                    <MenuItemComponent
                      key={`config-${item.label}-${index}`}
                      item={item}
                      itemKey={`config-${item.label}-${index}`}
                      openItemKey={openItemKey}
                      setOpenItemKey={setOpenItemKey}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {defaultExportItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">{exportGroupLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {defaultExportItems.map((item, index) => (
                    <MenuItemComponent
                      key={`export-${item.label}-${index}`}
                      item={item}
                      itemKey={`export-${item.label}-${index}`}
                      openItemKey={openItemKey}
                      setOpenItemKey={setOpenItemKey}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-border/70 bg-card/90 p-5 backdrop-blur">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="rounded-xl border border-transparent transition-all duration-200 hover:border-border/70 hover:bg-accent/80 hover:shadow-sm">
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
export { SidebarToggleButton };