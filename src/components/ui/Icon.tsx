import type { SVGProps } from 'react'

/** Authored icon set: 24 px grid, 1.75 stroke, round caps. Decorative by default. */
const PATHS = {
  today: (
    <>
      <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  library: (
    <>
      <rect x="4" y="4" width="4.5" height="16" rx="1" />
      <rect x="10.5" y="4" width="4.5" height="16" rx="1" />
      <path d="m17 5.5 3.2 14" />
    </>
  ),
  progress: (
    <>
      <path d="m3.5 16.5 5.5-5.5 4 4 7.5-8" />
      <path d="M15 7h5.5v5.5" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.25" fill="currentColor" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.25" fill="currentColor" />
    </>
  ),
  routines: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <path d="M9 3.5h6v2.5H9zM9 11h6M9 15h6M9 19h3" />
    </>
  ),
  body: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="M8.5 10a5 5 0 0 1 7 0M12 10l1.2-2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  star: <path d="m12 3.8 2.5 5.2 5.6.8-4.1 4 1 5.6L12 16.7l-5 2.7 1-5.6-4.1-4 5.6-.8Z" />,
  play: <path d="M8 5.5v13l10.5-6.5Z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />,
  cloud: <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 10Z" />,
  cloudCheck: (
    <>
      <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 10Z" />
      <path d="m9.5 13.5 2 2 3.5-3.5" />
    </>
  ),
  cloudPending: (
    <>
      <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 10Z" />
      <path d="M12 11v3l2 1.5" />
    </>
  ),
  cloudOff: (
    <>
      <path d="M8 8.6A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1 2.6 7.6M17 18.5H7a4.5 4.5 0 0 1-1.5-8.75" />
      <path d="m3.5 3.5 17 17" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4Z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  sync: (
    <>
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3M4.5 12a7.5 7.5 0 0 1 12.8-5.3" />
      <path d="M17.5 3v3.8h-3.8M6.5 21v-3.8h3.8" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  system: (
    <>
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
