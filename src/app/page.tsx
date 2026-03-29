import { GridContainer } from '../components/user/layout/grid-layout';
import { Header } from '../components/user/layout/header';
import { HomeApiStandards } from '@/components/user/molecules/home-api-standards';
import { HomeFinalCta } from '@/components/user/molecules/home-final-cta';
import { HomeHero } from '@/components/user/molecules/home-hero';
import { HomeModulesGrid } from '@/components/user/molecules/home-modules-grid';
import { HomeTrustStrip } from '@/components/user/molecules/home-trust-strip';
import { HomeWorkflow } from '@/components/user/molecules/home-workflow';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[rgb(246,247,251)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.4),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.55),transparent_78%)]" />
      <Header />
      <main className="relative z-10 flex-1">
        <GridContainer className="max-w-[1440px] space-y-6 pb-16 pt-4 md:space-y-8 md:pb-24 md:pt-5">
          <div className="flex min-h-[calc(100svh-6.5rem)] items-center xl:min-h-[calc(100svh-7rem)]">
            <HomeHero />
          </div>
          <HomeTrustStrip />
          <HomeModulesGrid />
          <HomeWorkflow />
          <HomeApiStandards />
          <HomeFinalCta />
        </GridContainer>
      </main>
    </div>
  );
}
