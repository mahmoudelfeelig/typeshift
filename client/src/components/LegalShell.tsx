import Link from "next/link";
import type { ReactNode } from "react";
import { getLegalConfig } from "../lib/legal";
import BrandLogo from "./BrandLogo";
import SiteFooter from "./SiteFooter";

export function LegalShell(input: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const legal = getLegalConfig();

  return (
    <main className="legal-shell">
      <header className="site-header legal-site-header">
        <BrandLogo />
        <nav className="legal-site-nav" aria-label="Main sections">
          <Link href="/">Home</Link>
          <Link href="/games">Games</Link>
          <Link href="/boards">Boards</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </header>
      <section className="legal-hero">
        <p className="home-eyebrow">{input.eyebrow}</p>
        <h1>{input.title}</h1>
        <p>{input.intro}</p>
        <div className="legal-pill-row">
          <span className="legal-pill">{legal.controllerName}</span>
          <span className="legal-pill">{legal.contactEmail}</span>
          <span className="legal-pill">Updated {legal.lastUpdated}</span>
        </div>
        <div className="hero-actions">
          <Link href="/" className="launch-btn">
            Open app
          </Link>
          <Link href="/privacy-policy" className="ghost-btn">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="ghost-btn">
            Cookie + Storage Policy
          </Link>
          <Link href="/terms" className="ghost-btn">
            Terms
          </Link>
        </div>
      </section>
      <section className="legal-stack">{input.children}</section>
      <SiteFooter />
    </main>
  );
}
