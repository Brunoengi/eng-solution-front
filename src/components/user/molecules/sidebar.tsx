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
    <div className="fixed left-0 top-4 z-40 p-2">
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
            <SidebarMenuButton>
              <Icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu className="border-l border-border pl-2">
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
      <SidebarMenuButton asChild>
        <Link href={item.href || '#'}>
          <Icon className="mr-2 h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ menuItems = [], configItems = [] }: AppSidebarProps) {
  const defaultMenuItems: MenuItem[] = menuItems.length > 0 ? menuItems : [];
  const defaultConfigItems: MenuItem[] = configItems.length > 0 ? configItems : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Eng Solution</h1>
          <SidebarToggle />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {defaultMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {defaultMenuItems.map((item) => (
                  <MenuItemComponent key={item.label} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {defaultConfigItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Configurações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {defaultConfigItems.map((item) => (
                  <MenuItemComponent key={item.label} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
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