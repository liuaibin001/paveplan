export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/"
      className={`brand${compact ? " brand-compact" : ""}`}
      aria-label="PavePlan home"
    >
      <svg
        viewBox="0 0 34 34"
        className="brand-mark"
        fill="none"
        aria-hidden="true"
      >
        <rect width="34" height="34" rx="5" fill="currentColor" />
        <path
          d="M11 27 16 7h3l5 20"
          stroke="var(--road-yellow)"
          strokeWidth="2.4"
        />
        <path
          d="M17.5 10v4m0 3v4m0 3v2"
          stroke="var(--paper)"
          strokeWidth="1.5"
        />
      </svg>
      <span>
        Pave<span className="brand-light">Plan</span>
      </span>
    </a>
  );
}
