'use client';

import Link from 'next/link';
import { useState } from 'react';
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
}

interface AppSidebarProps {
  menuItems?: MenuItem[];
  configItems?: MenuItem[];
  exportItems?: MenuItem[];
  menuGroupLabel?: string;
  configGroupLabel?: string;
  exportGroupLabel?: string;
}

function SidebarToggle() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="inline-flex items-center justify-center rounded-md border border-border bg-background p-2 text-foreground hover:bg-accent"
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

function MenuItemComponent({ item }: { item: MenuItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  // Se tem subitens, renderiza como collapsible
  if (item.items && item.items.length > 0) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="hover:bg-accent rounded-md">
              <Icon className="mr-2 h-4 w-4" />
              <span className="text-sm">{item.label}</span>
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu className="border-l border-border pl-4 ml-2 mt-1 space-y-1">
              {item.items.map((subItem) => (
                <MenuItemComponent key={subItem.label} item={subItem} />
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Se não tem subitens, renderiza como link
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="hover:bg-accent rounded-md">
        <Link href={item.href || '#'}>
          <Icon className="mr-2 h-4 w-4" />
          <span className="text-sm">{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ menuItems = [], configItems = [], exportItems = [], menuGroupLabel = 'Menu Principal', configGroupLabel = 'Configurações', exportGroupLabel = 'Exportar' }: AppSidebarProps) {
  const defaultMenuItems: MenuItem[] = menuItems.length > 0 ? menuItems : [];
  const defaultConfigItems: MenuItem[] = configItems.length > 0 ? configItems : [];
  const defaultExportItems: MenuItem[] = exportItems.length > 0 ? exportItems : [];

  return (
    <Sidebar className="border-r shadow-lg">
      <SidebarHeader className="border-b bg-card p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Eng Solution</h1>
            <SidebarToggle />
          </div>
          <p className="text-sm text-muted-foreground">Sistema de cálculo estrutural</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto p-6">
        <div className="space-y-6">
          {defaultMenuItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold mb-3">{menuGroupLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {defaultMenuItems.map((item) => (
                    <MenuItemComponent key={item.label} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {defaultExportItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold mb-3">{exportGroupLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {defaultExportItems.map((item) => (
                    <MenuItemComponent key={item.label} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {defaultConfigItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold mb-3">{configGroupLabel}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {defaultConfigItems.map((item) => (
                    <MenuItemComponent key={item.label} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t bg-card p-6 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-accent">
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