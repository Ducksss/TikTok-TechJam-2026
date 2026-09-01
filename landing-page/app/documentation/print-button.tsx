'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      className="docs-print-button"
      onClick={() => window.print()}
      type="button"
    >
      <Printer aria-hidden="true" />
      Print guide
    </button>
  );
}
