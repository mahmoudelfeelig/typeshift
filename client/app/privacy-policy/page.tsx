import type { Metadata } from "next";
import { LegalShell } from "../../src/components/LegalShell";
import { analyticsEvents, getLegalConfig } from "../../src/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | TypeShift Station",
};

export default function PrivacyPolicyPage() {
  const legal = getLegalConfig();

  return (
    <LegalShell
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      intro="This policy explains what personal data TypeShift Station processes, how long it is kept, which analytics are collected in aggregate, and which rights are available to users in the European Union and elsewhere."
    >
      <article className="legal-card">
        <h2>Controller</h2>
        <p>{legal.controllerName}</p>
        <p>{legal.contactAddress}</p>
        <p>
          Privacy contact: <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
        </p>
        {legal.dpoEmail && (
          <p>
            Data protection contact: <a href={`mailto:${legal.dpoEmail}`}>{legal.dpoEmail}</a>
          </p>
        )}
      </article>

      <article className="legal-card">
        <h2>What we process</h2>
        <ul className="legal-list">
          <li>Account data: handle, password hash, locale, account preferences, and active session records.</li>
          <li>Gameplay data: leaderboard scores, challenge scores, replay shares, duel progress, and tournament data.</li>
          <li>Security data: IP and user-agent hashes for session integrity, abuse prevention, and webhook security.</li>
          <li>Aggregate analytics: page and mode usage counts with coarse theme, viewport, and reduced-motion buckets only.</li>
        </ul>
      </article>

      <article className="legal-card">
        <h2>Purposes and legal basis</h2>
        <ul className="legal-list">
          <li>Contract/performance of service: gameplay, accounts, leaderboards, replays, multiplayer, and preferences sync.</li>
          <li>Legitimate interests: security logging, anti-cheat checks, fraud prevention, abuse detection, and service reliability.</li>
          <li>Consent: optional comfort setting storage and optional anonymous usage analytics.</li>
        </ul>
      </article>

      <article className="legal-card">
        <h2>Aggregate analytics</h2>
        <p>Anonymous usage analytics are off by default. When enabled, the service only stores daily aggregate counts for these events:</p>
        <div className="legal-chip-row">
          {analyticsEvents.map((eventName) => (
            <span key={eventName} className="legal-pill">
              {eventName}
            </span>
          ))}
        </div>
        <p>No advertising identifiers, no third-party analytics SDKs, and no cross-site tracking cookies are used.</p>
      </article>

      <article className="legal-card">
        <h2>Retention</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Scores and challenge scores</td>
              <td>{legal.scoreRetentionDays} days by default</td>
            </tr>
            <tr>
              <td>Telemetry attached to certified runs</td>
              <td>{legal.telemetryRetentionDays} days by default</td>
            </tr>
            <tr>
              <td>Account sessions</td>
              <td>Up to 30 days unless revoked earlier</td>
            </tr>
            <tr>
              <td>Webhook delivery logs</td>
              <td>Until account deletion or log rotation policy</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article className="legal-card">
        <h2>Your rights</h2>
        <p>Where EU or UK data protection law applies, you can request access, rectification, erasure, restriction, portability, and objection where applicable.</p>
        <p>
          You can also withdraw consent for optional analytics and optional comfort-setting storage at any time from
          the Privacy page in the app.
        </p>
        <p>
          If you believe your data has been handled unlawfully, you may complain to your local supervisory authority.
        </p>
      </article>

      <article className="legal-card">
        <h2>Account lifecycle</h2>
        <p>
          Logged-in users can change password, export account data, review active sessions, revoke sessions, and delete
          the account from the Profile page.
        </p>
        <p>
          TypeShift Station does not provide email-based password recovery unless the operator explicitly adds it in a
          future release.
        </p>
      </article>
    </LegalShell>
  );
}
