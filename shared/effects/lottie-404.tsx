'use client'

export function Lottie404() {
  return (
    <div
      className="flex h-44 w-72 flex-col items-center justify-center rounded-2xl border border-border/70 bg-muted/30 p-6 shadow-xs"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 96"
        className="h-24 w-56 text-foreground/80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="10"
          y="10"
          width="200"
          height="76"
          rx="14"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeDasharray="5 5"
        />
        <text
          x="110"
          y="58"
          textAnchor="middle"
          fill="currentColor"
          fontSize="40"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontWeight="600"
          letterSpacing="6"
        >
          404
        </text>
        <line x1="66" y1="70" x2="154" y2="70" stroke="currentColor" strokeOpacity="0.22" />
      </svg>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
        Page Not Found
      </span>
    </div>
  )
}
