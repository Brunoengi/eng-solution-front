import type { ReactNode } from 'react';
import { VigaConcretoArmadoProvider } from '@/features/viga-concreto-armado/context/viga-concreto-armado-provider';

export default function VigaConcretoArmadoLayout({ children }: { children: ReactNode }) {
  return <VigaConcretoArmadoProvider>{children}</VigaConcretoArmadoProvider>;
}
