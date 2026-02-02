'use client';

import { Button } from '@/components/ui/button';

export function Header() {
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
          <Button variant="default">Login</Button>
        </nav>
      </div>
    </header>
  );
}
