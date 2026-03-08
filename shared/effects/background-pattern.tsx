export function DotPattern({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`absolute inset-0 -z-10 h-full w-full fill-neutral-200/50 dark:fill-neutral-800/50 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <pattern
          id="dot-pattern"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x="50%"
          y="-1"
        >
          <circle cx="1" cy="1" r="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth="0" fill="url(#dot-pattern)" />
    </svg>
  );
}

export function GridPattern({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`absolute inset-0 -z-10 h-full w-full stroke-neutral-200/50 dark:stroke-neutral-800/50 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x="50%"
          y="-1"
        >
          <path d="M.5 40V.5H40" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern)" />
    </svg>
  );
}
