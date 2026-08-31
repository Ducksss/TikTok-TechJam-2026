'use client';

/* oxlint-disable next/no-html-link-for-pages -- the compatibility page must work before client hydration and vinext's next/link prefetch shim is not reliable in production. */
import { useEffect } from 'react';

export function ArchitectureCompatibilityRedirect() {
  useEffect(() => {
    window.location.replace(`/documentation${window.location.hash}`);
  }, []);

  return (
    <main className="docs-page docs-redirect-page">
      <section aria-labelledby="redirect-title" className="docs-redirect-card">
        <p className="docs-eyebrow">Documentation consolidated</p>
        <h1 id="redirect-title">The architecture atlas has moved.</h1>
        <p>
          You are being sent to the same section in the unified technical
          documentation.
        </p>
        <a href="/documentation">Open documentation</a>
        <noscript>
          <p>
            JavaScript is unavailable. Use the link above to open the unified
            documentation.
          </p>
        </noscript>
      </section>
    </main>
  );
}
