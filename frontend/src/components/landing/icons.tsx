export function ArrowUpRightIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
      <path
        d="M7 17L17 7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 7h10v10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 7v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GlobeIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M3 12h18" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 3c3.5 3.7 3.5 13.3 0 18"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 3c-3.5 3.7-3.5 13.3 0 18"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

