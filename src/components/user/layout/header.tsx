'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

export function Header() {
  const [isApiMenuOpen, setIsApiMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openApiMenu = () => {
    clearCloseTimeout();
    setIsApiMenuOpen(true);
  };

  const scheduleCloseApiMenu = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setIsApiMenuOpen(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Eng Solution</h1>
        </div>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <a href="#home">Home</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#about">Sobre</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#contact">Contato</a>
          </Button>

          <div
            className="relative"
            onMouseEnter={openApiMenu}
            onMouseLeave={scheduleCloseApiMenu}
            onFocusCapture={openApiMenu}
            onBlurCapture={(event) => {
              const nextFocused = event.relatedTarget as Node | null;
              if (!event.currentTarget.contains(nextFocused)) {
                scheduleCloseApiMenu();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                clearCloseTimeout();
                setIsApiMenuOpen(false);
              }
            }}
          >
            <Button variant="ghost" asChild>
              <a href="#api" aria-haspopup="menu" aria-expanded={isApiMenuOpen}>
                API
              </a>
            </Button>

            <div
              className={`${isApiMenuOpen ? 'block' : 'hidden'} absolute right-0 top-full z-50 mt-2 w-[min(680px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-background p-4 shadow-sm`}
            >
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Dimensionamento Estrutural
                  </h3>
                  <div className="space-y-2 text-sm">
                    <a href="#viga-concreto" className="block text-muted-foreground hover:text-foreground">
                      Viga de concreto armado
                    </a>
                    <a href="#esforcos" className="block text-muted-foreground hover:text-foreground">
                      Esforços solicitantes
                    </a>
                  </div>
                </div>

                <div className="space-y-3 border-l border-border pl-8">
                  <h3 className="text-sm font-semibold text-foreground">Outros</h3>
                  <div className="space-y-2 text-sm">
                    <a href="/dashboard/geometria" className="block text-muted-foreground hover:text-foreground">
                      Geometria
                    </a>
                    <a href="/dashboard/pilar-segunda-ordem-local" className="block text-muted-foreground hover:text-foreground">
                      Pilar - Segunda ordem local
                    </a>
                    <a href="/dashboard/normas/nbr6118/tabelas" className="block text-muted-foreground hover:text-foreground">
                      Normas NBR
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button variant="default">Login</Button>
        </nav>
      </div>
    </header>
  );
}
