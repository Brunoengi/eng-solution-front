'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Boxes, Braces, DraftingCompass, Ruler } from 'lucide-react';

import { Button } from '@/components/ui/button';

const navigationLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Módulos', href: '#modules' },
  { label: 'Fluxo', href: '#workflow' },
  { label: 'API', href: '#api' },
];

const apiGroups = [
  {
    title: 'Dimensionamento estrutural',
    items: [
      {
        label: 'Viga de concreto armado',
        description: 'Fluxo de dimensionamento, entradas e verificações.',
        href: '/dashboard/viga-concreto-armado',
        icon: Ruler,
      },
    ],
  },
  {
    title: 'Modelo estrutural',
    items: [
      {
        label: 'Viga contínua',
        description: 'Modelagem e visualização para análise estrutural.',
        href: '/dashboard/viga-continua',
        icon: Boxes,
      },
      {
        label: 'Pórtico plano',
        description: 'Experiência para cenários planos e evolução visual.',
        href: '/dashboard/portico-plano',
        icon: DraftingCompass,
      },
      {
        label: 'Pórtico espacial',
        description: 'Fluxo 3D com vínculos por GDL, visualização híbrida e diagramas.',
        href: '/dashboard/portico-espacial',
        icon: Boxes,
      },
    ],
  },
  {
    title: 'Biblioteca e apoio',
    items: [
      {
        label: 'Geometria',
        description: 'Ponto de partida para montagem do problema estrutural.',
        href: '/dashboard/geometria',
        icon: DraftingCompass,
      },
      {
        label: 'Biblioteca de normas',
        description: 'Consulta de conteúdo técnico dentro do ecossistema.',
        href: '/dashboard/normas',
        icon: BookOpen,
      },
      {
        label: 'Pilar em segunda ordem',
        description: 'Módulo especializado para verificações específicas.',
        href: '/dashboard/pilar-segunda-ordem-local',
        icon: Braces,
      },
    ],
  },
];

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
    <header className="sticky top-0 z-50 border-b border-[rgba(226,232,240,0.74)] bg-[rgba(246,247,251,0.82)] shadow-[0_14px_30px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1440px] px-4">
        <div className="flex min-h-[4.5rem] flex-wrap items-center justify-between gap-4 py-2.5 lg:flex-nowrap">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(14,116,144,0.18)] bg-[linear-gradient(135deg,rgba(14,116,144,0.16),rgba(15,23,42,0.08))] text-[rgb(15,23,42)] shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)]">
              <DraftingCompass className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgb(14,116,144)]">Structural workspace</p>
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-[rgb(15,23,42)]">Eng Solution</h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigationLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className="rounded-full px-4 text-[rgb(51,65,85)] hover:bg-white/80 hover:text-[rgb(15,23,42)]"
              >
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div
              className="relative hidden lg:block"
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
              <Button
                variant="ghost"
                asChild
                className="rounded-full px-4 text-[rgb(51,65,85)] hover:bg-white/80 hover:text-[rgb(15,23,42)]"
              >
                <a href="#api" aria-haspopup="menu" aria-expanded={isApiMenuOpen}>
                  Explorar plataforma
                </a>
              </Button>

              <div
                className={`${isApiMenuOpen ? 'block' : 'hidden'} absolute right-0 top-full z-50 mt-3 w-[min(980px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.8rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.94))] p-5 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.45)]`}
              >
                <div className="grid gap-5 md:grid-cols-3">
                  {apiGroups.map(({ title, items }) => (
                    <div
                      key={title}
                      className="rounded-[1.4rem] border border-[rgba(148,163,184,0.16)] bg-white/72 p-4"
                    >
                      <h2 className="text-sm font-semibold text-[rgb(15,23,42)]">{title}</h2>
                      <div className="mt-4 space-y-3">
                        {items.map(({ label, description, href, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex gap-3 rounded-2xl p-2 transition-colors hover:bg-[rgba(15,23,42,0.04)]"
                          >
                            <div className="inline-flex h-fit rounded-2xl bg-[rgba(14,116,144,0.1)] p-2 text-[rgb(14,116,144)]">
                              <Icon className="size-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[rgb(15,23,42)]">{label}</p>
                              <p className="mt-1 text-sm leading-6 text-[rgb(71,85,105)]">{description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="hidden rounded-full border-[rgba(15,23,42,0.12)] bg-white/74 px-4 text-[rgb(15,23,42)] hover:bg-white lg:inline-flex"
            >
              <Link href="/dashboard/normas">Normas</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-[rgb(15,23,42)] px-5 text-white hover:bg-[rgb(30,41,59)]"
            >
              <Link href="/dashboard/geometria">
                Entrar na plataforma
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <nav className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-3 lg:hidden">
          {navigationLinks.map((link) => (
            <Button
              key={link.href}
              variant="outline"
              asChild
              className="rounded-full border-[rgba(15,23,42,0.1)] bg-white/72 text-[rgb(51,65,85)] hover:bg-white"
            >
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[rgba(15,23,42,0.1)] bg-white/72 text-[rgb(51,65,85)] hover:bg-white"
          >
            <Link href="/dashboard/normas">Normas</Link>
          </Button>
        </nav>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -bottom-4 h-4 bg-[linear-gradient(180deg,rgba(15,23,42,0.14),rgba(15,23,42,0.05)_45%,transparent)] blur-lg" />
    </header>
  );
}
