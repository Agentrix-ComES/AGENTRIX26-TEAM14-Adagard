// Lightweight inline SVG icon set (24x24, stroke = currentColor). No dependency.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const BuildingIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" />
    <path d="M9 9h.01M9 12h.01M9 15h.01" />
  </svg>
);

export const BadgeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="5" />
    <path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5" />
  </svg>
);

export const DocIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const ChevronIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const ArchiveIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
  </svg>
);

export const ExternalIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

export const InboxIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z" />
  </svg>
);

export const LayersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5" />
  </svg>
);

/**
 * GovPath logo — government building (columns + pediment) with a
 * navigation route (waypoints + arrow) inside a circular navy seal.
 * Concept: "the path through civic services".
 * viewBox 0 0 100 100. Use width/height props to size.
 */
export const GovPathLogoIcon = ({
  className,
  width = 40,
  height = 40,
}: {
  className?: string;
  width?: number;
  height?: number;
}) => (
  <svg
    viewBox="0 0 100 100"
    width={width}
    height={height}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="GovPath"
    role="img"
  >
    {/* ── BACKGROUND SEAL ── */}
    <circle cx="50" cy="50" r="48" fill="#1F4E79" />
    <circle cx="50" cy="50" r="46.5" fill="none" stroke="#C8A04F" strokeWidth="2.8" />
    <circle cx="50" cy="50" r="41.5" fill="none" stroke="#C8A04F" strokeWidth="0.9" opacity="0.55" />

    {/* ── GOVERNMENT BUILDING ── */}
    {/* Pediment */}
    <polygon points="29,46 50,26 71,46" fill="#C8A04F" />
    <rect x="47" y="25" width="6" height="2.5" rx="1" fill="#C8A04F" />
    {/* Entablature */}
    <rect x="27" y="46" width="46" height="5" rx="0.5" fill="white" />
    {/* Three columns */}
    <rect x="31"   y="51" width="7" height="19" rx="1.5" fill="white" />
    <rect x="46.5" y="51" width="7" height="19" rx="1.5" fill="white" />
    <rect x="62"   y="51" width="7" height="19" rx="1.5" fill="white" />
    {/* Stylobate */}
    <rect x="27" y="70" width="46" height="4" rx="0.5" fill="white" />
    {/* Steps */}
    <rect x="23" y="74"   width="54" height="3.5" rx="0.5" fill="white" opacity="0.80" />
    <rect x="19" y="77.5" width="62" height="3.5" rx="0.5" fill="white" opacity="0.55" />

    {/* ── NAVIGATION ROUTE ── */}
    {/* Origin dot */}
    <circle cx="20" cy="88" r="3"   fill="#C8A04F" />
    <circle cx="20" cy="88" r="5.5" fill="#C8A04F" opacity="0.20" />
    {/* Dashed segment 1 */}
    <line x1="23.5" y1="88" x2="44" y2="88"
      stroke="#C8A04F" strokeWidth="2.2" strokeDasharray="3.5 3" strokeLinecap="round" />
    {/* Mid waypoint */}
    <circle cx="50" cy="88" r="3" fill="#C8A04F" />
    {/* Dashed segment 2 */}
    <line x1="53.5" y1="88" x2="72" y2="88"
      stroke="#C8A04F" strokeWidth="2.2" strokeDasharray="3.5 3" strokeLinecap="round" />
    {/* Destination arrowhead */}
    <polygon points="71,84.2 80,88 71,91.8" fill="#C8A04F" />
    <circle cx="80" cy="88" r="5" fill="#C8A04F" opacity="0.18" />
  </svg>
);
