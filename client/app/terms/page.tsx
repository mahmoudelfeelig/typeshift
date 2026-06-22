import type { Metadata } from "next";
import { LegalShell } from "../../src/components/LegalShell";
import { getLegalConfig } from "../../src/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | TypeShift Station",
};

export default function TermsPage() {
  const legal = getLegalConfig();

  return (
    <LegalShell
      eyebrow="Terms of Service"
      title="Terms of Service"
      intro="These terms govern access to TypeShift Station, including gameplay, account use, leaderboards, shared replays, and webhook integrations."
    >
      <article className="legal-card">
        <h2>Operator</h2>
        <p>{legal.controllerName}</p>
        <p>
          Support contact: <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>
        </p>
      </article>

      <article className="legal-card">
        <h2>Account rules</h2>
        <ul className="legal-list">
          <li>You are responsible for the security of your handle and password.</li>
          <li>You must not automate score submission, abuse multiplayer endpoints, or bypass anti-cheat checks.</li>
          <li>You must not use webhook targets or replay sharing to deliver malicious, unlawful, or abusive content.</li>
        </ul>
      </article>

      <article className="legal-card">
        <h2>No-recovery policy</h2>
        <p>
          Unless the operator explicitly enables an email recovery system in a future release, there is no password
          recovery flow. You should use a password manager and keep your own recovery records.
        </p>
        <p>While signed in, you can still change your password and review or revoke active sessions.</p>
      </article>

      <article className="legal-card">
        <h2>Leaderboards and moderation</h2>
        <p>
          The service may filter, reject, or remove runs, names, replay shares, webhook registrations, or accounts
          that violate fair-play, security, or acceptable-use rules.
        </p>
      </article>

      <article className="legal-card">
        <h2>Termination and deletion</h2>
        <p>
          You may stop using the service at any time, revoke sessions, export account data, and request account
          deletion from the Profile page. The operator may suspend or remove access for abuse, fraud, or security
          reasons.
        </p>
      </article>

      <article className="legal-card">
        <h2>Warranty and liability</h2>
        <p>
          The service is provided on an as-available basis. To the maximum extent permitted by law, the operator does
          not guarantee uninterrupted availability, perfect score retention, or fitness for a particular purpose.
        </p>
      </article>
    </LegalShell>
  );
}
