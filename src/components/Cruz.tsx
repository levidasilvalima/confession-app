/** Pequena cruz decorativa. */
export function Cruz({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden="true" fill="currentColor">
      <rect x="10" y="0" width="4" height="32" rx="1" />
      <rect x="2" y="8" width="20" height="4" rx="1" />
    </svg>
  );
}
