import React, { useEffect } from 'react';
import '../components/landing/landingAnimations.css';
import LandingAnnouncement  from '../components/landing/LandingAnnouncement.jsx';
import LandingNavbar        from '../components/landing/LandingNavbar.jsx';
import LandingHero          from '../components/landing/LandingHero.jsx';
import LandingBuiltFor      from '../components/landing/LandingBuiltFor.jsx';
import LandingMarquee       from '../components/landing/LandingMarquee.jsx';
import LandingProblem       from '../components/landing/LandingProblem.jsx';
import LandingPlatform      from '../components/landing/LandingPlatform.jsx';
import LandingHowItWorks    from '../components/landing/LandingHowItWorks.jsx';
import LandingCapabilities  from '../components/landing/LandingCapabilities.jsx';
import LandingDigitalTwin   from '../components/landing/LandingDigitalTwin.jsx';
import LandingOptimizer     from '../components/landing/LandingOptimizer.jsx';
import LandingWhatIf        from '../components/landing/LandingWhatIf.jsx';
import LandingTransparency  from '../components/landing/LandingTransparency.jsx';
import LandingCTA           from '../components/landing/LandingCTA.jsx';
import LandingFooter        from '../components/landing/LandingFooter.jsx';

export default function LandingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="rs-page min-h-screen overflow-x-hidden">

      {/* Announcement bar */}
      <LandingAnnouncement />

      {/* Navigation */}
      <LandingNavbar />

      <main>
        {/* 1. Hero — the corridor's world on an orbit sphere */}
        <LandingHero />

        {/* 2. Built for — SIH 2.0, Ministry of Railways, OR-Tools CP-SAT */}
        <LandingBuiltFor />

        {/* 3. The plan, at a glance — stage + segment cards */}
        <LandingMarquee />

        {/* 4. The Problem — statement with inline photographs */}
        <LandingProblem />

        {/* 5. The Platform — centred intro + three numbered steps */}
        <LandingPlatform />

        {/* 6. How RailSync Works — five fields, one request further along */}
        <LandingHowItWorks />

        {/* 7. Key Capabilities — giant command list */}
        <LandingCapabilities />

        {/* 8. Digital Twin — accent feature, twin fragment on the right */}
        <LandingDigitalTwin />

        {/* 9. Optimisation — solver facts on tiles */}
        <LandingOptimizer />

        {/* 10. What-If Replanning — run-in column */}
        <LandingWhatIf />

        {/* 11. Human in the loop — accent feature, corridor photo */}
        <LandingTransparency />

        {/* 12. Final CTA — big white card, first step already open */}
        <LandingCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
