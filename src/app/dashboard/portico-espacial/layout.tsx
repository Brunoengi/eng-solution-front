import type { ReactNode } from 'react';

import { Frame3DWorkspaceProvider } from '@/features/portico-espacial/context/frame-3d-workspace-provider';

export default function PorticoEspacialLayout({ children }: { children: ReactNode }) {
  return <Frame3DWorkspaceProvider>{children}</Frame3DWorkspaceProvider>;
}
