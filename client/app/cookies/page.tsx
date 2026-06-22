import type { Metadata } from "next";
import { LegalShell } from "../../src/components/LegalShell";
import { storageEntries } from "../../src/lib/legal";

export const metadata: Metadata = {
  title: "Cookie and Storage Policy | TypeShift Station",
};

export default function CookiesPage() {
  return (
    <LegalShell
      eyebrow="Cookie + Storage Policy"
      title="Cookie and Storage Policy"
      intro="TypeShift Station does not enable tracking cookies by default. This page lists the browser storage used by the app, why it is used, and whether it is essential or optional."
    >
      <article className="legal-card">
        <h2>Cookies</h2>
        <p>
          The app does not set marketing cookies or third-party analytics cookies by default. Optional anonymous usage
          analytics are implemented as aggregate server-side counts and do not require advertising or cross-site
          trackers.
        </p>
      </article>

      <article className="legal-card">
        <h2>Browser storage used by the app</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Purpose</th>
              <th>Required</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            {storageEntries.map((entry) => (
              <tr key={entry.key}>
                <td>{entry.key}</td>
                <td>{entry.purpose}</td>
                <td>{entry.required}</td>
                <td>{entry.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="legal-card">
        <h2>Optional storage</h2>
        <p>
          Comfort-setting storage is optional and off until the user allows it. When disabled, the app removes
          non-essential comfort keys rather than continuing to retain them silently.
        </p>
      </article>

      <article className="legal-card">
        <h2>How to clear storage</h2>
        <ul className="legal-list">
          <li>Use the Privacy page to switch back to essentials-only storage.</li>
          <li>Use your browser site-data controls to clear local storage and service worker caches.</li>
          <li>Log out or delete your account to clear server-side account records that relate to you.</li>
        </ul>
      </article>
    </LegalShell>
  );
}
