export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GrabIt logo"
    >
      <defs>
        <linearGradient id="grabit-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#grabit-grad)" />
      {/* download arrow (also reads as a "G" opening) */}
      <path
        d="M20 9 v13"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14 17 l6 6 l6 -6"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* tray */}
      <path
        d="M11 28 h18"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* small accent dot – gives it a photo/media feel */}
      <circle cx="30.5" cy="11.5" r="2" fill="white" opacity="0.9" />
    </svg>
  );
}

export function LogoWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-lg font-semibold tracking-tight">
      {children}
    </span>
  );
}

export default function Logo({
  brand,
  size = 36,
}: {
  brand: React.ReactNode;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <LogoWord>{brand}</LogoWord>
    </span>
  );
}
