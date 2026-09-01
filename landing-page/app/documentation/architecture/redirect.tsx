'use client';

/* oxlint-disable next/no-html-link-for-pages -- the compatibility page must work before client hydration and vinext's next/link prefetch shim is not reliable in production. */
import { useEffect } from 'react';

const legacyHashTargets: Record<string, string> = {
  'architecture-atlas': 'architecture',
  overall: 'operations',
  request: 'operations',
  'video-sampling': 'operations',
  runtime: 'operations',
  checkpoints: 'operations',
  tensors: 'input',
  'deep-model': 'architecture',
  'expert-anatomy': 'architecture',
  'dinov3-context': 'sources',
  release: 'limits',
  operations: 'operations',
  batch: 'operations',
};

export function ArchitectureCompatibilityRedirect() {
  useEffect(() => {
    const legacyId = decodeURIComponent(window.location.hash.slice(1));
    const destinationId = legacyHashTargets[legacyId] ?? legacyId;
    const destinationHash = destinationId ? `#${destinationId}` : '';
    window.location.replace(`/documentation${destinationHash}`);
  }, []);

  return (
    <main className="docs-page docs-redirect-page">
      <section aria-labelledby="redirect-title" className="docs-redirect-card">
        <p className="docs-eyebrow">Documentation consolidated</p>
        <h1 id="redirect-title">The technical documentation has moved.</h1>
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
